import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { PartialBlock } from "@blocknote/core";
import { ko } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  PenLine,
  RefreshCw,
  UserRound,
} from "lucide-react";
import {
  getProjectBySlug,
  type ProjectDetail as ProjectDetailData,
} from "../../api/projects";
import {
  getProjectStudyRecord,
  listStudyRecordRevisions,
  type StudyContentJson,
  type StudyRecord,
  type StudyRecordRevision,
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

function editPath(slug: string, recordId: string) {
  return `${boardPath(slug)}/posts/${encodeURIComponent(recordId)}/edit`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 없음";

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function isBlockArray(value: unknown): value is StudyContentJson {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))
  );
}

function bodyTextBlocks(text: string): PartialBlock[] {
  return text
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ type: "paragraph", content: line }));
}

function legacyContent(record: StudyRecord): PartialBlock[] {
  const blocks: PartialBlock[] = [];
  const body = record.body ?? "";
  const tokenPattern = /\[\[study-image:(\d+)]]/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(body)) !== null) {
    const before = body.slice(cursor, match.index).trim();
    if (before) blocks.push(...bodyTextBlocks(before));

    const url = record.imageUrls[Number(match[1])];
    if (url) {
      blocks.push({
        type: "image",
        props: { url, name: "image", caption: "", showPreview: true },
      } as PartialBlock);
    }
    cursor = match.index + match[0].length;
  }

  const rest = body.slice(cursor).trim();
  if (rest) blocks.push(...bodyTextBlocks(rest));

  for (const url of record.imageUrls) {
    const alreadyUsed = blocks.some((block) => {
      const props = (block as Record<string, unknown>).props;
      return props && typeof props === "object" && (props as Record<string, unknown>).url === url;
    });
    if (!alreadyUsed) {
      blocks.push({
        type: "image",
        props: { url, name: "image", caption: "", showPreview: true },
      } as PartialBlock);
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", content: "본문 없음" }];
}

function contentForRecord(record: StudyRecord): PartialBlock[] {
  return isBlockArray(record.contentJson) ? (record.contentJson as PartialBlock[]) : legacyContent(record);
}

function StudyPostContent({ record }: { record: StudyRecord }) {
  const initialContent = useMemo(() => contentForRecord(record), [record]);
  const editor = useCreateBlockNote(
    {
      initialContent,
      dictionary: ko,
    },
    [record.id],
  );

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      editable={false}
      className="study-blocknote study-blocknote-readonly"
    />
  );
}

export default function StudyPostDetail() {
  const { slug = "", recordId = "" } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [record, setRecord] = useState<StudyRecord | null>(null);
  const [revisions, setRevisions] = useState<StudyRecordRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canWrite = canWriteStudy(project);
  const canEdit = Boolean(project && record && (record.authorUserId === user?.id || project.isLead));

  async function refresh() {
    if (!user || !slug || !recordId) {
      setProject(null);
      setRecord(null);
      setRevisions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectRow = await getProjectBySlug(slug, user.id);
      const recordRow = projectRow ? await getProjectStudyRecord(projectRow.id, recordId) : null;
      setProject(projectRow);
      setRecord(recordRow);
      setRevisions(recordRow ? await listStudyRecordRevisions(recordRow.id) : []);
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "게시글을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug, recordId, user?.id]);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[980px] flex-col gap-5">
        <Link
          to={slug ? boardPath(slug) : "/member/study-log"}
          className="inline-flex w-fit items-center gap-1.5 text-[13.5px] text-[var(--kb-ink-500)] no-underline hover:text-[var(--kb-ink-900)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          게시판으로
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            게시글을 불러오는 중입니다.
          </div>
        ) : error ? (
          <section style={{ ...PANEL_STYLE, padding: 32 }}>
            <div className="text-[15px] font-semibold text-red-700">{error}</div>
          </section>
        ) : !project || !record ? (
          <section style={{ ...PANEL_STYLE, padding: 56 }} className="text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
            <div className="text-[15px] text-[var(--kb-ink-500)]">
              게시글을 찾을 수 없습니다.
            </div>
          </section>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="kb-mono mb-1 truncate text-[12px] uppercase text-[var(--kb-ink-500)]"
                  style={{ letterSpacing: "0.14em" }}
                >
                  {project.name}
                </div>
                <h1 className="m-0 text-[28px] font-semibold text-[var(--kb-ink-900)]">
                  스터디 게시글
                </h1>
              </div>
              {canWrite ? (
                <Link
                  to={writePath(project.slug)}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white no-underline"
                >
                  <PenLine className="h-4 w-4" />
                  글쓰기
                </Link>
              ) : null}
              {canEdit ? (
                <Link
                  to={editPath(project.slug, record.id)}
                  className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--kb-ink-800)] no-underline hover:border-[var(--kb-ink-300)]"
                >
                  <PenLine className="h-4 w-4" />
                  수정
                </Link>
              ) : null}
            </header>

            <article style={{ ...PANEL_STYLE, overflow: "hidden" }}>
              <div className="mx-auto max-w-[820px] px-5 py-9 sm:px-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#e8e8e4] bg-[#fafaf6] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-700)]">
                    {visibilityLabel(record.visibility)}
                  </span>
                  {record.durationMinutes !== null ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f1ede4] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-600)]">
                      <Clock className="h-3 w-3" />
                      {record.durationMinutes}분
                    </span>
                  ) : null}
                </div>

                <h2 className="m-0 text-[32px] font-semibold leading-snug text-[var(--kb-ink-900)]">
                  {record.title}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#f1ede4] pb-6 text-[13px] text-[var(--kb-ink-500)]">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    {record.author?.displayName ?? "작성자 없음"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDateTime(record.createdAt)}
                  </span>
                </div>

                <div className="mt-8">
                  <StudyPostContent record={record} />
                </div>

                {revisions.length > 0 ? (
                  <section className="mt-10 border-t border-[#f1ede4] pt-6">
                    <h3 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">
                      수정 기록
                    </h3>
                    <div className="mt-3 grid gap-2">
                      {revisions.map((revision) => (
                        <div
                          key={revision.id}
                          className="rounded-md border border-[#ebe8e0] bg-[#fbfbf8] px-3 py-2 text-[13px] text-[var(--kb-ink-600)]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-[var(--kb-ink-800)]">
                              v{revision.revisionNumber} ·{" "}
                              {revision.editor?.displayName ?? "수정자 없음"}
                            </span>
                            <span>{formatDateTime(revision.editedAt)}</span>
                          </div>
                          {revision.oldTitle !== revision.newTitle ? (
                            <div className="mt-1 truncate text-[12.5px] text-[var(--kb-ink-500)]">
                              제목: {revision.oldTitle ?? "없음"} → {revision.newTitle ?? "없음"}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </article>
          </>
        )}
      </div>
    </div>
  );
}
