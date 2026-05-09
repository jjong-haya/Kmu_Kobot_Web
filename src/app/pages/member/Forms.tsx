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
  Search,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#f5f6fa",
};

const STATUS_ORDER = ["draft", "active", "closed"] satisfies ClubFormStatus[];
const STATUS_FILTERS = [
  { key: "all", label: "전체" },
  { key: "draft", label: FORM_STATUS_LABELS.draft },
  { key: "active", label: FORM_STATUS_LABELS.active },
  { key: "closed", label: FORM_STATUS_LABELS.closed },
] satisfies { key: ClubFormStatus | "all"; label: string }[];

const STATUS_STYLE: Record<ClubFormStatus, { bg: string; fg: string; border: string; dot: string }> = {
  draft: {
    bg: "#fff7ed",
    fg: "#b45309",
    border: "#fed7aa",
    dot: "#f59e0b",
  },
  active: {
    bg: "#ecfdf5",
    fg: "#047857",
    border: "#a7f3d0",
    dot: "#10b981",
  },
  closed: {
    bg: "#f1f5f9",
    fg: "#475569",
    border: "#cbd5e1",
    dot: "#64748b",
  },
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

function StatusBadge({ status }: { status: ClubFormStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-black"
      style={{ background: style.bg, borderColor: style.border, color: style.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {FORM_STATUS_LABELS[status]}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[8px] border border-[#d8deea] bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-[12px] font-black text-[#64748b]">
        <Icon className="h-4 w-4 text-[#103078]" />
        {label}
      </div>
      <div className="mt-2 text-[26px] font-black leading-none text-[#111827]">{value}</div>
    </div>
  );
}

function FormMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-[#f8fafc] px-3 py-2">
      <div className="text-[17px] font-black leading-none text-[#111827]">{value}</div>
      <div className="mt-1 text-[11px] font-black text-[#64748b]">{label}</div>
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
  const statusStyle = STATUS_STYLE[form.status];

  return (
    <div className="min-h-[384px] [perspective:1400px]">
      <div
        className={cn(
          "relative min-h-[384px] transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        <article
          aria-hidden={flipped}
          className="absolute inset-0 flex flex-col rounded-[8px] border border-[#d8deea] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] [backface-visibility:hidden]"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border"
              style={{
                background: statusStyle.bg,
                borderColor: statusStyle.border,
                color: statusStyle.fg,
              }}
            >
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={form.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${form.title} 메뉴`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#eef2f8] hover:text-[#103078]"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>폼 작업</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getFormEditPath(form.id)} className="cursor-pointer">
                      <Edit3 className="h-4 w-4" />
                      수정
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onFlip(form.id)}>
                    <CheckCircle2 className="h-4 w-4" />
                    상태변화
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDeleteRequest(form)}>
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 min-h-[118px]">
            <div className="text-[12px] font-black uppercase tracking-normal text-[#64748b]">
              {FORM_CATEGORY_LABELS[form.category]}
            </div>
            <h2 className="mb-0 mt-1 line-clamp-2 text-[21px] font-black leading-tight tracking-normal text-[#111827]">
              {form.title}
            </h2>
            <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[#64748b]">
              {form.description || "설명이 없는 폼입니다."}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <FormMetric label="질문" value={form.questions.length} />
            <FormMetric label="응답" value={form.responses.length} />
            <FormMetric label="댓글" value={form.comments.length} />
          </div>

          <div className="mt-auto flex min-h-10 flex-wrap items-center gap-2 pt-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {form.commentsEnabled ? (
                <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-3 text-[12px] font-black text-[#3730a3]">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  댓글
                </span>
              ) : null}
              <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-[#d8deea] bg-[#fbfcfe] px-3 text-[12px] font-black text-[#64748b]">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{formatResponseWindow(form)}</span>
              </span>
            </div>
            <Link
              to={getFormDetailPath(form.id)}
              className="ml-auto inline-flex h-10 shrink-0 items-center justify-center rounded-[8px] bg-[#111827] px-4 text-[13px] font-black text-white no-underline transition-colors hover:bg-[#103078]"
              title="신청자가 보는 폼 화면 열기"
            >
              열기
            </Link>
          </div>
        </article>

        <article
          aria-hidden={!flipped}
          className="absolute inset-0 flex flex-col rounded-[8px] border border-[#c7d2fe] bg-[#f8fafc] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <div>
            <div className="text-[12px] font-black text-[#103078]">상태변화</div>
            <h2 className="m-0 mt-1 line-clamp-2 text-[21px] font-black leading-tight text-[#111827]">
              {form.title}
            </h2>
            <p className="mt-2 text-[13px] font-semibold leading-6 text-[#64748b]">
              신청자에게 열리는 상태를 선택한 뒤 저장합니다. 예정과 마감은 신청자 폼 화면을 막고, 진행만 응답을 받습니다.
            </p>
          </div>

          <div className="mt-5 grid gap-2">
            {STATUS_ORDER.map((status) => {
              const style = STATUS_STYLE[status];
              const selected = statusDraft === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusDraftChange(form.id, status)}
                  className="flex min-h-12 items-center justify-between rounded-[8px] border px-4 text-left transition-colors"
                  style={{
                    background: selected ? style.bg : "#ffffff",
                    borderColor: selected ? style.border : "#d8deea",
                    color: selected ? style.fg : "#334155",
                  }}
                >
                  <span className="font-black">{FORM_STATUS_LABELS[status]}</span>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: selected ? style.dot : "#cbd5e1" }}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <button
              type="button"
              onClick={() => onFlip(null)}
              className="h-10 rounded-[8px] border border-[#d8deea] bg-white px-3 text-[13px] font-black text-[#64748b] transition-colors hover:border-[#103078] hover:text-[#103078]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onSaveStatus(form)}
              className="h-10 rounded-[8px] bg-[#103078] px-3 text-[13px] font-black text-white transition-colors hover:bg-[#0b2460]"
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
      return [form.title, form.description, FORM_CATEGORY_LABELS[form.category], FORM_STATUS_LABELS[form.status]].some(
        (value) => value.toLocaleLowerCase("ko-KR").includes(normalized),
      );
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

    setError(null);
    try {
      await deleteForm(deleteTarget.id);
      setForms((current) => current.filter((form) => form.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "폼을 삭제하지 못했습니다."));
    }
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-[13px] font-black uppercase tracking-normal text-[#103078]">
              Forms
            </div>
            <h1 className="m-0 text-[32px] font-black tracking-normal text-[#111827]">
              폼 관리
            </h1>
            <p className="mt-2 max-w-[620px] text-[14px] font-semibold leading-6 text-[#64748b]">
              신청자가 보는 폼과 운영진이 관리하는 상태를 한 화면에서 분리해 다룹니다.
            </p>
          </div>

          <Link
            to={getFormCreatePath()}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#103078] px-4 text-[14px] font-black text-white no-underline transition-colors hover:bg-[#0b2460]"
          >
            <Plus className="h-4 w-4" />
            폼 만들기
          </Link>
        </header>

        {error ? (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="전체 폼" value={forms.length} />
          <StatCard icon={CheckCircle2} label="진행" value={activeCount} />
          <StatCard icon={FileText} label="예정" value={draftCount} />
          <StatCard icon={MessageSquareText} label="전체 응답" value={responseCount} />
        </section>

        <section className="rounded-[8px] border border-[#d8deea] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-[8px] border border-[#d8deea] bg-[#f8fafc] p-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveStatus(filter.key)}
                  className="h-9 rounded-[6px] px-3 text-[13px] font-black transition-colors"
                  style={{
                    background: activeStatus === filter.key ? "#111827" : "transparent",
                    color: activeStatus === filter.key ? "#ffffff" : "#475569",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="ml-auto flex h-10 min-w-[260px] items-center gap-2 rounded-[8px] border border-[#d8deea] bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-semibold text-[#334155] outline-none"
                placeholder="폼 검색"
              />
            </label>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center text-[15px] font-semibold text-[#64748b]">
            폼을 불러오는 중입니다.
          </div>
        ) : filteredForms.length > 0 ? (
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
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[8px] border border-dashed border-[#cbd5e1] bg-white text-center">
            <UsersRound className="mb-3 h-9 w-9 text-[#94a3b8]" />
            <div className="text-[18px] font-black text-[#111827]">표시할 폼이 없습니다.</div>
            <div className="mt-1 text-[13px] font-semibold text-[#64748b]">
              검색어나 상태 필터를 다시 확인해 주세요.
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>폼을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title ?? "선택한 폼"}과 연결된 응답, 댓글, 팀 정보가 이 브라우저 저장소에서 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteConfirmed();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
