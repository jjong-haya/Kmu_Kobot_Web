import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  PenLine,
  RefreshCw,
  Search,
  UploadCloud,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  getProjectBySlug,
  type ProjectDetail as ProjectDetailData,
} from "../../api/projects";
import { getProjectStatusLabel } from "../../api/project-policy.js";
import {
  listProjectStudyMaterials,
  listProjectStudyRecords,
  STUDY_MATERIAL_ACCEPT,
  uploadProjectStudyMaterial,
  type StudyMaterial,
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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";

  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(value: number | null) {
  if (!value || value <= 0) return "크기 없음";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))}KB`;
  return `${(value / 1024 / 1024).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)}MB`;
}

function fileTypeLabel(fileName: string) {
  const extension = fileName.split(".").pop()?.toUpperCase();
  return extension && extension.length <= 5 ? extension : "FILE";
}

function defaultMaterialTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim();
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

function StudyMaterialUploadDialog({
  project,
  open,
  onClose,
  onUploaded,
}: {
  project: ProjectDetailData;
  open: boolean;
  onClose: () => void;
  onUploaded: (material: StudyMaterial) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setTitle("");
      setDescription("");
      setFormError(null);
      setUploading(false);
    }
  }, [open]);

  if (!open) return null;

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setFormError(null);

    if (selected && !title.trim()) {
      setTitle(defaultMaterialTitle(selected.name));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!file) {
      setFormError("올릴 자료 파일을 선택해 주세요.");
      return;
    }

    try {
      setUploading(true);
      setFormError(null);
      const uploaded = await uploadProjectStudyMaterial({
        projectTeamId: project.id,
        file,
        title,
        description,
      });
      onUploaded(uploaded);
      onClose();
    } catch (requestError) {
      setFormError(sanitizeUserError(requestError, "스터디 자료를 업로드하지 못했습니다."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="스터디 자료 업로드"
        className="w-full max-w-[520px] overflow-hidden rounded-lg border border-[#e8e8e4] bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#f1ede4] px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-[var(--kb-ink-500)]">
              {project.name}
            </div>
            <h2 className="m-0 text-[18px] font-semibold text-[var(--kb-ink-900)]">
              자료올리기
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e8e8e4] text-[var(--kb-ink-500)] hover:border-[var(--kb-ink-300)] disabled:opacity-50"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-5 py-5">
          {formError ? (
            <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2.5 text-[13.5px] font-semibold text-red-700">
              {formError}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-600)]">
              파일
            </span>
            <input
              type="file"
              accept={STUDY_MATERIAL_ACCEPT}
              onChange={chooseFile}
              disabled={uploading}
              className="block w-full cursor-pointer rounded-md border border-dashed border-[#d7d2c7] bg-[#fbfbf8] px-3 py-3 text-[13.5px] text-[var(--kb-ink-700)] file:mr-3 file:rounded-md file:border-0 file:bg-[#0a0a0a] file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {file ? (
            <div className="flex items-center gap-3 rounded-md border border-[#f1ede4] bg-[#fffdf7] px-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#efe9dc] text-[11px] font-black text-[var(--kb-ink-700)]">
                {fileTypeLabel(file.name)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-[var(--kb-ink-900)]">
                  {file.name}
                </div>
                <div className="text-[12.5px] text-[var(--kb-ink-500)]">
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-600)]">
              제목
            </span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (formError) setFormError(null);
              }}
              disabled={uploading}
              placeholder="자료 제목"
              maxLength={120}
              className="h-11 w-full rounded-md border border-[#e8e8e4] bg-white px-3 text-[14px] outline-none focus:border-[#111111] disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-[var(--kb-ink-600)]">
              메모
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={uploading}
              placeholder="버전, 발표일, 참고 범위"
              maxLength={1000}
              rows={3}
              className="w-full resize-none rounded-md border border-[#e8e8e4] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[#111111] disabled:opacity-60"
            />
          </label>

          <div className="rounded-md bg-[#f7f7f2] px-3 py-2 text-[12.5px] text-[var(--kb-ink-500)]">
            PDF, PPTX, DOCX, XLSX, HWP, ZIP, TXT/CSV/MD · 50MB 이하
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#f1ede4] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-md border border-[#e8e8e4] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            업로드
          </button>
        </footer>
      </form>
    </div>
  );
}

function StudyMaterialsSection({
  materials,
}: {
  materials: StudyMaterial[];
}) {
  return (
    <section style={{ ...PANEL_STYLE, overflow: "hidden" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1ede4] px-5 py-4 sm:px-7">
        <div>
          <h2 className="m-0 text-[18px] font-semibold text-[var(--kb-ink-900)]">
            스터디 자료
          </h2>
          <p className="m-0 mt-1 text-[13px] text-[var(--kb-ink-500)]">
            프로젝트 멤버만 볼 수 있는 자료함입니다.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1ede4] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--kb-ink-700)]">
          <FileText className="h-3.5 w-3.5" />
          {materials.length}개
        </span>
      </div>

      {materials.length === 0 ? (
        <div className="px-5 py-12 text-center text-[14px] text-[var(--kb-ink-500)]">
          아직 이 프로젝트에 올라온 스터디 자료가 없습니다.
        </div>
      ) : (
        <div className="divide-y divide-[#f1ede4]">
          {materials.map((material) => (
            <div
              key={material.id}
              className="grid gap-3 px-5 py-4 sm:px-7 md:grid-cols-[44px_1fr_170px_108px] md:items-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#efe9dc] text-[11px] font-black text-[var(--kb-ink-700)]">
                {fileTypeLabel(material.fileName)}
              </div>

              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold text-[var(--kb-ink-900)]">
                  {material.title}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--kb-ink-500)]">
                  <span className="truncate">{material.fileName}</span>
                  <span>{formatFileSize(material.fileSize)}</span>
                </div>
                {material.description ? (
                  <p className="m-0 mt-1 line-clamp-1 text-[13px] text-[var(--kb-ink-500)]">
                    {material.description}
                  </p>
                ) : null}
              </div>

              <div className="text-[13px] text-[var(--kb-ink-500)]">
                {formatDateTime(material.createdAt)}
              </div>

              {material.downloadUrl ? (
                <a
                  href={material.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#e8e8e4] bg-white px-3 text-[13.5px] font-semibold text-[var(--kb-ink-700)] no-underline hover:border-[var(--kb-ink-300)]"
                >
                  <Download className="h-4 w-4" />
                  다운로드
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#e8e8e4] bg-white px-3 text-[13.5px] font-semibold text-[var(--kb-ink-400)]"
                >
                  <Download className="h-4 w-4" />
                  준비중
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
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
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [materialUploadOpen, setMaterialUploadOpen] = useState(false);

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
      setMaterials([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const projectRow = await getProjectBySlug(slug, user.id);
      setProject(projectRow);
      if (projectRow) {
        const [projectRecords, projectMaterials] = await Promise.all([
          listProjectStudyRecords(projectRow.id, 100),
          listProjectStudyMaterials(projectRow.id),
        ]);
        setRecords(projectRecords);
        setMaterials(projectMaterials);
      } else {
        setRecords([]);
        setMaterials([]);
      }
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
                    <span>자료 {materials.length}개</span>
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
                  <>
                    <button
                      type="button"
                      onClick={() => setMaterialUploadOpen(true)}
                      className="inline-flex items-center gap-2 rounded-md border border-[#0a0a0a] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0a0a0a] hover:bg-[#fafaf6]"
                    >
                      <UploadCloud className="h-4 w-4" />
                      자료올리기
                    </button>
                    <Link
                      to={writePath(project.slug)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white no-underline hover:bg-[var(--kb-ink-800)]"
                    >
                      <PenLine className="h-4 w-4" />
                      글쓰기
                    </Link>
                  </>
                ) : null}
              </div>
            </header>

            <StudyMaterialsSection materials={materials} />

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

            <StudyMaterialUploadDialog
              project={project}
              open={materialUploadOpen}
              onClose={() => setMaterialUploadOpen(false)}
              onUploaded={(material) => setMaterials((current) => [material, ...current])}
            />
          </>
        )}
      </div>
    </div>
  );
}
