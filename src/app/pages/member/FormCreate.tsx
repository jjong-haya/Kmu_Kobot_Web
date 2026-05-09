import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent, ReactNode, SetStateAction } from "react";
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from "react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  GitBranch,
  GripVertical,
  ListPlus,
  MessageSquareText,
  Plus,
  Save,
  Settings2,
  Tags,
  Trash2,
} from "lucide-react";
import {
  FORM_PERSONAL_INFO_FIELDS,
  FORM_QUESTION_TYPE_OPTIONS,
  FORM_STATUS_LABELS,
  createBlankQuestion,
  getForm,
  getFormDetailPath,
  questionTypeNeedsOptions,
  saveForm,
  type ClubForm,
  type ClubFormStatus,
  type CreateClubFormInput,
  type FormQuestion,
  type FormQuestionOption,
  type FormQuestionType,
  type TournamentSettings,
} from "../../api/forms";
import { listTags, type MemberTag } from "../../api/tags";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 0,
  background: "#f5f6fa",
};

const SESSION_DRAFT_STORAGE_PREFIX = "kobot:forms:draft-session-v1";
const SESSION_DRAFT_STORAGE_VERSION = 1;
const SESSION_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

type StoredSessionDraft = {
  version: typeof SESSION_DRAFT_STORAGE_VERSION;
  baseSnapshot: string;
  savedAt: string;
  draft: CreateClubFormInput;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type OptionAccent = {
  border: string;
  line: string;
  surface: string;
  text: string;
};

const OPTION_ACCENTS: OptionAccent[] = [
  { border: "#bfdbfe", line: "#2563eb", surface: "#eff6ff", text: "#1d4ed8" },
  { border: "#bbf7d0", line: "#16a34a", surface: "#f0fdf4", text: "#15803d" },
  { border: "#fde68a", line: "#d97706", surface: "#fffbeb", text: "#b45309" },
  { border: "#fecdd3", line: "#e11d48", surface: "#fff1f2", text: "#be123c" },
  { border: "#ddd6fe", line: "#7c3aed", surface: "#f5f3ff", text: "#6d28d9" },
  { border: "#a5f3fc", line: "#0891b2", surface: "#ecfeff", text: "#0e7490" },
];

function getOptionAccent(index: number) {
  return OPTION_ACCENTS[index % OPTION_ACCENTS.length];
}

function isInteractiveElement(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("input, textarea, select, button, a, summary, [role='button']"))
  );
}

type ThreadScrollState = {
  canGoBack: boolean;
  canGoForward: boolean;
};

const EMPTY_THREAD_SCROLL_STATE: ThreadScrollState = {
  canGoBack: false,
  canGoForward: false,
};

function getThreadScrollState(element: HTMLDivElement | null): ThreadScrollState {
  if (!element || element.scrollWidth <= element.clientWidth) {
    return EMPTY_THREAD_SCROLL_STATE;
  }

  const maxScroll = element.scrollWidth - element.clientWidth;

  return {
    canGoBack: element.scrollLeft > 4,
    canGoForward: element.scrollLeft < maxScroll - 4,
  };
}

function emptyTournament(): TournamentSettings {
  return {
    enabled: false,
    title: "",
    maxTeamSize: 3,
    leagueType: "round_robin",
    teams: [],
    matches: [],
  };
}

function createInitialDraft(): CreateClubFormInput {
  return {
    title: "",
    description: "",
    category: "participant_survey",
    status: "active",
    acceptsResponses: true,
    requiresLogin: true,
    commentsEnabled: true,
    responseWindow: {},
    questions: [
      {
        id: "initial-attendance-question",
        title: "참여 여부",
        type: "single_choice",
        required: true,
        options: [
          { id: "initial-attendance-yes", label: "참여" },
          { id: "initial-attendance-no", label: "불참" },
          { id: "initial-attendance-maybe", label: "미정" },
        ],
      },
    ],
    tournament: emptyTournament(),
  };
}

function createDraftFromForm(form: ClubForm): CreateClubFormInput {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    category: form.category,
    status: form.status,
    acceptsResponses: form.acceptsResponses,
    requiresLogin: form.requiresLogin,
    commentsEnabled: form.commentsEnabled,
    responseWindow: form.responseWindow,
    questions: form.questions,
    tournament: form.tournament,
    responseSheet: form.responseSheet,
  };
}

function toDateTimeLocalValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function serializeDraft(draft: CreateClubFormInput) {
  return JSON.stringify(draft);
}

function getSessionDraftKey(formId?: string) {
  return `${SESSION_DRAFT_STORAGE_PREFIX}:${formId ? `edit:${encodeURIComponent(formId)}` : "new"}`;
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readSessionDraft(key: string, baseSnapshot: string) {
  if (!canUseSessionStorage()) return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredSessionDraft>;
    const savedAt = parsed.savedAt ? new Date(parsed.savedAt) : null;
    const expired =
      !savedAt ||
      Number.isNaN(savedAt.getTime()) ||
      Date.now() - savedAt.getTime() > SESSION_DRAFT_TTL_MS;

    if (
      parsed.version !== SESSION_DRAFT_STORAGE_VERSION ||
      parsed.baseSnapshot !== baseSnapshot ||
      !parsed.draft ||
      expired
    ) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed.draft;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writeSessionDraft(key: string, draft: CreateClubFormInput, baseSnapshot: string) {
  if (!canUseSessionStorage()) return;

  const payload: StoredSessionDraft = {
    version: SESSION_DRAFT_STORAGE_VERSION,
    baseSnapshot,
    savedAt: new Date().toISOString(),
    draft,
  };

  window.sessionStorage.setItem(key, JSON.stringify(payload));
}

function clearSessionDraft(key: string) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(key);
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function cloneQuestion(question: FormQuestion): FormQuestion {
  const id = `question-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...question,
    id,
    title: `${question.title || "질문"} 복사본`,
    options: question.options?.map((option, index) => ({
      ...option,
      id: `${id}-option-${index + 1}`,
    })),
  };
}

function linkedGroupKey(parentQuestionId: string, optionId: string) {
  return `${parentQuestionId}::${optionId}`;
}

function orderQuestionsByRootQuestions(rootQuestions: FormQuestion[], questions: FormQuestion[]) {
  const childrenByParent = new Map<string, FormQuestion[]>();

  questions.forEach((question) => {
    if (!question.visibleWhen) return;
    const children = childrenByParent.get(question.visibleWhen.parentQuestionId) ?? [];
    children.push(question);
    childrenByParent.set(question.visibleWhen.parentQuestionId, children);
  });

  return rootQuestions.flatMap((question) => [
    question,
    ...(childrenByParent.get(question.id) ?? []),
  ]);
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-[12px] font-bold uppercase tracking-normal text-[#64748b]">
      {children}
    </span>
  );
}

function LineInput({
  className,
  multiline = false,
  placeholder,
  value,
  onChange,
}: {
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!multiline || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [multiline, value]);

  function preventAccidentalSubmit(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.stopPropagation();
  }

  if (multiline) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={1}
        className={cn(
          "w-full resize-none overflow-hidden border-0 border-b border-[#d6dce7] bg-transparent px-0 py-2 leading-relaxed text-[#111827] outline-none transition-colors placeholder:text-[#9aa5b5] focus:border-[#103078]",
          className,
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={preventAccidentalSubmit}
      className={cn(
        "w-full border-0 border-b border-[#d6dce7] bg-transparent px-0 py-2 text-[#111827] outline-none transition-colors placeholder:text-[#9aa5b5] focus:border-[#103078]",
        className,
      )}
      placeholder={placeholder}
    />
  );
}

function IconRailButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="group/rail inline-flex h-11 w-11 min-w-11 items-center justify-start overflow-hidden rounded-full border border-[#d8deea] bg-white px-3 text-[#4b5565] shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-[width,border-color,color,box-shadow,transform] duration-200 ease-out hover:w-[176px] hover:-translate-y-0.5 hover:border-[#103078] hover:text-[#103078] hover:shadow-[0_12px_28px_rgba(15,48,120,0.16)] focus-visible:w-[176px] focus-visible:border-[#103078] focus-visible:text-[#103078] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9c9f5]"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{children}</span>
      <span className="ml-0 max-w-0 whitespace-nowrap text-[13px] font-black opacity-0 transition-[max-width,margin,opacity] duration-200 ease-out group-hover/rail:ml-2 group-hover/rail:max-w-[120px] group-hover/rail:opacity-100 group-focus-visible/rail:ml-2 group-focus-visible/rail:max-w-[120px] group-focus-visible/rail:opacity-100">
        {label}
      </span>
    </button>
  );
}

function CompactIconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#eef2f8] hover:text-[#103078] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function RequiredSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-bold text-[#334155]">
      필수
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          checked ? "bg-[#103078]" : "bg-[#cbd5e1]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </span>
    </label>
  );
}

function PersonalInfoPreview() {
  return (
    <section className="rounded-[8px] border border-[#d8deea] border-l-[5px] border-l-[#2f7d58] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-black text-[#2f7d58]">고정 응답자 정보</div>
          <h2 className="m-0 mt-1 text-[18px] font-black text-[#111827]">개인정보 응답 카드</h2>
        </div>
        <span className="rounded-full border border-[#cfe8da] bg-[#f0fbf4] px-3 py-1 text-[12px] font-black text-[#2f7d58]">
          자동 입력 · 수정 가능
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {FORM_PERSONAL_INFO_FIELDS.map((field) => (
          <div key={field.key} className="grid gap-1 rounded-[8px] border border-[#e5eaf2] bg-[#fbfcfe] px-3 py-2">
            <span className="text-[12px] font-black text-[#64748b]">{field.label}</span>
            <span className="text-[14px] font-semibold text-[#94a3b8]">{field.placeholder}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getThreadCardScrollLeft(thread: HTMLDivElement, card: HTMLElement) {
  const threadRect = thread.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  return thread.scrollLeft + cardRect.left - threadRect.left;
}

function getThreadPageForTarget(thread: HTMLDivElement, target: HTMLElement) {
  let current: HTMLElement | null = target;

  while (current && current.parentElement !== thread) {
    current = current.parentElement;
  }

  return current?.parentElement === thread ? current : target;
}

function scrollLinkedStackToItem(target: HTMLElement) {
  const stack = target.closest(".kb-linked-question-stack");
  if (!(stack instanceof HTMLElement)) return;

  const stackRect = stack.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  stack.scrollTo({
    top: stack.scrollTop + targetRect.top - stackRect.top - 12,
    behavior: "smooth",
  });
}

function getThreadCards(element: HTMLDivElement) {
  return Array.from(element.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
}

function getActiveThreadCard(element: HTMLDivElement) {
  const cards = getThreadCards(element);
  if (cards.length === 0) return null;

  return cards.reduce(
    (closest, card) => {
      const distance = Math.abs(getThreadCardScrollLeft(element, card) - element.scrollLeft);
      return distance < closest.distance ? { card, distance } : closest;
    },
    { card: cards[0], distance: Number.POSITIVE_INFINITY },
  ).card;
}

function QuestionThread({
  children,
  hasLinkedQuestions,
  itemCount,
  scrollRequestVersion,
  scrollToItemId,
}: {
  children: ReactNode;
  hasLinkedQuestions: boolean;
  itemCount: number;
  scrollRequestVersion: number;
  scrollToItemId?: string | null;
}) {
  const threadRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    active: false,
    scrollLeft: 0,
    startX: 0,
  });
  const [scrollState, setScrollState] = useState(EMPTY_THREAD_SCROLL_STATE);
  const [activePageHeight, setActivePageHeight] = useState<number | null>(null);

  function updateScrollState(element = threadRef.current) {
    setScrollState(getThreadScrollState(element));
    updateActivePageHeight(element);
  }

  function updateActivePageHeight(element = threadRef.current) {
    if (!element || !hasLinkedQuestions) {
      setActivePageHeight(null);
      return;
    }

    const activeCard = getActiveThreadCard(element);
    if (!activeCard) return;

    const nextHeight = Math.ceil(activeCard.getBoundingClientRect().height);
    setActivePageHeight((currentHeight) =>
      currentHeight !== null && Math.abs(currentHeight - nextHeight) <= 1
        ? currentHeight
        : nextHeight,
    );
  }

  function getCardLeft(element: HTMLDivElement, card: HTMLElement) {
    return getThreadCardScrollLeft(element, card);
  }

  function moveByCard(direction: -1 | 1) {
    const element = threadRef.current;
    if (!element) return;

    const cards = getThreadCards(element);
    if (cards.length <= 1) return;

    const currentIndex = cards.reduce(
      (closest, card, cardIndex) => {
        const distance = Math.abs(getCardLeft(element, card) - element.scrollLeft);
        return distance < closest.distance ? { distance, index: cardIndex } : closest;
      },
      { distance: Number.POSITIVE_INFINITY, index: 0 },
    ).index;
    const nextIndex = Math.min(cards.length - 1, Math.max(0, currentIndex + direction));

    element.scrollTo({
      left: getCardLeft(element, cards[nextIndex]),
      behavior: "smooth",
    });
    window.setTimeout(() => updateScrollState(element), 320);
  }

  useEffect(() => {
    const element = threadRef.current;
    if (!element) return;

    if (!hasLinkedQuestions) {
      element.scrollLeft = 0;
      updateScrollState(element);
      return;
    }

    updateScrollState(element);

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => updateScrollState(element));
    observer.observe(element);
    getThreadCards(element).forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [hasLinkedQuestions, itemCount]);

  useEffect(() => {
    if (!hasLinkedQuestions || !scrollToItemId) return;

    let timeoutId: number | undefined;
    const frameId = window.requestAnimationFrame(() => {
      const element = threadRef.current;
      if (!element) return;

      const targetCard = element.querySelector(`[data-thread-item-id="${scrollToItemId}"]`);
      if (!targetCard) return;
      if (!(targetCard instanceof HTMLElement)) return;
      const targetPage = getThreadPageForTarget(element, targetCard);

      element.scrollTo({
        left: getCardLeft(element, targetPage),
        behavior: "smooth",
      });
      scrollLinkedStackToItem(targetCard);
      timeoutId = window.setTimeout(() => updateScrollState(element), 320);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [hasLinkedQuestions, itemCount, scrollRequestVersion, scrollToItemId]);

  return (
    <div className="w-full min-w-0">
      <div className="relative min-w-0">
      <div
        ref={threadRef}
        style={
          hasLinkedQuestions && activePageHeight
            ? { height: activePageHeight }
            : undefined
        }
        className={cn(
          "kb-form-thread-scroll flex min-w-0 items-start gap-4 overscroll-x-contain",
          hasLinkedQuestions
            ? "cursor-grab snap-x snap-mandatory overflow-x-auto overflow-y-hidden active:cursor-grabbing"
            : "overflow-x-hidden",
        )}
        onScroll={(event) => updateScrollState(event.currentTarget)}
        onPointerDown={(event) => {
          const target = event.target;
          if (
            !hasLinkedQuestions ||
            event.button !== 0 ||
            isInteractiveElement(target) ||
            (target instanceof Element && target.closest(".kb-linked-question-stack"))
          ) {
            return;
          }

          dragRef.current = {
            active: true,
            scrollLeft: event.currentTarget.scrollLeft,
            startX: event.clientX,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag.active) return;

          const deltaX = event.clientX - drag.startX;
          event.currentTarget.scrollLeft = drag.scrollLeft - deltaX;
          if (Math.abs(deltaX) > 2) {
            event.preventDefault();
          }
        }}
        onPointerUp={(event) => {
          dragRef.current.active = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={(event) => {
          dragRef.current.active = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
      >
        {children}
      </div>

      {hasLinkedQuestions ? (
        <>
          <button
            type="button"
            aria-label="이전 연결 카드"
            title="이전 연결 카드"
            disabled={!scrollState.canGoBack}
            onClick={() => moveByCard(-1)}
            className="absolute -left-9 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center border-0 bg-transparent text-[#103078] transition-[color,opacity,transform] hover:-translate-x-0.5 hover:text-[#0b2460] disabled:cursor-not-allowed disabled:opacity-20"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="다음 연결 카드"
            title="다음 연결 카드"
            disabled={!scrollState.canGoForward}
            onClick={() => moveByCard(1)}
            className="absolute -right-9 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center border-0 bg-transparent text-[#103078] transition-[color,opacity,transform] hover:translate-x-0.5 hover:text-[#0b2460] disabled:cursor-not-allowed disabled:opacity-20"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={1.8} />
          </button>
        </>
      ) : null}
      </div>
    </div>
  );
}

function QuestionBlock({
  accentColor,
  canAddLinkedQuestions = false,
  canMoveDown,
  canMoveUp,
  index,
  linkedOptionCounts = {},
  markerLabel,
  memberTags = [],
  optionAccents = {},
  question,
  onAddLinkedQuestion,
  onAddLinkedQuestionBelow,
  onChange,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onRemove,
}: {
  accentColor?: string;
  canAddLinkedQuestions?: boolean;
  canMoveDown: boolean;
  canMoveUp: boolean;
  index: number;
  linkedOptionCounts?: Record<string, number>;
  markerLabel?: string;
  memberTags?: MemberTag[];
  optionAccents?: Record<string, OptionAccent>;
  question: FormQuestion;
  onAddLinkedQuestion?: (option: FormQuestionOption) => void;
  onAddLinkedQuestionBelow?: () => void;
  onChange: (question: FormQuestion) => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}) {
  const isLinkedQuestion = Boolean(question.visibleWhen);
  const questionAccentColor = accentColor ?? (isLinkedQuestion ? "#7c3aed" : "#103078");

  function changeType(type: FormQuestionType) {
    onChange({
      ...question,
      type,
      options: questionTypeNeedsOptions(type)
        ? question.options && question.options.length > 0
          ? question.options
          : [
              { id: `${question.id}-option-1`, label: "선택지 1" },
              { id: `${question.id}-option-2`, label: "선택지 2" },
            ]
        : undefined,
      scaleMin: type === "linear_scale" ? question.scaleMin ?? 1 : undefined,
      scaleMax: type === "linear_scale" ? question.scaleMax ?? 5 : undefined,
      scaleMinLabel: type === "linear_scale" ? question.scaleMinLabel ?? "낮음" : undefined,
      scaleMaxLabel: type === "linear_scale" ? question.scaleMaxLabel ?? "높음" : undefined,
      memberSearchTagIds: type === "member_search" ? question.memberSearchTagIds ?? [] : undefined,
      memberSearchMax: type === "member_search" ? question.memberSearchMax ?? 5 : undefined,
    });
  }

  function updateOption(optionIndex: number, label: string) {
    const options = [...(question.options ?? [])];
    options[optionIndex] = { ...options[optionIndex], label };
    onChange({ ...question, options });
  }

  function addOption() {
    const nextIndex = (question.options?.length ?? 0) + 1;
    onChange({
      ...question,
      options: [
        ...(question.options ?? []),
        { id: `${question.id}-option-${nextIndex}`, label: `선택지 ${nextIndex}` },
      ],
    });
  }

  function removeOption(optionIndex: number) {
    onChange({
      ...question,
      options: (question.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex),
    });
  }

  function toggleMemberSearchTag(tagId: string) {
    const current = new Set(question.memberSearchTagIds ?? []);
    if (current.has(tagId)) {
      current.delete(tagId);
    } else {
      current.add(tagId);
    }
    onChange({ ...question, memberSearchTagIds: Array.from(current) });
  }

  return (
    <section
      className="group relative rounded-[8px] border border-[#d8deea] border-l-[5px] bg-white px-6 py-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
      style={{ borderLeftColor: questionAccentColor }}
    >
      <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[#c0c8d4] opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
        <div>
          <div className="mb-1 text-[12px] font-black" style={{ color: questionAccentColor }}>
            {markerLabel ?? `질문 ${index + 1}`}
          </div>
          <LineInput
            value={question.title}
            onChange={(title) => onChange({ ...question, title })}
            multiline
            className="text-[18px] font-black"
            placeholder="질문을 입력하세요"
          />
          <LineInput
            value={question.description ?? ""}
            onChange={(description) => onChange({ ...question, description })}
            multiline
            className="mt-2 text-[13px] font-medium text-[#64748b]"
            placeholder="설명 추가"
          />
        </div>

        <label className="grid gap-2">
          <FieldLabel>질문 유형</FieldLabel>
          <select
            value={question.type}
            onChange={(event) => changeType(event.target.value as FormQuestionType)}
            className="h-11 rounded-[8px] border border-[#d8deea] bg-white px-3 text-[13px] font-bold text-[#334155] outline-none transition-colors focus:border-[#103078]"
          >
            {FORM_QUESTION_TYPE_OPTIONS.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {questionTypeNeedsOptions(question.type) ? (
        <div className="mt-5 grid gap-3">
          {(question.options ?? []).map((option, optionIndex) => (
            <div
              key={option.id}
              className={cn(
                "grid items-center gap-2",
                canAddLinkedQuestions && onAddLinkedQuestion
                  ? "grid-cols-[24px_minmax(0,1fr)_36px_36px]"
                  : "grid-cols-[24px_minmax(0,1fr)_36px]",
              )}
            >
              <span
                className="h-4 w-4 rounded-full border-2 border-[#94a3b8]"
                style={
                  optionAccents[option.id]
                    ? {
                        backgroundColor: optionAccents[option.id].surface,
                        borderColor: optionAccents[option.id].line,
                      }
                    : undefined
                }
              />
              <div className="min-w-0">
                <LineInput
                  value={option.label}
                  onChange={(label) => updateOption(optionIndex, label)}
                  className="text-[14px] font-semibold"
                  placeholder={`선택지 ${optionIndex + 1}`}
                />
                {linkedOptionCounts[option.id] ? (
                  <div
                    className="mt-1 text-[11px] font-black"
                    style={{ color: optionAccents[option.id]?.text ?? "#7c3aed" }}
                  >
                    연결 질문 {linkedOptionCounts[option.id]}개
                  </div>
                ) : null}
              </div>
              {canAddLinkedQuestions && onAddLinkedQuestion ? (
                <CompactIconButton
                  label={
                    linkedOptionCounts[option.id]
                      ? `${option.label || "선택지"} 연결 질문으로 이동`
                      : `${option.label || "선택지"} 선택 시 연결 질문 추가`
                  }
                  onClick={() => onAddLinkedQuestion(option)}
                >
                  <GitBranch
                    className="h-4 w-4"
                    style={{ color: optionAccents[option.id]?.line }}
                  />
                </CompactIconButton>
              ) : null}
              <CompactIconButton label="선택지 삭제" onClick={() => removeOption(optionIndex)}>
                <Trash2 className="h-4 w-4" />
              </CompactIconButton>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="ml-8 w-fit text-[13px] font-black text-[#103078] underline-offset-4 hover:underline"
          >
            선택지 추가
          </button>
        </div>
      ) : null}

      {question.type === "linear_scale" ? (
        <div className="mt-5 grid gap-4 border-t border-[#edf1f6] pt-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <FieldLabel>최소값</FieldLabel>
            <input
              type="number"
              min={0}
              value={question.scaleMin ?? 1}
              onChange={(event) =>
                onChange({ ...question, scaleMin: Number.parseInt(event.target.value, 10) || 1 })
              }
              className="h-10 rounded-[8px] border border-[#d8deea] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>최대값</FieldLabel>
            <input
              type="number"
              min={1}
              value={question.scaleMax ?? 5}
              onChange={(event) =>
                onChange({ ...question, scaleMax: Number.parseInt(event.target.value, 10) || 5 })
              }
              className="h-10 rounded-[8px] border border-[#d8deea] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>최소 라벨</FieldLabel>
            <LineInput
              value={question.scaleMinLabel ?? ""}
              onChange={(scaleMinLabel) => onChange({ ...question, scaleMinLabel })}
              placeholder="낮음"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>최대 라벨</FieldLabel>
            <LineInput
              value={question.scaleMaxLabel ?? ""}
              onChange={(scaleMaxLabel) => onChange({ ...question, scaleMaxLabel })}
              placeholder="높음"
            />
          </label>
        </div>
      ) : null}

      {question.type === "member_search" ? (
        <div className="mt-5 grid gap-4 border-t border-[#edf1f6] pt-4">
          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <label className="grid gap-2">
              <FieldLabel>선택 인원 제한</FieldLabel>
              <input
                type="number"
                min={1}
                max={20}
                value={question.memberSearchMax ?? 5}
                onChange={(event) =>
                  onChange({
                    ...question,
                    memberSearchMax: Math.max(1, Math.min(20, Number.parseInt(event.target.value, 10) || 1)),
                  })
                }
                className="h-10 rounded-[8px] border border-[#d8deea] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
              />
            </label>
            <div className="grid gap-2">
              <FieldLabel>검색 태그 제한</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {memberTags.length > 0 ? (
                  memberTags.map((tag) => {
                    const checked = (question.memberSearchTagIds ?? []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleMemberSearchTag(tag.id)}
                        className={cn(
                          "inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[12px] font-black transition-colors",
                          checked
                            ? "border-[#103078] bg-[#eef4ff] text-[#103078]"
                            : "border-[#d8deea] bg-white text-[#64748b] hover:border-[#103078]",
                        )}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.label}
                      </button>
                    );
                  })
                ) : (
                  <span className="inline-flex h-9 items-center text-[12px] font-bold text-[#64748b]">
                    태그를 불러오지 못했거나 아직 태그가 없습니다.
                  </span>
                )}
              </div>
              <p className="m-0 flex items-center gap-1 text-[12px] font-semibold text-[#64748b]">
                <Tags className="h-3.5 w-3.5" />
                선택하지 않으면 전체 활성 회원에서 검색합니다.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-1 border-t border-[#edf1f6] pt-3">
        {isLinkedQuestion && onAddLinkedQuestionBelow ? (
          <>
            <CompactIconButton label="아래 연결 질문 추가" onClick={onAddLinkedQuestionBelow}>
              <Plus className="h-4 w-4" />
            </CompactIconButton>
            <span className="mx-2 h-6 w-px bg-[#d8deea]" />
          </>
        ) : null}
        <CompactIconButton label="위로 이동" disabled={!canMoveUp} onClick={onMoveUp}>
          <ArrowUp className="h-4 w-4" />
        </CompactIconButton>
        <CompactIconButton label="아래로 이동" disabled={!canMoveDown} onClick={onMoveDown}>
          <ArrowDown className="h-4 w-4" />
        </CompactIconButton>
        <CompactIconButton label="복제" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </CompactIconButton>
        <CompactIconButton label="삭제" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </CompactIconButton>
        <span className="mx-2 h-6 w-px bg-[#d8deea]" />
        <RequiredSwitch
          checked={question.required}
          onChange={(required) => onChange({ ...question, required })}
        />
      </div>
    </section>
  );
}

export default function FormCreate() {
  const navigate = useNavigate();
  const { formId } = useParams();
  const isEditMode = Boolean(formId);
  const sessionDraftKey = useMemo(() => getSessionDraftKey(formId), [formId]);
  const initialDraftSnapshotRef = useRef("");
  const hasUnsavedChangesRef = useRef(false);
  const allowNavigationRef = useRef(false);
  const [draft, setDraft] = useState<CreateClubFormInput>(() => {
    const initialDraft = createInitialDraft();
    initialDraftSnapshotRef.current = serializeDraft(initialDraft);
    return initialDraft;
  });
  const [loadingExistingForm, setLoadingExistingForm] = useState(Boolean(formId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberTags, setMemberTags] = useState<MemberTag[]>([]);
  const [pendingLinkedQuestionId, setPendingLinkedQuestionId] = useState<string | null>(null);
  const [linkedQuestionFocusVersion, setLinkedQuestionFocusVersion] = useState(0);

  const draftSnapshot = useMemo(() => serializeDraft(draft), [draft]);
  const hasUnsavedChanges = draftSnapshot !== initialDraftSnapshotRef.current;
  const requiredCount = useMemo(
    () => draft.questions.filter((question) => question.required).length,
    [draft.questions],
  );
  const rootQuestions = useMemo(
    () => draft.questions.filter((question) => !question.visibleWhen),
    [draft.questions],
  );
  const linkedQuestionsByOption = useMemo(() => {
    const groups = new Map<string, FormQuestion[]>();

    draft.questions.forEach((question) => {
      if (!question.visibleWhen) return;
      const key = linkedGroupKey(question.visibleWhen.parentQuestionId, question.visibleWhen.optionId);
      groups.set(key, [...(groups.get(key) ?? []), question]);
    });

    return groups;
  }, [draft.questions]);
  const linkedQuestionCount = draft.questions.length - rootQuestions.length;
  const responseWindowSet = Boolean(draft.responseWindow.startsAt || draft.responseWindow.endsAt);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const sameLocation =
      currentLocation.pathname === nextLocation.pathname &&
      currentLocation.search === nextLocation.search &&
      currentLocation.hash === nextLocation.hash;

    return hasUnsavedChangesRef.current && !allowNavigationRef.current && !sameLocation;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadExistingForm() {
      if (!formId) {
        const initialDraft = createInitialDraft();
        const baseSnapshot = serializeDraft(initialDraft);
        const sessionDraft = readSessionDraft(sessionDraftKey, baseSnapshot);
        initialDraftSnapshotRef.current = baseSnapshot;
        hasUnsavedChangesRef.current = Boolean(sessionDraft);
        setDraft(sessionDraft ?? initialDraft);
        setLoadingExistingForm(false);
        setError(null);
        return;
      }

      setLoadingExistingForm(true);
      setError(null);
      try {
        const existingForm = await getForm(formId);
        if (cancelled) return;
        if (!existingForm) {
          setError("수정할 폼을 찾지 못했습니다.");
          return;
        }

        const nextDraft = createDraftFromForm(existingForm);
        const baseSnapshot = serializeDraft(nextDraft);
        const sessionDraft = readSessionDraft(sessionDraftKey, baseSnapshot);
        initialDraftSnapshotRef.current = baseSnapshot;
        hasUnsavedChangesRef.current = Boolean(sessionDraft);
        setDraft(sessionDraft ?? nextDraft);
      } catch (requestError) {
        if (!cancelled) {
          setError(sanitizeUserError(requestError, "폼을 불러오지 못했습니다."));
        }
      } finally {
        if (!cancelled) setLoadingExistingForm(false);
      }
    }

    void loadExistingForm();

    return () => {
      cancelled = true;
    };
  }, [formId, sessionDraftKey]);

  useEffect(() => {
    let cancelled = false;

    listTags()
      .then((tags) => {
        if (!cancelled) setMemberTags(tags);
      })
      .catch(() => {
        if (!cancelled) setMemberTags([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (loadingExistingForm) return;

    if (!hasUnsavedChanges) {
      clearSessionDraft(sessionDraftKey);
      return;
    }

    writeSessionDraft(sessionDraftKey, draft, initialDraftSnapshotRef.current);
  }, [draft, hasUnsavedChanges, loadingExistingForm, sessionDraftKey]);

  useBeforeUnload((event) => {
    if (!hasUnsavedChangesRef.current || allowNavigationRef.current) return;
    event.preventDefault();
    event.returnValue = "";
  });

  function persistDraftEdit(nextDraft: CreateClubFormInput) {
    const nextSnapshot = serializeDraft(nextDraft);

    if (nextSnapshot === initialDraftSnapshotRef.current) {
      hasUnsavedChangesRef.current = false;
      clearSessionDraft(sessionDraftKey);
      return;
    }

    hasUnsavedChangesRef.current = true;
    writeSessionDraft(sessionDraftKey, nextDraft, initialDraftSnapshotRef.current);
  }

  function updateDraft(update: SetStateAction<CreateClubFormInput>) {
    setDraft((current) => {
      const nextDraft =
        typeof update === "function"
          ? (update as (current: CreateClubFormInput) => CreateClubFormInput)(current)
          : update;

      persistDraftEdit(nextDraft);
      return nextDraft;
    });
  }

  function getDraftValidationError() {
    if (!draft.title.trim()) {
      return "폼 제목을 입력해 주세요.";
    }

    if (draft.responseWindow.startsAt && draft.responseWindow.endsAt) {
      const startsAt = new Date(draft.responseWindow.startsAt);
      const endsAt = new Date(draft.responseWindow.endsAt);
      if (startsAt.getTime() > endsAt.getTime()) {
        return "응답 시작 시각은 마감 시각보다 빨라야 합니다.";
      }
    }

    const invalidQuestion = draft.questions.find((question) => {
      if (!question.title.trim()) return true;
      if (questionTypeNeedsOptions(question.type)) {
        return !question.options || question.options.filter((option) => option.label.trim()).length < 2;
      }
      return false;
    });

    if (invalidQuestion) {
      return "질문 제목과 선택지 2개 이상이 필요한 질문을 확인해 주세요.";
    }

    return null;
  }

  async function saveCurrentDraft() {
    setError(null);
    const validationError = getDraftValidationError();
    if (validationError) {
      setError(validationError);
      return null;
    }

    setSubmitting(true);
    try {
      const saved = await saveForm(draft);
      initialDraftSnapshotRef.current = draftSnapshot;
      hasUnsavedChangesRef.current = false;
      clearSessionDraft(sessionDraftKey);
      return saved;
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "폼을 저장하지 못했습니다."));
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  function updateQuestion(questionId: string, question: FormQuestion) {
    updateDraft((current) => {
      const optionIds = new Set((question.options ?? []).map((option) => option.id));

      return {
        ...current,
        questions: current.questions
          .map((item) => (item.id === questionId ? question : item))
          .filter((item) => {
            if (item.id === questionId) return true;
            if (item.visibleWhen?.parentQuestionId !== questionId) return true;
            return optionIds.has(item.visibleWhen.optionId);
          }),
      };
    });
  }

  function addQuestion(type: FormQuestionType = "short_text") {
    updateDraft((current) => ({
      ...current,
      questions: [...current.questions, createBlankQuestion(type)],
    }));
  }

  function focusLinkedQuestion(questionId: string) {
    setPendingLinkedQuestionId(questionId);
    setLinkedQuestionFocusVersion((version) => version + 1);

    window.requestAnimationFrame(() => {
      const targetCard = Array.from(document.querySelectorAll("[data-thread-item-id]")).find(
        (element) => element.getAttribute("data-thread-item-id") === questionId,
      );
      const thread = targetCard?.closest(".kb-form-thread-scroll");
      if (!(targetCard instanceof HTMLElement) || !(thread instanceof HTMLDivElement)) return;
      const targetPage = getThreadPageForTarget(thread, targetCard);

      thread.scrollTo({
        left: getThreadCardScrollLeft(thread, targetPage),
        behavior: "smooth",
      });
      scrollLinkedStackToItem(targetCard);
    });
  }

  function addLinkedQuestion(parentQuestionId: string, option: FormQuestionOption) {
    const existingLinkedQuestion = draft.questions.find(
      (question) =>
        question.visibleWhen?.parentQuestionId === parentQuestionId &&
        question.visibleWhen.optionId === option.id,
    );

    if (existingLinkedQuestion) {
      focusLinkedQuestion(existingLinkedQuestion.id);
      return;
    }

    const blankQuestion = createBlankQuestion("short_text");
    const linkedQuestion: FormQuestion = {
      ...blankQuestion,
      title: `${option.label || "선택지"} 추가 정보`,
      description: "",
      required: true,
      visibleWhen: {
        parentQuestionId,
        optionId: option.id,
      },
    };

    focusLinkedQuestion(linkedQuestion.id);

    updateDraft((current) => {
      const parentIndex = current.questions.findIndex((question) => question.id === parentQuestionId);
      if (parentIndex === -1) return current;

      let insertIndex = parentIndex + 1;
      while (
        insertIndex < current.questions.length &&
        current.questions[insertIndex].visibleWhen?.parentQuestionId === parentQuestionId
      ) {
        insertIndex += 1;
      }

      return {
        ...current,
        questions: [
          ...current.questions.slice(0, insertIndex),
          linkedQuestion,
          ...current.questions.slice(insertIndex),
        ],
      };
    });
  }

  function addLinkedQuestionBelow(referenceQuestion: FormQuestion) {
    const condition = referenceQuestion.visibleWhen;
    if (!condition) return;

    const parentQuestion = draft.questions.find((question) => question.id === condition.parentQuestionId);
    const option = parentQuestion?.options?.find((item) => item.id === condition.optionId);
    if (!parentQuestion || !option) return;

    const blankQuestion = createBlankQuestion("short_text");
    const linkedQuestion: FormQuestion = {
      ...blankQuestion,
      title: `${option.label || "선택지"} 추가 질문`,
      description: "",
      required: false,
      visibleWhen: {
        parentQuestionId: parentQuestion.id,
        optionId: option.id,
      },
    };

    focusLinkedQuestion(linkedQuestion.id);

    updateDraft((current) => {
      const referenceIndex = current.questions.findIndex(
        (question) => question.id === referenceQuestion.id,
      );
      if (referenceIndex === -1) return current;

      return {
        ...current,
        questions: [
          ...current.questions.slice(0, referenceIndex + 1),
          linkedQuestion,
          ...current.questions.slice(referenceIndex + 1),
        ],
      };
    });
  }

  function duplicateQuestion(question: FormQuestion) {
    updateDraft((current) => {
      const questionIndex = current.questions.findIndex((item) => item.id === question.id);
      if (questionIndex === -1) return current;

      return {
        ...current,
        questions: [
          ...current.questions.slice(0, questionIndex + 1),
          cloneQuestion(question),
          ...current.questions.slice(questionIndex + 1),
        ],
      };
    });
  }

  function moveRootQuestion(index: number, direction: -1 | 1) {
    updateDraft((current) => {
      const currentRootQuestions = current.questions.filter((question) => !question.visibleWhen);
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= currentRootQuestions.length) return current;

      return {
        ...current,
        questions: orderQuestionsByRootQuestions(
          moveItem(currentRootQuestions, index, nextIndex),
          current.questions,
        ),
      };
    });
  }

  function removeQuestion(questionId: string) {
    updateDraft((current) => ({
      ...current,
      questions: current.questions.filter(
        (question) => question.id !== questionId && question.visibleWhen?.parentQuestionId !== questionId,
      ),
    }));
  }

  function updateStatus(status: ClubFormStatus) {
    updateDraft((current) => ({
      ...current,
      status,
      acceptsResponses: status === "active",
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const saved = await saveCurrentDraft();
    if (saved) {
      allowNavigationRef.current = true;
      navigate(getFormDetailPath(saved.id));
    }
  }

  async function handleSaveBlockedNavigation() {
    const saved = await saveCurrentDraft();
    if (!saved) {
      blocker.reset?.();
      return;
    }

    allowNavigationRef.current = true;
    blocker.proceed?.();
  }

  function handleDiscardBlockedNavigation() {
    allowNavigationRef.current = true;
    clearSessionDraft(sessionDraftKey);
    blocker.proceed?.();
  }

  function handleCancelBlockedNavigation() {
    blocker.reset?.();
  }

  if (loadingExistingForm) {
    return (
      <div className="kb-root" style={PAGE_STYLE}>
        <div className="flex min-h-[420px] items-center justify-center text-[15px] font-semibold text-[#64748b]">
          폼을 불러오는 중입니다.
        </div>
      </div>
    );
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <form onSubmit={handleSubmit} className="min-h-[calc(100vh_-_4rem)]">
        <header className="sticky top-0 z-20 border-b border-[#d8deea] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-4 py-3">
            <Link
              to="/member/forms"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#475569] no-underline transition-colors hover:bg-[#f1f4f8] hover:text-[#103078]"
              aria-label="폼 목록으로"
              title="폼 목록으로"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="min-w-[220px] flex-1">
              <div className="text-[12px] font-black text-[#103078]">
                {isEditMode ? "KOBOT Forms · 수정" : "KOBOT Forms · 새 폼"}
              </div>
              <div className="truncate text-[15px] font-black text-[#111827]">
                {draft.title.trim() || "제목 없는 폼"}
              </div>
            </div>

            <nav className="flex rounded-full bg-[#eef2f8] p-1" aria-label="폼 작성 단계">
              {(["draft", "active", "closed"] as ClubFormStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateStatus(status)}
                  className={cn(
                    "h-8 rounded-full px-3 text-[12px] font-black transition-colors",
                    draft.status === status
                      ? "bg-[#103078] text-white"
                      : "text-[#64748b] hover:bg-white",
                  )}
                >
                  {FORM_STATUS_LABELS[status]}
                </button>
              ))}
            </nav>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#103078] px-4 text-[14px] font-black text-white transition-colors hover:bg-[#0b2460] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Save className="h-4 w-4" />
              {submitting ? "저장 중" : "저장"}
            </button>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1240px] grid-cols-1 gap-4 px-4 py-8 lg:grid-cols-[minmax(0,1080px)_64px]">
          <section className="min-w-0 grid gap-5">
            <section className="overflow-hidden rounded-[8px] border border-[#d8deea] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div className="h-3 bg-[#103078]" />
              <div className="px-6 py-6">
              <LineInput
                value={draft.title}
                onChange={(title) => updateDraft((current) => ({ ...current, title }))}
                className="text-[32px] font-black leading-tight"
                placeholder="제목 없는 폼"
              />
              <LineInput
                value={draft.description}
                onChange={(description) => updateDraft((current) => ({ ...current, description }))}
                multiline
                className="mt-3 min-h-[64px] text-[14px] font-medium leading-6 text-[#475569]"
                placeholder="폼 설명"
              />

              <section className="mt-5 rounded-[8px] border border-[#d8deea] bg-[#fbfcfe] px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-[#103078]" />
                  <h2 className="m-0 text-[14px] font-black text-[#111827]">응답 가능 기간</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#64748b]">
                    비워두면 상시 응답
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <FieldLabel>시작</FieldLabel>
                    <input
                      type="datetime-local"
                      value={toDateTimeLocalValue(draft.responseWindow.startsAt)}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          responseWindow: {
                            ...current.responseWindow,
                            startsAt: fromDateTimeLocalValue(event.target.value),
                          },
                        }))
                      }
                      className="h-11 rounded-[8px] border border-[#d8deea] bg-white px-3 text-[13px] font-bold text-[#334155] outline-none transition-colors focus:border-[#103078]"
                    />
                  </label>
                  <label className="grid gap-2">
                    <FieldLabel>마감</FieldLabel>
                    <input
                      type="datetime-local"
                      value={toDateTimeLocalValue(draft.responseWindow.endsAt)}
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          responseWindow: {
                            ...current.responseWindow,
                            endsAt: fromDateTimeLocalValue(event.target.value),
                          },
                        }))
                      }
                      className="h-11 rounded-[8px] border border-[#d8deea] bg-white px-3 text-[13px] font-bold text-[#334155] outline-none transition-colors focus:border-[#103078]"
                    />
                  </label>
                </div>
              </section>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px] font-bold text-[#64748b]">
                <span>{draft.questions.length}개 질문</span>
                <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                <span>{requiredCount}개 필수</span>
                <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                <span>{linkedQuestionCount}개 연결 질문</span>
                <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                <span>개인정보 카드 고정</span>
                <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                <span>{responseWindowSet ? "응답 기간 설정" : "상시 응답"}</span>
                {draft.requiresLogin ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />
                    <span>로그인 응답</span>
                  </>
                ) : null}
              </div>
              </div>
            </section>

            <div className="grid gap-5 sm:gap-6">
              <PersonalInfoPreview />
              {rootQuestions.map((question, index) => {
                const options = question.options ?? [];
                const optionAccents = Object.fromEntries(
                  options.map((option, optionIndex) => [
                    option.id,
                    getOptionAccent(optionIndex),
                  ]),
                ) as Record<string, OptionAccent>;
                const linkedGroups = options
                  .map((option) => ({
                    accent: optionAccents[option.id],
                    linkedQuestions:
                      linkedQuestionsByOption.get(linkedGroupKey(question.id, option.id)) ?? [],
                    option,
                  }))
                  .filter((group) => group.linkedQuestions.length > 0);
                const linkedOptionCounts = Object.fromEntries(
                  options.map((option) => [
                    option.id,
                    linkedQuestionsByOption.get(linkedGroupKey(question.id, option.id))?.length ?? 0,
                  ]),
                );

                return (
                  <div key={question.id} className="min-w-0">
                    <QuestionThread
                      hasLinkedQuestions={linkedGroups.length > 0}
                      itemCount={linkedGroups.length + 1}
                      scrollRequestVersion={linkedQuestionFocusVersion}
                      scrollToItemId={pendingLinkedQuestionId}
                    >
                      <div
                        className="min-w-full shrink-0 snap-start"
                        data-thread-item-id={question.id}
                      >
                        <QuestionBlock
                          canAddLinkedQuestions={questionTypeNeedsOptions(question.type)}
                          canMoveDown={index < rootQuestions.length - 1}
                          canMoveUp={index > 0}
                          index={index}
                          linkedOptionCounts={linkedOptionCounts}
                          memberTags={memberTags}
                          optionAccents={optionAccents}
                          question={question}
                          onAddLinkedQuestion={(option) => addLinkedQuestion(question.id, option)}
                          onChange={(nextQuestion) => updateQuestion(question.id, nextQuestion)}
                          onDuplicate={() => duplicateQuestion(question)}
                          onMoveUp={() => moveRootQuestion(index, -1)}
                          onMoveDown={() => moveRootQuestion(index, 1)}
                          onRemove={() => removeQuestion(question.id)}
                        />
                      </div>


                      {linkedGroups.map(({ accent, linkedQuestions, option }) => (
                        <div
                          key={option.id}
                          className="kb-linked-option-page min-w-full shrink-0 snap-start"
                          data-linked-option-id={option.id}
                        >
                          <div
                            className="mb-3 rounded-[8px] border bg-white/95 px-3 py-2 text-[12px] font-black shadow-[0_8px_16px_rgba(15,23,42,0.05)] backdrop-blur"
                            style={{
                              borderColor: accent.border,
                              color: accent.text,
                            }}
                          >
                            {option.label || "\uC120\uD0DD\uC9C0"}{" \uC5F0\uACB0 \uC9C8\uBB38 "}
                            {linkedQuestions.length}
                            {"\uAC1C"}
                          </div>
                          <div className="kb-linked-question-stack grid max-h-[min(720px,calc(100vh-180px))] gap-5 overflow-y-auto pr-1">
                            {linkedQuestions.map((linkedQuestion) => (
                              <div
                                key={linkedQuestion.id}
                                data-thread-item-id={linkedQuestion.id}
                              >
                                <QuestionBlock
                                  accentColor={accent.line}
                                  canMoveDown={false}
                                  canMoveUp={false}
                                  index={index}
                                  markerLabel={`${option.label || "\uC120\uD0DD\uC9C0"} \uC120\uD0DD \uC2DC \uC5F0\uACB0 \uC9C8\uBB38`}
                                  memberTags={memberTags}
                                  question={linkedQuestion}
                                  onAddLinkedQuestionBelow={() =>
                                    addLinkedQuestionBelow(linkedQuestion)
                                  }
                                  onChange={(nextQuestion) =>
                                    updateQuestion(linkedQuestion.id, nextQuestion)
                                  }
                                  onDuplicate={() => duplicateQuestion(linkedQuestion)}
                                  onMoveUp={() => undefined}
                                  onMoveDown={() => undefined}
                                  onRemove={() => removeQuestion(linkedQuestion.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </QuestionThread>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => addQuestion("short_text")}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] border border-[#d8deea] bg-white px-6 py-5 text-[14px] font-black text-[#103078] shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#eef4ff]"
            >
              <Plus className="h-4 w-4" /> 질문 추가
            </button>

            <details className="rounded-[8px] border border-[#d8deea] bg-white px-6 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <summary className="cursor-pointer text-[14px] font-black text-[#334155]">
                고급 옵션
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="inline-flex cursor-pointer items-center gap-3 text-[13px] font-bold text-[#334155]">
                  <input
                    type="checkbox"
                    checked={draft.requiresLogin}
                    onChange={(event) =>
                      updateDraft((current) => ({ ...current, requiresLogin: event.target.checked }))
                    }
                  />
                  로그인한 회원만 응답
                </label>
                <label className="inline-flex cursor-pointer items-center gap-3 text-[13px] font-bold text-[#334155]">
                  <input
                    type="checkbox"
                    checked={draft.commentsEnabled}
                    onChange={(event) =>
                      updateDraft((current) => ({ ...current, commentsEnabled: event.target.checked }))
                    }
                  />
                  댓글 허용
                </label>
              </div>
            </details>
          </section>

          <aside className="order-first flex items-start gap-2 overflow-x-auto pb-1 lg:sticky lg:top-[92px] lg:order-none lg:h-fit lg:w-[220px] lg:flex-col lg:overflow-visible lg:pb-0">
            <IconRailButton label="단답형 질문 추가" onClick={() => addQuestion("short_text")}>
              <Plus className="h-5 w-5" />
            </IconRailButton>
            <IconRailButton label="선택형 질문 추가" onClick={() => addQuestion("single_choice")}>
              <ListPlus className="h-5 w-5" />
            </IconRailButton>
            <IconRailButton label="장문형 질문 추가" onClick={() => addQuestion("long_text")}>
              <FileText className="h-5 w-5" />
            </IconRailButton>
            <IconRailButton
              label="댓글 옵션 전환"
              onClick={() =>
                updateDraft((current) => ({ ...current, commentsEnabled: !current.commentsEnabled }))
              }
            >
              <MessageSquareText className="h-5 w-5" />
            </IconRailButton>
            <IconRailButton
              label="응답 접근 설정 전환"
              onClick={() =>
                updateDraft((current) => ({ ...current, requiresLogin: !current.requiresLogin }))
              }
            >
              <Settings2 className="h-5 w-5" />
            </IconRailButton>
          </aside>
        </main>

        {error ? (
          <div className="fixed bottom-5 left-1/2 z-30 flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-bold text-red-700 shadow-[0_18px_42px_rgba(185,28,28,0.16)]">
            <Trash2 className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <AlertDialog
          open={blocker.state === "blocked"}
          onOpenChange={(open) => {
            if (!open && blocker.state === "blocked" && !submitting) {
              handleCancelBlockedNavigation();
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>변경사항을 저장할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                저장하지 않은 폼 수정사항이 있습니다. 저장하고 이동하거나, 저장하지 않고 이동할 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>계속 작성</AlertDialogCancel>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDiscardBlockedNavigation}
                className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[#d8deea] bg-white px-4 text-[14px] font-bold text-[#64748b] transition-colors hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-55"
              >
                저장하지 않고 이동
              </button>
              <AlertDialogAction
                disabled={submitting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleSaveBlockedNavigation();
                }}
              >
                {submitting ? "저장 중..." : "저장하고 이동"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </div>
  );
}
