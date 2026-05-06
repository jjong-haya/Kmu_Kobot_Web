import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { PartialBlock } from "@blocknote/core";
import { ko } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, BookOpen, Loader2, RefreshCw, Send } from "lucide-react";
import {
  getProjectBySlug,
  type ProjectDetail as ProjectDetailData,
} from "../../api/projects";
import {
  getProjectStudyRecord,
  submitStudyRecord,
  updateStudyRecord,
  uploadStudyImages,
  type StudyContentJson,
  type StudyRecord,
  type StudyRecordVisibility,
} from "../../api/studies";
import { recordSecurityEvent } from "../../api/security-events";
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

type StoredDraft = {
  title: string;
  duration: string;
  visibility: StudyRecordVisibility;
  contentJson: StudyContentJson | null;
  updatedAt: string;
};

const STUDY_EDITOR_DICTIONARY = {
  ...ko,
  placeholders: {
    ...ko.placeholders,
    default: "본문을 입력하거나 '/'를 눌러 블록을 추가하세요.",
    emptyDocument: "본문을 입력하거나 '/'를 눌러 블록을 추가하세요.",
    heading: "소제목",
    toggleListItem: "토글",
    bulletListItem: "목록",
    numberedListItem: "번호 목록",
    checkListItem: "할 일",
  },
};

function boardPath(slug: string) {
  return `/member/study-log/${encodeURIComponent(slug)}`;
}

function postPath(slug: string, recordId: string) {
  return `${boardPath(slug)}/posts/${encodeURIComponent(recordId)}`;
}

function canWriteStudy(project: ProjectDetailData | null) {
  return Boolean(
    project &&
      project.isMember &&
      ["pending", "recruiting", "active"].includes(project.status),
  );
}

function draftStorageKey(
  projectId: string,
  userId: string | null | undefined,
  recordId?: string | null,
) {
  return recordId
    ? `study-post-edit-draft:${projectId}:${recordId}:${userId ?? "anonymous"}`
    : `study-post-draft:${projectId}:${userId ?? "anonymous"}`;
}

function isVisibility(value: unknown): value is StudyRecordVisibility {
  return value === "self" || value === "project" || value === "member" || value === "public";
}

function isBlockArray(value: unknown): value is StudyContentJson {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))
  );
}

function readDraft(draftKey: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      duration: typeof parsed.duration === "string" ? parsed.duration : "",
      visibility: isVisibility(parsed.visibility) ? parsed.visibility : "member",
      contentJson: isBlockArray(parsed.contentJson) ? parsed.contentJson : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    window.localStorage.removeItem(draftKey);
    return null;
  }
}

function bodyTextBlocks(text: string): PartialBlock[] {
  return text
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ type: "paragraph", content: line }));
}

function initialContentFromRecord(record: StudyRecord | null | undefined): PartialBlock[] {
  if (record?.contentJson && record.contentJson.length > 0) {
    return record.contentJson as PartialBlock[];
  }

  if (record?.body?.trim()) {
    return bodyTextBlocks(record.body);
  }

  return [{ type: "paragraph", content: "" }];
}

function initialContentFromDraft(
  draft: StoredDraft | null,
  record: StudyRecord | null | undefined,
): PartialBlock[] {
  return draft?.contentJson && draft.contentJson.length > 0
    ? (draft.contentJson as PartialBlock[])
    : initialContentFromRecord(record);
}

function cloneContent(blocks: unknown): StudyContentJson {
  try {
    const cloned = JSON.parse(JSON.stringify(blocks));
    return isBlockArray(cloned) ? cloned : [];
  } catch {
    return [];
  }
}

function textFromUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromUnknown).join("");
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if (record.content) return textFromUnknown(record.content);
  return "";
}

function blocksToPlainText(blocks: StudyContentJson): string {
  const lines: string[] = [];

  function walk(items: StudyContentJson) {
    for (const block of items) {
      const text = textFromUnknown(block.content).trim();
      if (text) lines.push(text);

      if (Array.isArray(block.children)) {
        walk(block.children as StudyContentJson);
      }
    }
  }

  walk(blocks);
  return lines.join("\n\n").trim();
}

function collectImageUrls(blocks: StudyContentJson): string[] {
  const urls = new Set<string>();

  function walk(items: StudyContentJson) {
    for (const block of items) {
      const props = block.props;
      const url =
        block.type === "image" &&
        props &&
        typeof props === "object" &&
        typeof (props as Record<string, unknown>).url === "string"
          ? ((props as Record<string, unknown>).url as string).trim()
          : "";

      if (url) urls.add(url);
      if (Array.isArray(block.children)) {
        walk(block.children as StudyContentJson);
      }
    }
  }

  walk(blocks);
  return [...urls];
}

function hasDocumentContent(blocks: StudyContentJson) {
  return blocksToPlainText(blocks).length > 0 || collectImageUrls(blocks).length > 0;
}

function StudyPostComposer({
  project,
  draftKey,
  record,
}: {
  project: ProjectDetailData;
  draftKey: string;
  record?: StudyRecord | null;
}) {
  const navigate = useNavigate();
  const isEditMode = Boolean(record);
  const initialDraft = useMemo(() => readDraft(draftKey), [draftKey]);
  const [title, setTitle] = useState(initialDraft?.title ?? record?.title ?? "");
  const [duration, setDuration] = useState(
    initialDraft?.duration ??
      (typeof record?.durationMinutes === "number" ? String(record.durationMinutes) : ""),
  );
  const [visibility, setVisibility] = useState<StudyRecordVisibility>(
    initialDraft?.visibility ?? record?.visibility ?? "member",
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const editor = useCreateBlockNote(
    {
      initialContent: initialContentFromDraft(initialDraft, record),
      dictionary: STUDY_EDITOR_DICTIONARY,
      uploadFile: async (file) => {
        try {
          const [url] = await uploadStudyImages([file], project.id);
          setFormError(null);
          return url;
        } catch (requestError) {
          const message = sanitizeUserError(requestError, "이미지를 업로드하지 못했습니다.");
          setFormError(message);
          throw new Error(message);
        }
      },
    },
    [project.id, draftKey, record?.id],
  );
  const [blocksSnapshot, setBlocksSnapshot] = useState<StudyContentJson>(() =>
    cloneContent(editor.document),
  );

  const canSubmit = Boolean(title.trim()) && !saving;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const hasContent = Boolean(
        title.trim() ||
          duration.trim() ||
          visibility !== (record?.visibility ?? "member") ||
          hasDocumentContent(blocksSnapshot),
      );

      if (!hasContent) {
        window.localStorage.removeItem(draftKey);
        return;
      }

      const draft: StoredDraft = {
        title,
        duration,
        visibility,
        contentJson: blocksSnapshot,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [blocksSnapshot, draftKey, duration, title, visibility]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!title.trim() && !duration.trim() && !hasDocumentContent(blocksSnapshot)) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [blocksSnapshot, duration, title]);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setFormError("게시글 제목을 입력해 주세요.");
      return;
    }

    const parsedDuration = duration.trim() ? Number.parseInt(duration.trim(), 10) : null;
    if (
      parsedDuration !== null &&
      (!Number.isFinite(parsedDuration) || parsedDuration < 0 || parsedDuration > 1440)
    ) {
      setFormError("스터디 시간은 0분 이상 1440분 이하로 입력해 주세요.");
      return;
    }

    const contentJson = cloneContent(editor.document);
    const body = blocksToPlainText(contentJson) || null;
    const imageUrls = collectImageUrls(contentJson);

    try {
      setSaving(true);
      setFormError(null);
      const saved =
        record?.id
          ? await updateStudyRecord({
              recordId: record.id,
              title: title.trim(),
              body,
              durationMinutes: parsedDuration,
              imageUrls,
              contentJson,
              visibility,
            })
          : await submitStudyRecord({
              projectTeamId: project.id,
              title: title.trim(),
              body,
              durationMinutes: parsedDuration,
              imageUrls,
              contentJson,
              visibility,
            });

      if (!record?.id) {
        await recordSecurityEvent({
          eventType: "study.record.create",
          path: window.location.pathname,
          entityTable: "study_records",
          entityId: saved.id,
          metadata: {
            projectTeamId: project.id,
            visibility,
            imageCount: imageUrls.length,
            hasBody: Boolean(body),
          },
        }).catch(() => undefined);
      }

      window.localStorage.removeItem(draftKey);
      navigate(postPath(project.slug, saved.id), { replace: true });
    } catch (requestError) {
      setFormError(sanitizeUserError(requestError, "게시글을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ ...PANEL_STYLE, overflow: "hidden" }}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <div
            className="kb-mono mb-1 truncate text-[12px] uppercase text-[var(--kb-ink-500)]"
            style={{ letterSpacing: "0.14em" }}
          >
            {project.slug}
          </div>
          <h1 className="m-0 truncate text-[20px] font-semibold text-[var(--kb-ink-900)]">
            {project.name}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as StudyRecordVisibility)}
            className="h-10 rounded-md border border-[#e8e8e4] bg-white px-3 text-[13px] font-medium text-[var(--kb-ink-700)] outline-none"
          >
            <option value="member">전체</option>
            <option value="project">프로젝트만</option>
            <option value="self">나만</option>
            <option value="public">공개</option>
          </select>
          <input
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="분"
            inputMode="numeric"
            className="h-10 w-[82px] rounded-md border border-[#e8e8e4] bg-white px-3 text-[13px] outline-none"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0a0a0a] px-4 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isEditMode ? "수정" : "등록"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[860px] px-5 py-8 sm:px-8">
        {formError ? (
          <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {formError}
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-600)]">
            게시글 제목
          </span>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="제목을 입력하세요"
            className="h-13 w-full rounded-md border border-[#e8e8e4] bg-white px-4 text-[18px] font-semibold text-[var(--kb-ink-900)] outline-none transition-colors placeholder:text-[var(--kb-ink-300)] focus:border-[#111111]"
          />
        </label>

        <div className="my-7 border-t border-[#ece9df]" />

        <BlockNoteView
          editor={editor}
          theme="light"
          editable={!saving}
          className="study-blocknote study-blocknote-editor"
          onChange={(changedEditor) => {
            setBlocksSnapshot(cloneContent(changedEditor.document));
            if (formError) setFormError(null);
          }}
        />
      </div>
    </form>
  );
}

export default function StudyPostWrite() {
  const { slug = "", recordId = "" } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [record, setRecord] = useState<StudyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    if (!user || !slug) {
      setProject(null);
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const projectRow = await getProjectBySlug(slug, user.id);
      setProject(projectRow);
      setRecord(projectRow && recordId ? await getProjectStudyRecord(projectRow.id, recordId) : null);
    } catch (requestError) {
      setLoadError(sanitizeUserError(requestError, "프로젝트를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug, recordId, user?.id]);

  const isEditMode = Boolean(recordId);
  const canWrite = canWriteStudy(project);
  const canEdit =
    Boolean(project && record && (record.authorUserId === user?.id || project.isLead));
  const draftKey = project ? draftStorageKey(project.id, user?.id, recordId || null) : null;

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1040px] flex-col gap-5">
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
            {isEditMode ? "수정 화면을 불러오는 중입니다." : "글쓰기 화면을 불러오는 중입니다."}
          </div>
        ) : loadError ? (
          <section style={{ ...PANEL_STYLE, padding: 32 }}>
            <div className="text-[15px] font-semibold text-red-700">{loadError}</div>
          </section>
        ) : !project || (isEditMode && !record) ? (
          <section style={{ ...PANEL_STYLE, padding: 56 }} className="text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
            <div className="text-[15px] text-[var(--kb-ink-500)]">
              {isEditMode ? "수정할 게시글을 찾을 수 없습니다." : "프로젝트 게시판을 찾을 수 없습니다."}
            </div>
          </section>
        ) : (!isEditMode && !canWrite) || (isEditMode && !canEdit) || !draftKey ? (
          <section style={{ ...PANEL_STYLE, padding: 32 }}>
            <div className="text-[15px] text-[var(--kb-ink-500)]">
              {isEditMode
                ? "작성자 또는 프로젝트 리드만 이 게시글을 수정할 수 있습니다."
                : "프로젝트 멤버만 이 게시판에 글을 작성할 수 있습니다."}
            </div>
          </section>
        ) : (
          <StudyPostComposer key={draftKey} project={project} draftKey={draftKey} record={record} />
        )}
      </div>
    </div>
  );
}
