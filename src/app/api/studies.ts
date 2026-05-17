import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

const FALLBACK = "스터디 기록을 불러오지 못했습니다.";
const STUDY_IMAGE_BUCKET = "study-images";
const STUDY_MATERIAL_BUCKET = "study-materials";
const MAX_STUDY_IMAGE_COUNT = 30;
const MAX_STUDY_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_STUDY_MATERIAL_SIZE = 50 * 1024 * 1024;
export const STUDY_MATERIAL_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.hwp,.hwpx,.zip,.txt,.md,.csv";
const STUDY_MATERIAL_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "odt",
  "odp",
  "ods",
  "hwp",
  "hwpx",
  "zip",
  "txt",
  "md",
  "csv",
]);
const STUDY_MATERIAL_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/x-hwp",
  "application/haansofthwp",
  "application/vnd.hancom.hwp",
  "application/vnd.hancom.hwpx",
  "text/plain",
  "text/markdown",
  "text/csv",
]);

export type StudyRecordVisibility = "self" | "project" | "member" | "public";
export type StudyRecordStatus = "draft" | "submitted" | "reviewed" | "locked";
export type StudyContentJson = Record<string, unknown>[];

export type StudyAuthor = {
  id: string;
  displayName: string;
  loginId: string | null;
  avatarUrl: string | null;
};

export type StudyProject = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  status: string;
  lead: StudyAuthor | null;
  coverImageUrl: string | null;
};

export type StudyRecord = {
  id: string;
  studySessionId: string | null;
  projectTeamId: string | null;
  project: StudyProject | null;
  authorUserId: string;
  author: StudyAuthor | null;
  title: string;
  body: string | null;
  durationMinutes: number | null;
  occurredAt: string;
  status: StudyRecordStatus;
  visibility: StudyRecordVisibility;
  imageUrls: string[];
  coverImageUrl: string | null;
  contentJson: StudyContentJson | null;
  editCount: number;
  lastEditedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type SubmitStudyRecordInput = {
  projectTeamId?: string | null;
  studySessionId?: string | null;
  title: string;
  body?: string | null;
  durationMinutes?: number | null;
  imageUrls?: string[];
  contentJson?: StudyContentJson | null;
  occurredAt?: string | null;
  visibility?: StudyRecordVisibility;
};

export type UpdateStudyRecordInput = {
  recordId: string;
  title: string;
  body?: string | null;
  durationMinutes?: number | null;
  imageUrls?: string[];
  contentJson?: StudyContentJson | null;
  visibility?: StudyRecordVisibility;
};

export type StudyRecordRevision = {
  id: string;
  studyRecordId: string;
  revisionNumber: number;
  editedBy: string;
  editor: StudyAuthor | null;
  editedAt: string;
  oldTitle: string | null;
  newTitle: string | null;
  oldBody: string | null;
  newBody: string | null;
  oldVisibility: StudyRecordVisibility | null;
  newVisibility: StudyRecordVisibility | null;
};

export type StudyMaterial = {
  id: string;
  projectTeamId: string;
  title: string;
  description: string | null;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  storagePath: string;
  uploadedBy: string | null;
  downloadUrl: string | null;
  createdAt: string;
};

export type UploadProjectStudyMaterialInput = {
  projectTeamId: string;
  file: File;
  title?: string | null;
  description?: string | null;
};

export type DeleteProjectStudyMaterialInput = {
  materialId: string;
  storagePath?: string | null;
};

type StudyRecordDbRow = {
  id: string;
  study_session_id: string | null;
  project_team_id: string | null;
  author_user_id: string;
  title: string;
  body: string | null;
  duration_minutes: number | null;
  occurred_at: string;
  status: StudyRecordStatus;
  visibility: StudyRecordVisibility;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type ProfileDbRow = {
  id: string;
  display_name: string | null;
  nickname_display?: string | null;
  full_name: string | null;
  login_id?: string | null;
  avatar_url: string | null;
  email: string | null;
};

type ProjectDbRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  status: string;
  lead_user_id: string | null;
  owner_user_id: string | null;
  metadata: unknown;
};

type StudyRecordRevisionDbRow = {
  id: string;
  study_record_id: string;
  revision_number: number;
  edited_by: string;
  edited_at: string;
  old_title: string | null;
  new_title: string | null;
  old_body: string | null;
  new_body: string | null;
  old_visibility: StudyRecordVisibility | null;
  new_visibility: StudyRecordVisibility | null;
};

type StudyMaterialDbRow = {
  id: string;
  project_team_id: string | null;
  title: string;
  material_type: string;
  storage_path: string | null;
  created_by: string | null;
  metadata: unknown;
  created_at: string;
};

const STUDY_RECORD_SELECT = [
  "id",
  "study_session_id",
  "project_team_id",
  "author_user_id",
  "title",
  "body",
  "duration_minutes",
  "occurred_at",
  "status",
  "visibility",
  "metadata",
  "created_at",
  "updated_at",
].join(", ");

const PROFILE_SELECT = [
  "id",
  "display_name",
  "nickname_display",
  "full_name",
  "login_id",
  "avatar_url",
  "email",
].join(", ");

const STUDY_REVISION_SELECT = [
  "id",
  "study_record_id",
  "revision_number",
  "edited_by",
  "edited_at",
  "old_title",
  "new_title",
  "old_body",
  "new_body",
  "old_visibility",
  "new_visibility",
].join(", ");

const STUDY_MATERIAL_SELECT = [
  "id",
  "project_team_id",
  "title",
  "material_type",
  "storage_path",
  "created_by",
  "metadata",
  "created_at",
].join(", ");

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readMetadataString(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = normalizeString(metadata[key]);
    if (value) return value;
  }

  return null;
}

function readMetadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return 0;
}

function readImageUrls(metadata: Record<string, unknown>) {
  const raw = metadata.imageUrls ?? metadata.image_urls ?? metadata.images;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((value) => normalizeString(value))
    .filter((value): value is string => value !== null)
    .slice(0, MAX_STUDY_IMAGE_COUNT);
}

function readContentJson(metadata: Record<string, unknown>): StudyContentJson | null {
  const raw = metadata.contentJson ?? metadata.content_json;
  if (!Array.isArray(raw)) return null;

  const isBlockArray = raw.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  );
  return isBlockArray ? (raw as StudyContentJson) : null;
}

function displayNameFor(profile: ProfileDbRow) {
  return (
    normalizeString(profile.nickname_display) ??
    normalizeString(profile.display_name) ??
    normalizeString(profile.full_name) ??
    normalizeString(profile.email)?.split("@")[0] ??
    "이름 없음"
  );
}

function mapAuthor(profile: ProfileDbRow): StudyAuthor {
  return {
    id: profile.id,
    displayName: displayNameFor(profile),
    loginId: normalizeString(profile.login_id),
    avatarUrl: normalizeString(profile.avatar_url),
  };
}

async function listAuthors(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, StudyAuthor>();

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("id", uniqueIds);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return new Map(((data ?? []) as unknown as ProfileDbRow[]).map((row) => [row.id, mapAuthor(row)]));
}

async function listProjects(projectIds: string[]) {
  const uniqueIds = [...new Set(projectIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, StudyProject>();

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("project_teams")
    .select("id, slug, name, summary, status, lead_user_id, owner_user_id, metadata")
    .in("id", uniqueIds);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  const rows = (data ?? []) as ProjectDbRow[];
  const leadersById = await listAuthors(
    rows
      .map((row) => row.lead_user_id ?? row.owner_user_id)
      .filter((id): id is string => Boolean(id)),
  );

  return new Map(
    rows.map((row) => {
      const metadata = metadataRecord(row.metadata);
      const leadId = row.lead_user_id ?? row.owner_user_id;

      return [
        row.id,
        {
          id: row.id,
          slug: row.slug,
          name: row.name,
          summary: row.summary,
          status: row.status,
          lead: leadId ? leadersById.get(leadId) ?? null : null,
          coverImageUrl: readMetadataString(
            metadata,
            "coverImageUrl",
            "cover_image_url",
            "imageUrl",
            "image_url",
            "thumbnailUrl",
            "thumbnail_url",
          ),
        },
      ];
    }),
  );
}

function mapStudyRecord(
  row: StudyRecordDbRow,
  authorsById: Map<string, StudyAuthor>,
  projectsById: Map<string, StudyProject>,
): StudyRecord {
  const metadata = metadataRecord(row.metadata);
  const imageUrls = readImageUrls(metadata);

  return {
    id: row.id,
    studySessionId: row.study_session_id,
    projectTeamId: row.project_team_id,
    project: row.project_team_id ? projectsById.get(row.project_team_id) ?? null : null,
    authorUserId: row.author_user_id,
    author: authorsById.get(row.author_user_id) ?? null,
    title: row.title,
    body: row.body,
    durationMinutes: row.duration_minutes,
    occurredAt: row.occurred_at,
    status: row.status,
    visibility: row.visibility,
    imageUrls,
    coverImageUrl:
      readMetadataString(metadata, "coverImageUrl", "cover_image_url") ?? imageUrls[0] ?? null,
    contentJson: readContentJson(metadata),
    editCount: readMetadataNumber(metadata, "editCount"),
    lastEditedAt: readMetadataString(metadata, "lastEditedAt", "last_edited_at"),
    metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudyRevision(
  row: StudyRecordRevisionDbRow,
  authorsById: Map<string, StudyAuthor>,
): StudyRecordRevision {
  return {
    id: row.id,
    studyRecordId: row.study_record_id,
    revisionNumber: row.revision_number,
    editedBy: row.edited_by,
    editor: authorsById.get(row.edited_by) ?? null,
    editedAt: row.edited_at,
    oldTitle: row.old_title,
    newTitle: row.new_title,
    oldBody: row.old_body,
    newBody: row.new_body,
    oldVisibility: row.old_visibility,
    newVisibility: row.new_visibility,
  };
}

function readMetadataFileSize(metadata: Record<string, unknown>) {
  const value = metadata.fileSize ?? metadata.file_size;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function mapStudyMaterial(row: StudyMaterialDbRow): StudyMaterial {
  const metadata = metadataRecord(row.metadata);
  const storagePath = normalizeString(row.storage_path) ?? "";
  const fileName =
    readMetadataString(metadata, "fileName", "file_name", "originalName", "original_name") ??
    row.title;

  return {
    id: row.id,
    projectTeamId: row.project_team_id ?? "",
    title: row.title,
    description: readMetadataString(metadata, "description"),
    fileName,
    mimeType: readMetadataString(metadata, "mimeType", "mime_type"),
    fileSize: readMetadataFileSize(metadata),
    storagePath,
    uploadedBy: normalizeString(row.created_by) ?? readMetadataString(metadata, "uploadedBy"),
    downloadUrl: null,
    createdAt: row.created_at,
  };
}

function extensionForFileName(name: string) {
  return name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

function fallbackId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : fallbackId();
}

function safeStorageFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|#%{}^~\[\]`]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || `study-material-${fallbackId()}`;
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").trim();
}

function assertStudyMaterialFile(file: File) {
  const extension = extensionForFileName(file.name);
  const mimeType = file.type.trim().toLowerCase();

  if (!STUDY_MATERIAL_EXTENSIONS.has(extension)) {
    throw new Error("PDF, 문서, 발표 자료, 표, 압축 파일만 올릴 수 있습니다.");
  }

  if (
    mimeType &&
    !STUDY_MATERIAL_MIME_TYPES.has(mimeType) &&
    !mimeType.startsWith("text/")
  ) {
    throw new Error("스터디 자료로 지원하지 않는 파일 형식입니다.");
  }

  if (file.size <= 0) {
    throw new Error("빈 파일은 올릴 수 없습니다.");
  }

  if (file.size > MAX_STUDY_MATERIAL_SIZE) {
    throw new Error("자료 파일은 50MB 이하로 올려 주세요.");
  }
}

async function withDownloadUrl(material: StudyMaterial): Promise<StudyMaterial> {
  if (!material.storagePath) return material;

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(STUDY_MATERIAL_BUCKET)
    .createSignedUrl(material.storagePath, 60 * 10, {
      download: material.fileName,
    });

  if (error) {
    return { ...material, downloadUrl: null };
  }

  return { ...material, downloadUrl: data?.signedUrl ?? null };
}

async function hydrateStudyRecords(rows: StudyRecordDbRow[]) {
  const [authorsById, projectsById] = await Promise.all([
    listAuthors(rows.map((row) => row.author_user_id)),
    listProjects(rows.map((row) => row.project_team_id).filter((id): id is string => Boolean(id))),
  ]);

  return rows.map((row) => mapStudyRecord(row, authorsById, projectsById));
}

export async function listStudyRecords(limit = 80): Promise<StudyRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("study_records")
    .select(STUDY_RECORD_SELECT)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return hydrateStudyRecords((data ?? []) as unknown as StudyRecordDbRow[]);
}

export async function listProjectStudyRecords(
  projectTeamId: string,
  limit = 80,
): Promise<StudyRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("study_records")
    .select(STUDY_RECORD_SELECT)
    .eq("project_team_id", projectTeamId)
    .order("occurred_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));

  return hydrateStudyRecords((data ?? []) as unknown as StudyRecordDbRow[]);
}

export async function getProjectStudyRecord(
  projectTeamId: string,
  recordId: string,
): Promise<StudyRecord | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("study_records")
    .select(STUDY_RECORD_SELECT)
    .eq("id", recordId)
    .eq("project_team_id", projectTeamId)
    .maybeSingle();

  if (error) throw new Error(sanitizeUserError(error, FALLBACK));
  if (!data) return null;

  const [record] = await hydrateStudyRecords([data as unknown as StudyRecordDbRow]);
  return record ?? null;
}

export async function listStudyRecordRevisions(recordId: string): Promise<StudyRecordRevision[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("study_record_revisions")
    .select(STUDY_REVISION_SELECT)
    .eq("study_record_id", recordId)
    .order("revision_number", { ascending: false });

  if (error) throw new Error(sanitizeUserError(error, "수정 기록을 불러오지 못했습니다."));

  const rows = (data ?? []) as unknown as StudyRecordRevisionDbRow[];
  const authorsById = await listAuthors(rows.map((row) => row.edited_by));
  return rows.map((row) => mapStudyRevision(row, authorsById));
}

export async function listProjectStudyMaterials(projectTeamId: string): Promise<StudyMaterial[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("study_materials")
    .select(STUDY_MATERIAL_SELECT)
    .eq("project_team_id", projectTeamId)
    .eq("material_type", "file")
    .eq("visibility", "project")
    .not("storage_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw new Error(sanitizeUserError(error, "스터디 자료를 불러오지 못했습니다."));

  const materials = ((data ?? []) as unknown as StudyMaterialDbRow[])
    .map(mapStudyMaterial)
    .filter((material) => Boolean(material.storagePath));

  return Promise.all(materials.map(withDownloadUrl));
}

export async function uploadProjectStudyMaterial(
  input: UploadProjectStudyMaterialInput,
): Promise<StudyMaterial> {
  assertStudyMaterialFile(input.file);

  const supabase = getSupabaseBrowserClient();
  const fileName = safeStorageFileName(input.file.name);
  const storagePath = `${input.projectTeamId}/${randomId()}/${fileName}`;
  const mimeType = input.file.type || "application/octet-stream";
  const title = input.title?.trim() || titleFromFileName(fileName) || fileName;

  const { error: uploadError } = await supabase.storage
    .from(STUDY_MATERIAL_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(sanitizeUserError(uploadError, "스터디 자료를 업로드하지 못했습니다."));
  }

  const { data, error } = await supabase.rpc("create_project_study_material", {
    p_project_team_id: input.projectTeamId,
    p_title: title,
    p_description: input.description?.trim() || null,
    p_file_name: fileName,
    p_mime_type: mimeType,
    p_file_size: input.file.size,
    p_storage_path: storagePath,
  });

  if (error) {
    await supabase.storage.from(STUDY_MATERIAL_BUCKET).remove([storagePath]).catch(() => undefined);
    throw new Error(sanitizeUserError(error, "스터디 자료 정보를 저장하지 못했습니다."));
  }

  const row = (Array.isArray(data) ? data[0] : data) as StudyMaterialDbRow | null;
  if (!row?.id) {
    await supabase.storage.from(STUDY_MATERIAL_BUCKET).remove([storagePath]).catch(() => undefined);
    throw new Error("스터디 자료 저장 결과를 확인하지 못했습니다.");
  }

  return withDownloadUrl(mapStudyMaterial(row));
}

export async function deleteProjectStudyMaterial(
  input: DeleteProjectStudyMaterialInput,
): Promise<StudyMaterial> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("delete_project_study_material", {
    p_material_id: input.materialId,
  });

  if (error) {
    throw new Error(sanitizeUserError(error, "스터디 자료를 삭제하지 못했습니다."));
  }

  const row = (Array.isArray(data) ? data[0] : data) as StudyMaterialDbRow | null;
  if (!row?.id) {
    throw new Error("삭제한 스터디 자료 정보를 확인하지 못했습니다.");
  }

  const deleted = mapStudyMaterial(row);
  const storagePath = input.storagePath || deleted.storagePath;

  if (storagePath) {
    await supabase.storage
      .from(STUDY_MATERIAL_BUCKET)
      .remove([storagePath])
      .catch(() => undefined);
  }

  return deleted;
}

function extensionForImage(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;

  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export async function uploadStudyImages(files: File[], projectTeamId: string): Promise<string[]> {
  const selected = files.slice(0, MAX_STUDY_IMAGE_COUNT);
  if (selected.length === 0) return [];

  for (const file of selected) {
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 첨부할 수 있습니다.");
    }
    if (file.size > MAX_STUDY_IMAGE_SIZE) {
      throw new Error("이미지는 파일당 20MB 이하로 첨부해 주세요.");
    }
  }

  const supabase = getSupabaseBrowserClient();
  const uploaded: string[] = [];

  for (const [index, file] of selected.entries()) {
    const id = randomId();
    const path = `${projectTeamId}/${Date.now()}-${index}-${id}.${extensionForImage(file)}`;
    const { error } = await supabase.storage.from(STUDY_IMAGE_BUCKET).upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw new Error(sanitizeUserError(error, "이미지를 업로드하지 못했습니다."));
    }

    const { data } = supabase.storage.from(STUDY_IMAGE_BUCKET).getPublicUrl(path);
    uploaded.push(data.publicUrl);
  }

  return uploaded;
}

export async function submitStudyRecord(input: SubmitStudyRecordInput): Promise<StudyRecord> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("submit_study_record", {
    p_project_team_id: input.projectTeamId ?? null,
    p_study_session_id: input.studySessionId ?? null,
    p_title: input.title,
    p_body: input.body ?? null,
    p_duration_minutes: input.durationMinutes ?? null,
    p_image_urls: input.imageUrls ?? [],
    p_content_json: input.contentJson ?? null,
    p_occurred_at: input.occurredAt ?? null,
    p_visibility: input.visibility ?? "project",
  });

  if (error) {
    const rawMessage = String(error.message ?? "");
    if (rawMessage.includes("p_content_json") || rawMessage.includes("schema cache")) {
      throw new Error(
        "스터디 글 저장 DB 마이그레이션이 아직 적용되지 않았습니다. 20260506210000_study_blocknote_content.sql을 적용해 주세요.",
      );
    }

    throw new Error(sanitizeUserError(error, "스터디 기록을 저장하지 못했습니다."));
  }

  const row = (Array.isArray(data) ? data[0] : data) as StudyRecordDbRow | null;
  if (!row?.id) {
    throw new Error("스터디 기록 저장 결과를 확인하지 못했습니다.");
  }

  const [record] = await hydrateStudyRecords([row]);
  return record;
}

export async function updateStudyRecord(input: UpdateStudyRecordInput): Promise<StudyRecord> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("update_study_record", {
    p_record_id: input.recordId,
    p_title: input.title,
    p_body: input.body ?? null,
    p_duration_minutes: input.durationMinutes ?? null,
    p_image_urls: input.imageUrls ?? [],
    p_content_json: input.contentJson ?? null,
    p_visibility: input.visibility ?? "member",
  });

  if (error) throw new Error(sanitizeUserError(error, "게시글을 수정하지 못했습니다."));

  const row = (Array.isArray(data) ? data[0] : data) as StudyRecordDbRow | null;
  if (!row?.id) {
    throw new Error("게시글 수정 결과를 확인하지 못했습니다.");
  }

  const [record] = await hydrateStudyRecords([row]);
  return record;
}
