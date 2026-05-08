import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquareText,
  Plus,
  Search,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  FORM_CATEGORY_LABELS,
  FORM_STATUS_LABELS,
  getFormCreatePath,
  getFormDetailPath,
  listForms,
  type ClubForm,
  type ClubFormStatus,
} from "../../api/forms";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const STATUS_FILTERS = [
  { key: "active", label: "응답 중" },
  { key: "draft", label: "작성중" },
  { key: "closed", label: "마감" },
] satisfies { key: ClubFormStatus; label: string }[];

const STATUS_STYLE: Record<ClubFormStatus, { bg: string; fg: string; border: string; dot: string }> = {
  active: {
    bg: "#eef7f1",
    fg: "#17633a",
    border: "#c7ead2",
    dot: "#22a35a",
  },
  draft: {
    bg: "#f7f4ee",
    fg: "#7c5a18",
    border: "#eadcc0",
    dot: "#b7791f",
  },
  closed: {
    bg: "#f1f1ef",
    fg: "#55514c",
    border: "#dedbd1",
    dot: "#8b8780",
  },
};

function StatusBadge({ status }: { status: ClubFormStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold"
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
    <div className="rounded-[8px] border border-[#eeeae2] bg-[#fbfaf7] p-4">
      <div className="flex items-center gap-2 text-[13px] font-bold text-[#6f6a62]">
        <Icon className="h-4 w-4 text-[#103078]" />
        {label}
      </div>
      <div className="mt-2 text-[28px] font-black leading-none text-[#111111]">{value}</div>
    </div>
  );
}

function FormCard({ form }: { form: ClubForm }) {
  return (
    <article className="flex min-h-[250px] flex-col rounded-[10px] border border-[#eeeae2] bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow] hover:border-[#d7d1c5] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-[#eef3ff] text-[#103078]">
          <ClipboardList className="h-6 w-6" />
        </div>
        <StatusBadge status={form.status} />
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-black uppercase text-[#8d877e]">
          {FORM_CATEGORY_LABELS[form.category]}
        </div>
        <h2 className="mb-0 mt-1 text-[20px] font-black leading-tight tracking-normal text-[#111111]">
          {form.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-[#6f6a62]">
          {form.description}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[8px] bg-[#fbfaf7] px-2 py-2">
          <div className="text-[16px] font-black text-[#111111]">{form.questions.length}</div>
          <div className="mt-0.5 text-[11px] font-bold text-[#8d877e]">질문</div>
        </div>
        <div className="rounded-[8px] bg-[#fbfaf7] px-2 py-2">
          <div className="text-[16px] font-black text-[#111111]">{form.responses.length}</div>
          <div className="mt-0.5 text-[11px] font-bold text-[#8d877e]">응답</div>
        </div>
        <div className="rounded-[8px] bg-[#fbfaf7] px-2 py-2">
          <div className="text-[16px] font-black text-[#111111]">
            {form.tournament.enabled ? form.tournament.teams.length : form.comments.length}
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#8d877e]">
            {form.tournament.enabled ? "팀" : "댓글"}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {form.tournament.enabled ? (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#f2d8b7] bg-[#fff8ed] px-3 text-[12px] font-bold text-[#8a4b12]">
            <Trophy className="h-3.5 w-3.5" />
            리그전
          </span>
        ) : null}
        {form.commentsEnabled ? (
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#d8e2f7] bg-[#f6f9ff] px-3 text-[12px] font-bold text-[#183b80]">
            <MessageSquareText className="h-3.5 w-3.5" />
            댓글
          </span>
        ) : null}
        <Link
          to={getFormDetailPath(form.id)}
          className="ml-auto inline-flex h-9 items-center justify-center rounded-[8px] bg-[#0a0a0a] px-3 text-[13px] font-bold text-white no-underline transition-colors hover:bg-[#222222]"
        >
          열기
        </Link>
      </div>
    </article>
  );
}

export default function Forms() {
  const [forms, setForms] = useState<ClubForm[]>([]);
  const [activeStatus, setActiveStatus] = useState<ClubFormStatus>("active");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setForms(await listForms());
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "폼 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredForms = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase("ko-KR");
    return forms.filter((form) => {
      if (form.status !== activeStatus) return false;
      if (!normalized) return true;
      return [form.title, form.description, FORM_CATEGORY_LABELS[form.category]].some((value) =>
        value.toLocaleLowerCase("ko-KR").includes(normalized),
      );
    });
  }, [forms, activeStatus, keyword]);

  const activeCount = forms.filter((form) => form.status === "active").length;
  const responseCount = forms.reduce((sum, form) => sum + form.responses.length, 0);
  const tournamentCount = forms.filter((form) => form.tournament.enabled).length;

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="kb-mono mb-2 text-[13px] uppercase text-[#6f6a62]"
              style={{ letterSpacing: "0.14em" }}
            >
              Forms
            </div>
            <h1 className="kb-display m-0 text-[32px] font-black tracking-normal text-[#0a0a0a]">
              폼 / 참여자 조사
            </h1>
          </div>

          <Link
            to={getFormCreatePath()}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white no-underline transition-colors hover:bg-[#222222]"
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

        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={ClipboardList} label="전체 폼" value={forms.length} />
          <StatCard icon={CheckCircle2} label="응답 중" value={activeCount} />
          <StatCard icon={Trophy} label="대회 폼" value={tournamentCount} />
        </section>

        <section className="rounded-[10px] border border-[#eeeae2] bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-[8px] border border-[#e8e6df] bg-[#fbfaf7] p-1">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveStatus(filter.key)}
                  className="h-9 rounded-[6px] px-3 text-[13px] font-bold transition-colors"
                  style={{
                    background: activeStatus === filter.key ? "#111111" : "transparent",
                    color: activeStatus === filter.key ? "#ffffff" : "#5f574c",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <label className="ml-auto flex h-10 min-w-[260px] items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-[#8d877e]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-semibold outline-none"
                placeholder="폼 검색"
              />
            </label>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center text-[15px] font-semibold text-[#6f6a62]">
            폼을 불러오는 중입니다.
          </div>
        ) : filteredForms.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredForms.map((form) => (
              <FormCard key={form.id} form={form} />
            ))}
          </section>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[#ddd8ce] bg-[#fbfaf7] text-center">
            <UsersRound className="mb-3 h-9 w-9 text-[#8d877e]" />
            <div className="text-[18px] font-black text-[#111111]">표시할 폼이 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}
