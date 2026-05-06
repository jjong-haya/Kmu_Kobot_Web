import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  PenLine,
  RefreshCw,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import {
  getProjectBySlug,
  type ProjectDetail as ProjectDetailData,
} from "../../api/projects";
import { getProjectStatusLabel } from "../../api/project-policy.js";
import {
  listProjectStudyRecords,
  type StudyRecord,
  type StudyRecordVisibility,
} from "../../api/studies";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const PANEL_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

function boardPath(slug: string) {
  return `/member/study-log/${encodeURIComponent(slug)}`;
}

function writePath(slug: string) {
  return `${boardPath(slug)}/write`;
}

function postPath(slug: string, recordId: string) {
  return `${boardPath(slug)}/posts/${encodeURIComponent(recordId)}`;
}

function editPath(slug: string, recordId: string) {
  return `${postPath(slug, recordId)}/edit`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function visibilityLabel(value: StudyRecordVisibility) {
  switch (value) {
    case "self":
      return "나만";
    case "project":
      return "프로젝트";
    case "member":
      return "부원";
    case "public":
      return "공개";
    default:
      return value;
  }
}

function canWriteStudy(project: ProjectDetailData | null) {
  return Boolean(
    project &&
      project.isMember &&
      ["pending", "recruiting", "active"].includes(project.status),
  );
}

function matchesRecord(record: StudyRecord, keyword: string) {
  if (!keyword) return true;

  return [record.title, record.body, record.author?.displayName]
    .filter(Boolean)
    .some((value) => value!.toLocaleLowerCase("ko-KR").includes(keyword));
}

function BoardRow({
  index,
  record,
  slug,
  canEdit,
}: {
  index: number;
  record: StudyRecord;
  slug: string;
  canEdit: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[54px_1fr] gap-3 border-t border-[#f1ede4] px-5 py-4 text-inherit no-underline transition-colors first:border-t-0 hover:bg-[#fafaf6] md:grid-cols-[64px_1fr_130px_116px_92px] md:items-center sm:px-7"
    >
      <div className="text-center text-[13px] text-[var(--kb-ink-400)]">{index}</div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={postPath(slug, record.id)}
            className="truncate text-[15px] font-semibold text-[var(--kb-ink-900)] no-underline hover:underline"
          >
            {record.title}
          </Link>
          {canEdit ? (
            <Link
              to={editPath(slug, record.id)}
              className="shrink-0 text-[12.5px] font-semibold text-[var(--kb-ink-500)] no-underline hover:text-[var(--kb-ink-900)]"
            >
              ( 수정 )
            </Link>
          ) : null}
          {record.imageUrls.length > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f1ede4] px-2 py-0.5 text-[11.5px] font-semibold text-[var(--kb-ink-600)]">
              <ImageIcon className="h-3 w-3" />
              {record.imageUrls.length}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--kb-ink-500)] md:hidden">
          <span>{record.author?.displayName ?? "작성자 없음"}</span>
          <span>{formatDate(record.createdAt)}</span>
          {record.durationMinutes !== null ? <span>{record.durationMinutes}분</span> : null}
        </div>
        {record.body ? (
          <p className="m-0 mt-1 line-clamp-1 text-[13px] text-[var(--kb-ink-400)] md:hidden">
            {record.body}
          </p>
        ) : null}
      </div>

      <div className="hidden truncate text-[13px] text-[var(--kb-ink-600)] md:block">
        {record.author?.displayName ?? "작성자 없음"}
      </div>
      <div className="hidden text-[13px] text-[var(--kb-ink-500)] md:block">
        {formatDate(record.createdAt)}
      </div>
      <div className="hidden text-right text-[13px] text-[var(--kb-ink-500)] md:block">
        {record.durationMinutes !== null ? `${record.durationMinutes}분` : visibilityLabel(record.visibility)}
      </div>
    </div>
  );
}

export default function StudyProjectPosts() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

  const canWrite = canWriteStudy(project);
  const keywordValue = keyword.trim().toLocaleLowerCase("ko-KR");
  const visibleRecords = useMemo(
    () => records.filter((record) => matchesRecord(record, keywordValue)),
    [keywordValue, records],
  );
  const totalMinutes = useMemo(
    () =>
      records.reduce(
        (sum, record) =>
          sum + (typeof record.durationMinutes === "number" ? record.durationMinutes : 0),
        0,
      ),
    [records],
  );

  async function refresh() {
    if (!user || !slug) {
      setProject(null);
      setRecords([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectRow = await getProjectBySlug(slug, user.id);
      setProject(projectRow);
      setRecords(projectRow ? await listProjectStudyRecords(projectRow.id, 100) : []);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 게시판을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug, user?.id]);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <Link
          to="/member/study-log"
          className="inline-flex w-fit items-center gap-1.5 text-[13.5px] text-[var(--kb-ink-500)] no-underline hover:text-[var(--kb-ink-900)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          스터디 기록
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            프로젝트 게시판을 불러오는 중입니다.
          </div>
        ) : error ? (
          <section style={{ ...PANEL_STYLE, padding: 32 }}>
            <div className="text-[15px] font-semibold text-red-700">{error}</div>
          </section>
        ) : !project ? (
          <section style={{ ...PANEL_STYLE, padding: 56 }} className="text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
            <div className="text-[15px] text-[var(--kb-ink-500)]">
              프로젝트 게시판을 찾을 수 없습니다.
            </div>
          </section>
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {project.coverImageUrl ? (
                  <img
                    src={project.coverImageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-[18px] object-cover ring-1 ring-[#e8e8e4]"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-[#0a0a0a] text-[17px] font-black text-white"
                    style={{ fontFamily: "var(--kb-font-mono)", letterSpacing: "0.02em" }}
                  >
                    {project.prefix}
                  </div>
                )}
                <div className="min-w-0">
                  <div
                    className="kb-mono mb-1 text-[12.5px] uppercase text-[var(--kb-ink-500)]"
                    style={{ letterSpacing: "0.14em" }}
                  >
                    {project.slug}
                  </div>
                  <h1
                    className="kb-display m-0 truncate text-[30px] font-semibold leading-tight text-[#0a0a0a]"
                    style={{ letterSpacing: 0 }}
                  >
                    {project.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--kb-ink-500)]">
                    <span className="font-semibold text-[var(--kb-navy-800)]">
                      {getProjectStatusLabel(project.status)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.memberCount}명
                    </span>
                    <span>게시글 {records.length}건</span>
                    {totalMinutes > 0 ? <span>누적 {totalMinutes}분</span> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
                >
                  <RefreshCw className="h-4 w-4" />
                  새로고침
                </button>
                {canWrite ? (
                  <Link
                    to={writePath(project.slug)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white no-underline hover:bg-[var(--kb-ink-800)]"
                  >
                    <PenLine className="h-4 w-4" />
                    글쓰기
                  </Link>
                ) : null}
              </div>
            </header>

            <section style={{ ...PANEL_STYLE, overflow: "hidden" }}>
              <div className="flex flex-col gap-3 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="m-0 text-[18px] font-semibold text-[var(--kb-ink-900)]">
                    스터디 게시글
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1ede4] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--kb-ink-700)]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {visibleRecords.length}개
                  </span>
                </div>

                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--kb-ink-400)]" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="게시글 검색"
                    className="w-full rounded-md border border-[#e8e8e4] bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none"
                  />
                </div>
              </div>

              <div className="hidden grid-cols-[64px_1fr_130px_116px_92px] border-b border-[#f1ede4] bg-[#fbfbf8] px-5 py-3 text-[12.5px] font-semibold text-[var(--kb-ink-500)] md:grid sm:px-7">
                <div className="text-center">번호</div>
                <div>제목</div>
                <div>작성자</div>
                <div>작성일</div>
                <div className="text-right">정보</div>
              </div>

              {visibleRecords.length === 0 ? (
                <div className="px-5 py-14 text-center text-[14px] text-[var(--kb-ink-500)]">
                  아직 이 프로젝트에 올라온 스터디 게시글이 없습니다.
                </div>
              ) : (
                <div>
                  {visibleRecords.map((record, index) => (
                    <BoardRow
                      key={record.id}
                      index={visibleRecords.length - index}
                      record={record}
                      slug={project.slug}
                      canEdit={record.authorUserId === user?.id || project.isLead}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
