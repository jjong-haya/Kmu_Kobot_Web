import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  MessageSquareText,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  FORM_CATEGORY_LABELS,
  FORM_STATUS_LABELS,
  deleteForm,
  getFormCreatePath,
  getFormDetailPath,
  getFormEditPath,
  listForms,
  updateFormStatus,
  type ClubForm,
  type ClubFormStatus,
} from "../../api/forms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ConfirmActionDialog } from "../../components/ConfirmActionDialog";
import { sanitizeUserError } from "../../utils/sanitize-error";
import {
  EmptyState,
  ErrorFallback,
  FilterBar,
  ListSkeleton,
  PageHeader,
  StatusPill,
  type StatusTone,
} from "../../components/primitives";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-paper-2)",
};

const STATUS_ORDER = ["draft", "active", "closed"] satisfies ClubFormStatus[];
const STATUS_FILTERS = [
  { key: "all", label: "전체" },
  { key: "draft", label: FORM_STATUS_LABELS.draft },
  { key: "active", label: FORM_STATUS_LABELS.active },
  { key: "closed", label: FORM_STATUS_LABELS.closed },
] satisfies { key: ClubFormStatus | "all"; label: string }[];

const STATUS_TONE: Record<ClubFormStatus, StatusTone> = {
  draft: "warning",
  active: "success",
  closed: "neutral",
};

const STATUS_DOT_CLASS: Record<ClubFormStatus, string> = {
  draft: "bg-[var(--kb-warning-500)]",
  active: "bg-[var(--kb-success-500)]",
  closed: "bg-[var(--kb-ink-400)]",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatShortDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 미정";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatResponseWindow(form: ClubForm) {
  const { startsAt, endsAt } = form.responseWindow;
  if (!startsAt && !endsAt) return "상시 응답";
  if (startsAt && endsAt) return `${formatShortDateTime(startsAt)} - ${formatShortDateTime(endsAt)}`;
  if (startsAt) return `${formatShortDateTime(startsAt)}부터`;
  return `${formatShortDateTime(endsAt ?? "")}까지`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const toneClass: Record<typeof tone, string> = {
    neutral: "text-[var(--kb-ink-500)]",
    accent: "text-[var(--kb-navy-700)]",
    success: "text-[var(--kb-success-700)]",
    warning: "text-[var(--kb-warning-700)]",
  };
  return (
    <div className="rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-4 py-3 shadow-[var(--kb-shadow-sm)]">
      <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--kb-ink-500)]">
        <Icon className={cn("h-4 w-4", toneClass[tone])} aria-hidden />
        {label}
      </div>
      <div className="kb-display mt-2 text-[26px] font-semibold leading-none text-[var(--kb-ink-900)]">
        {value}
      </div>
    </div>
  );
}

function FormMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--kb-radius-sm)] bg-[var(--kb-paper-2)] px-3 py-2">
      <div className="kb-display text-[17px] font-semibold leading-none text-[var(--kb-ink-900)]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-[var(--kb-ink-500)]">{label}</div>
    </div>
  );
}

function FormCard({
  form,
  flipped,
  statusDraft,
  onDeleteRequest,
  onFlip,
  onSaveStatus,
  onStatusDraftChange,
}: {
  form: ClubForm;
  flipped: boolean;
  statusDraft: ClubFormStatus;
  onDeleteRequest: (form: ClubForm) => void;
  onFlip: (formId: string | null) => void;
  onSaveStatus: (form: ClubForm) => void;
  onStatusDraftChange: (formId: string, status: ClubFormStatus) => void;
}) {
  return (
    <div className="min-h-[384px] [perspective:1400px]">
      <div
        className={cn(
          "relative min-h-[384px] transition-transform duration-[var(--kb-duration-slow)] ease-[var(--kb-ease-emphasis)] [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Front face — read view */}
        <article
          aria-hidden={flipped}
          className="absolute inset-0 flex flex-col rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-5 shadow-[var(--kb-shadow-sm)] transition-shadow duration-[var(--kb-duration-normal)] hover:shadow-[var(--kb-shadow-md)] [backface-visibility:hidden]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--kb-radius-sm)] bg-[var(--kb-navy-50)] text-[var(--kb-navy-700)]">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex items-center gap-2">
              <StatusPill tone={STATUS_TONE[form.status]} dot>
                {FORM_STATUS_LABELS[form.status]}
              </StatusPill>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${form.title} 메뉴`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--kb-ink-500)] transition-colors hover:bg-[var(--kb-paper-3)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
                  >
                    <MoreVertical className="h-4.5 w-4.5" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>폼 작업</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getFormEditPath(form.id)} className="cursor-pointer">
                      <Edit3 className="h-4 w-4" aria-hidden />
                      수정
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onFlip(form.id)}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    상태변화
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDeleteRequest(form)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 min-h-[118px]">
            <div className="kb-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--kb-ink-500)]">
              {FORM_CATEGORY_LABELS[form.category]}
            </div>
            <h2 className="kb-display mb-0 mt-1 line-clamp-2 text-[20px] font-semibold leading-tight tracking-tight text-[var(--kb-ink-900)]">
              {form.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
              {form.description || "설명이 없는 폼입니다."}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <FormMetric label="질문" value={form.questions.length} />
            <FormMetric label="응답" value={form.responses.length} />
            <FormMetric label="댓글" value={form.comments.length} />
          </div>

          <div className="mt-auto flex min-h-10 flex-wrap items-center gap-2 pt-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {form.commentsEnabled ? (
                <StatusPill tone="info">
                  <MessageSquareText className="h-3 w-3" aria-hidden />
                  댓글
                </StatusPill>
              ) : null}
              <span className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-[var(--kb-radius-full)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-2)] px-2.5 py-0.5 text-[11.5px] font-medium text-[var(--kb-ink-500)]">
                <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                <span className="truncate">{formatResponseWindow(form)}</span>
              </span>
            </div>
            <Link
              to={getFormDetailPath(form.id)}
              className="ml-auto inline-flex h-9 shrink-0 items-center justify-center rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-4 text-[13px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
              title="신청자가 보는 폼 화면 열기"
            >
              열기
            </Link>
          </div>
        </article>

        {/* Back face — status change */}
        <article
          aria-hidden={!flipped}
          className="absolute inset-0 flex flex-col rounded-[var(--kb-radius-md)] border border-[color-mix(in_srgb,var(--kb-navy-500)_25%,transparent)] bg-[var(--kb-navy-50)] p-5 shadow-[var(--kb-shadow-md)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <div>
            <div className="kb-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--kb-navy-700)]">
              상태변화
            </div>
            <h2 className="kb-display m-0 mt-1 line-clamp-2 text-[20px] font-semibold leading-tight text-[var(--kb-ink-900)]">
              {form.title}
            </h2>
            <p className="mt-2 text-[12.5px] leading-5 text-[var(--kb-ink-700)]">
              신청자에게 열리는 상태를 선택한 뒤 저장합니다. 예정과 마감은 신청자 폼 화면을 막고, 진행만 응답을 받습니다.
            </p>
          </div>

          <div className="mt-4 grid gap-2" role="radiogroup" aria-label="폼 상태 선택">
            {STATUS_ORDER.map((status) => {
              const selected = statusDraft === status;
              return (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onStatusDraftChange(form.id, status)}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-[var(--kb-radius-sm)] border px-3.5 text-left text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]",
                    selected
                      ? "border-[var(--kb-navy-500)] bg-[var(--kb-surface-raised)] text-[var(--kb-ink-900)] shadow-[var(--kb-shadow-sm)]"
                      : "border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] text-[var(--kb-ink-700)] hover:border-[var(--kb-navy-100)]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden className={cn("h-2 w-2 rounded-full", STATUS_DOT_CLASS[status])} />
                    {FORM_STATUS_LABELS[status]}
                  </span>
                  {selected ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--kb-navy-700)]" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <button
              type="button"
              onClick={() => onFlip(null)}
              className="h-9 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13px] font-semibold text-[var(--kb-ink-700)] transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onSaveStatus(form)}
              className="h-9 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13px] font-semibold text-[var(--kb-on-accent)] transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
            >
              저장
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}

export default function Forms() {
  const [forms, setForms] = useState<ClubForm[]>([]);
  const [activeStatus, setActiveStatus] = useState<ClubFormStatus | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [flippedFormId, setFlippedFormId] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, ClubFormStatus>>({});
  const [deleteTarget, setDeleteTarget] = useState<ClubForm | null>(null);
  const formsQuery = useQuery({
    queryKey: ["forms"],
    queryFn: listForms,
  });

  useEffect(() => {
    if (formsQuery.data) {
      setForms(formsQuery.data);
      setStatusDrafts(
        Object.fromEntries(formsQuery.data.map((form) => [form.id, form.status])),
      );
    }
    setLoading(formsQuery.isLoading);
    setError(
      formsQuery.isError
        ? sanitizeUserError(formsQuery.error, "폼 목록을 불러오지 못했습니다.")
        : null,
    );
  }, [formsQuery.data, formsQuery.error, formsQuery.isError, formsQuery.isLoading]);

  const filteredForms = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase("ko-KR");
    return forms.filter((form) => {
      if (activeStatus !== "all" && form.status !== activeStatus) return false;
      if (!normalized) return true;
      return [
        form.title,
        form.description,
        FORM_CATEGORY_LABELS[form.category],
        FORM_STATUS_LABELS[form.status],
      ].some((value) => value.toLocaleLowerCase("ko-KR").includes(normalized));
    });
  }, [forms, activeStatus, keyword]);

  const activeCount = forms.filter((form) => form.status === "active").length;
  const draftCount = forms.filter((form) => form.status === "draft").length;
  const responseCount = forms.reduce((sum, form) => sum + form.responses.length, 0);

  function setStatusDraft(formId: string, status: ClubFormStatus) {
    setStatusDrafts((current) => ({ ...current, [formId]: status }));
  }

  async function handleSaveStatus(form: ClubForm) {
    setError(null);
    try {
      const updated = await updateFormStatus(form.id, statusDrafts[form.id] ?? form.status);
      setForms((current) => [updated, ...current.filter((item) => item.id !== form.id)]);
      setStatusDrafts((current) => ({ ...current, [updated.id]: updated.status }));
      setFlippedFormId(null);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "폼 상태를 저장하지 못했습니다."));
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteForm(deleteTarget.id);
      setForms((current) => current.filter((form) => form.id !== deleteTarget.id));
      setDeleteTarget(null);
      // Re-fetch to keep useQuery cache in sync with the DB; otherwise the
      // next mount/tab focus replays the stale list with the deleted row.
      void formsQuery.refetch();
    } catch (requestError) {
      const raw = requestError instanceof Error ? requestError.message : String(requestError);
      const friendly = raw.startsWith("forbidden")
        ? "이 폼을 삭제할 권한이 없습니다. 폼 관리 권한이 필요해요."
        : sanitizeUserError(requestError, "폼을 삭제하지 못했습니다.");
      setError(friendly);
    } finally {
      setDeleting(false);
    }
  }

  const headerActions = (
    <>
      <Link
        to={getFormCreatePath()}
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13.5px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
      >
        <Plus className="h-4 w-4" aria-hidden />
        폼 만들기
      </Link>
      <button
        type="button"
        onClick={() => void formsQuery.refetch()}
        aria-label="새로고침"
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] px-3 text-[13.5px] font-medium text-[var(--kb-ink-700)] transition-colors hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
      >
        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
        <span className="hidden sm:inline">새로고침</span>
      </button>
    </>
  );

  const statusFilters = (
    <div
      role="radiogroup"
      aria-label="폼 상태 필터"
      className="inline-flex flex-wrap items-center gap-1 rounded-[var(--kb-radius-sm)] border border-[var(--kb-border-subtle)] bg-[var(--kb-paper-2)] p-0.5"
    >
      {STATUS_FILTERS.map((filter) => {
        const active = activeStatus === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setActiveStatus(filter.key)}
            className={cn(
              "inline-flex h-8 items-center rounded-[calc(var(--kb-radius-sm)-2px)] px-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]",
              active
                ? "bg-[var(--kb-surface-raised)] text-[var(--kb-ink-900)] shadow-[var(--kb-shadow-sm)]"
                : "text-[var(--kb-ink-500)] hover:bg-[var(--kb-paper-3)] hover:text-[var(--kb-ink-900)]",
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );

  const renderBody = () => {
    if (error && forms.length === 0) {
      return <ErrorFallback error={new Error(error)} onReset={() => void formsQuery.refetch()} />;
    }
    if (loading && forms.length === 0) {
      return <ListSkeleton variant="card" count={6} />;
    }
    if (filteredForms.length === 0) {
      return (
        <EmptyState
          icon={UsersRound}
          title={keyword ? "검색 결과가 없습니다" : "표시할 폼이 없습니다"}
          description={
            keyword
              ? "검색어를 다른 키워드로 바꿔보거나 상태 필터를 조정해 보세요."
              : "신청자가 채울 폼을 새로 만들어 보세요."
          }
          action={
            !keyword ? (
              <Link
                to={getFormCreatePath()}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--kb-radius-sm)] bg-[var(--kb-ink-900)] px-3 text-[13px] font-semibold text-[var(--kb-on-accent)] no-underline transition-colors hover:bg-[var(--kb-navy-900)]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                새 폼 만들기
              </Link>
            ) : null
          }
        />
      );
    }
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredForms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            flipped={flippedFormId === form.id}
            statusDraft={statusDrafts[form.id] ?? form.status}
            onDeleteRequest={setDeleteTarget}
            onFlip={setFlippedFormId}
            onSaveStatus={(targetForm) => void handleSaveStatus(targetForm)}
            onStatusDraftChange={setStatusDraft}
          />
        ))}
      </section>
    );
  };

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <PageHeader
          eyebrow="Forms"
          title="폼 관리"
          description="신청자가 보는 폼과 운영진이 관리하는 상태를 한 화면에서 분리해 다룹니다."
          actions={headerActions}
        />

        {error && forms.length > 0 ? (
          <div
            role="alert"
            className="rounded-[var(--kb-radius-md)] border border-[color-mix(in_srgb,var(--kb-danger-500)_30%,transparent)] bg-[var(--kb-danger-50)] px-4 py-3 text-[13.5px] font-medium text-[var(--kb-danger-700)]"
          >
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="전체 폼" value={forms.length} tone="accent" />
          <StatCard icon={CheckCircle2} label="진행" value={activeCount} tone="success" />
          <StatCard icon={FileText} label="예정" value={draftCount} tone="warning" />
          <StatCard icon={MessageSquareText} label="전체 응답" value={responseCount} />
        </section>

        <FilterBar
          search={{
            value: keyword,
            onChange: setKeyword,
            placeholder: "폼 제목·설명·분류로 검색",
            "aria-label": "폼 검색",
          }}
          start={statusFilters}
        />

        <div className="kb-fade-up">{renderBody()}</div>
      </div>

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="폼을 삭제할까요?"
        description={`${deleteTarget?.title ?? "선택한 폼"}과 연결된 응답, 댓글, 팀 정보가 함께 삭제됩니다. 이 작업은 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        cancelLabel="취소"
        destructive
        busy={deleting}
        onConfirm={() => void handleDeleteConfirmed()}
      />
    </div>
  );
}
