import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { Loader2, Plus, Save, Send, X } from "lucide-react";
import {
  createProject,
  updateProjectSettings,
  updateRejectedProjectAndRequestReview,
  type ProjectSummary,
  type ProjectType,
  type ProjectVisibility,
} from "../../api/projects";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PROJECT_TYPE_OPTIONS: Array<{ value: ProjectType; label: string }> = [
  { value: "autonomous", label: "자율 프로젝트" },
  { value: "personal", label: "개인 프로젝트" },
];

const PROJECT_VISIBILITY_OPTIONS: Array<{ value: ProjectVisibility; label: string }> = [
  { value: "private", label: "비공개" },
  { value: "public", label: "공개" },
];

function getProjectTypeLabel(value: ProjectType) {
  return PROJECT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

const FORM_INPUT_STYLE: CSSProperties = {
  width: "100%",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  background: "#fff",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

type ProjectFormMode = "create" | "edit" | "settings";

export function ProjectFormModal({
  mode = "create",
  userId,
  project,
  onClose,
  onSaved,
  onError,
}: {
  mode?: ProjectFormMode;
  userId: string;
  project?: ProjectSummary;
  onClose: () => void;
  onSaved: (project: ProjectSummary) => Promise<void> | void;
  onError: (message: string | null) => void;
}) {
  const isEdit = mode === "edit";
  const isSettings = mode === "settings";
  const isMutation = isEdit || isSettings;
  const [name, setName] = useState(project?.name ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [projectType, setProjectType] = useState<ProjectType>(project?.projectType ?? "autonomous");
  const [visibility, setVisibility] = useState<ProjectVisibility>(project?.visibility ?? "private");
  const [running, setRunning] = useState(project ? project.status === "active" : true);
  const [recruiting, setRecruiting] = useState(project?.recruitmentStatus === "open");
  const [completed, setCompleted] = useState(project?.status === "archived");
  const [recruitmentNote, setRecruitmentNote] = useState(project?.recruitmentNote ?? "");
  const [guide, setGuide] = useState(project?.guide ?? "");
  const [idRule, setIdRule] = useState(project?.idRule ?? "");
  const [branchRule, setBranchRule] = useState(project?.branchRule ?? "");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  function validate() {
    if (!isSettings && !name.trim()) {
      setLocalError("프로젝트 이름을 입력해 주세요.");
      return false;
    }

    if (isMutation && !project?.id) {
      setLocalError("수정할 프로젝트 정보를 찾지 못했습니다.");
      return false;
    }

    if (isSettings && !completed && !running && !recruiting) {
      setLocalError("진행중, 모집중, 종료 중 하나는 선택해 주세요.");
      return false;
    }

    setLocalError(null);
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const metadata: Record<string, unknown> = {
      recruitmentOpen: isSettings && completed ? false : recruiting,
      recruitmentNote: isSettings && completed ? null : recruitmentNote.trim() || null,
      guide: guide.trim() || null,
      idRule: idRule.trim() || null,
      branchRule: branchRule.trim() || null,
    };

    try {
      setSaving(true);
      setLocalError(null);
      onError(null);

      const payload = {
        name: name.trim(),
        summary: summary.trim() || null,
        description: description.trim() || null,
        projectType,
        visibility,
        metadata,
      };
      const savedProject =
        isSettings && project
          ? await updateProjectSettings(
              project.id,
              {
                summary: payload.summary,
                description: payload.description,
                visibility: payload.visibility,
                metadata: payload.metadata,
                isRunning: running,
                isRecruiting: recruiting,
                isCompleted: completed,
              },
              userId,
            )
          : isEdit && project
            ? await updateRejectedProjectAndRequestReview(project.id, payload, userId)
            : await createProject(payload, userId);

      await onSaved(savedProject);
    } catch (err) {
      setLocalError(
        sanitizeUserError(
          err,
          isSettings
            ? "프로젝트 설정을 저장하지 못했습니다."
            : isEdit
              ? "프로젝트 재심사를 요청하지 못했습니다."
              : "프로젝트를 생성하지 못했습니다.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-[6vh]"
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[760px] overflow-hidden rounded-lg bg-white shadow-[0_22px_60px_rgba(0,0,0,0.25)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#f1ede4] px-6 py-5">
          <div>
            <div
              className="kb-mono mb-2 text-[12px] uppercase text-[var(--kb-ink-400)]"
              style={{ letterSpacing: "0.14em" }}
            >
              {isSettings ? "PROJECT SETTINGS" : isEdit ? "REVIEW REQUEST" : "CREATE PROJECT"}
            </div>
            <h2 className="m-0 text-[20px] font-semibold text-[var(--kb-ink-900)]">
              {isSettings ? "프로젝트 설정" : isEdit ? "프로젝트 수정" : "새 프로젝트"}
            </h2>
            <p className="m-0 mt-2 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
              {isSettings
                ? "진행 상태, 모집 여부, 요약, 설명, 공개 범위와 협업 규칙을 수정할 수 있습니다. 이름과 유형은 고정됩니다."
                : isEdit
                  ? "반려 사유를 반영해 내용을 수정하면 다시 검토중 상태로 올라갑니다."
                  : "slug는 서버가 프로젝트 이름을 기준으로 자동 생성합니다. 생성된 프로젝트는 검토중 상태로 등록됩니다."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ebe8e0] bg-white text-[var(--kb-ink-500)] hover:border-[var(--kb-ink-300)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-5 px-6 py-5">
          {localError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] font-semibold text-red-700">
              {localError}
            </div>
          ) : null}

          <Field label="이름">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="로봇팔 제어 프로젝트"
              disabled={isSettings}
              style={{
                ...FORM_INPUT_STYLE,
                background: isSettings ? "#f5f5f2" : "#fff",
                color: isSettings ? "var(--kb-ink-500)" : undefined,
                cursor: isSettings ? "not-allowed" : undefined,
              }}
            />
          </Field>

          <Field label="요약">
            <input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="목록에서 보일 짧은 설명"
              style={FORM_INPUT_STYLE}
            />
          </Field>

          <Field label="설명">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="프로젝트 목표, 범위, 필요한 역할 등을 적어 주세요."
              rows={4}
              style={{ ...FORM_INPUT_STYLE, resize: "vertical", lineHeight: 1.6 }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isSettings ? "유형 (고정)" : "유형"}>
              <select
                value={projectType}
                onChange={(event) => setProjectType(event.target.value as ProjectType)}
                disabled={isSettings}
                style={{
                  ...FORM_INPUT_STYLE,
                  background: isSettings ? "#f5f5f2" : "#fff",
                  color: isSettings ? "var(--kb-ink-500)" : undefined,
                  cursor: isSettings ? "not-allowed" : undefined,
                }}
                title={isSettings ? `${getProjectTypeLabel(projectType)}로 고정되어 있습니다.` : undefined}
              >
                {PROJECT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="공개 범위">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as ProjectVisibility)}
                style={FORM_INPUT_STYLE}
                disabled={recruiting && !completed}
              >
                {PROJECT_VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {isSettings ? (
            <div className="rounded-md border border-[#e8e8e4] bg-[#fafaf6] p-4">
              <div className="mb-3 text-[13px] font-semibold text-[var(--kb-ink-700)]">
                프로젝트 상태
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label
                  className={`flex min-h-[82px] items-start gap-3 rounded-md border bg-white p-3 ${
                    completed ? "opacity-45" : ""
                  }`}
                  style={{ borderColor: running && !completed ? "#111111" : "#e8e8e4" }}
                >
                  <input
                    type="checkbox"
                    checked={running && !completed}
                    disabled={completed}
                    onChange={(event) => {
                      setRunning(event.target.checked);
                      if (event.target.checked) setCompleted(false);
                    }}
                    className="mt-1 h-4 w-4 accent-[#0a0a0a]"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-[var(--kb-ink-900)]">
                      진행중
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-5 text-[var(--kb-ink-500)]">
                      작업공간과 스터디 기록을 계속 운영합니다.
                    </span>
                  </span>
                </label>

                <label
                  className={`flex min-h-[82px] items-start gap-3 rounded-md border bg-white p-3 ${
                    completed ? "opacity-45" : ""
                  }`}
                  style={{ borderColor: recruiting && !completed ? "#111111" : "#e8e8e4" }}
                >
                  <input
                    type="checkbox"
                    checked={recruiting && !completed}
                    disabled={completed}
                    onChange={(event) => {
                      setRecruiting(event.target.checked);
                      if (event.target.checked) {
                        setCompleted(false);
                        setVisibility("public");
                      }
                    }}
                    className="mt-1 h-4 w-4 accent-[#0a0a0a]"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-[var(--kb-ink-900)]">
                      모집중
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-5 text-[var(--kb-ink-500)]">
                      진행중과 함께 켤 수 있고 공개 모집으로 표시됩니다.
                    </span>
                  </span>
                </label>

                <label
                  className="flex min-h-[82px] items-start gap-3 rounded-md border bg-white p-3"
                  style={{ borderColor: completed ? "#111111" : "#e8e8e4" }}
                >
                  <input
                    type="checkbox"
                    checked={completed}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setCompleted(checked);
                      if (checked) {
                        setRunning(false);
                        setRecruiting(false);
                      } else {
                        setRunning(true);
                      }
                    }}
                    className="mt-1 h-4 w-4 accent-[#0a0a0a]"
                  />
                  <span>
                    <span className="block text-[14px] font-semibold text-[var(--kb-ink-900)]">
                      종료
                    </span>
                    <span className="mt-1 block text-[12.5px] leading-5 text-[var(--kb-ink-500)]">
                      저장하면 진행중·모집중이 꺼지고 완료 상태가 됩니다.
                    </span>
                  </span>
                </label>
              </div>

              {recruiting && !completed ? (
                <textarea
                  value={recruitmentNote}
                  onChange={(event) => setRecruitmentNote(event.target.value)}
                  placeholder="모집 역할이나 필요한 역량을 적어 주세요."
                  rows={3}
                  style={{ ...FORM_INPUT_STYLE, marginTop: 12, resize: "vertical", lineHeight: 1.6 }}
                />
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-[#e8e8e4] bg-[#fafaf6] p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={recruiting}
                  onChange={(event) => {
                    setRecruiting(event.target.checked);
                    if (event.target.checked) setVisibility("public");
                  }}
                  className="mt-1 h-4 w-4 accent-[#0a0a0a]"
                />
                <span>
                  <span className="block text-[14px] font-semibold text-[var(--kb-ink-900)]">
                    {isEdit ? "재심사 승인 후 모집중으로 공개" : "승인 후 모집중으로 공개"}
                  </span>
                  <span className="mt-1 block text-[13px] leading-5 text-[var(--kb-ink-500)]">
                    모집중 프로젝트는 참여하지 않은 활성 부원에게도 보이고, 참여 신청 버튼이 열립니다.
                  </span>
                </span>
              </label>
              {recruiting ? (
              <textarea
                value={recruitmentNote}
                onChange={(event) => setRecruitmentNote(event.target.value)}
                placeholder="모집 역할이나 필요한 역량을 적어 주세요."
                rows={3}
                style={{ ...FORM_INPUT_STYLE, marginTop: 12, resize: "vertical", lineHeight: 1.6 }}
              />
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="협업 규칙">
              <input
                value={guide}
                onChange={(event) => setGuide(event.target.value)}
                placeholder="예: PR 리뷰 필수"
                style={FORM_INPUT_STYLE}
              />
            </Field>
            <Field label="태스크 ID">
              <input
                value={idRule}
                onChange={(event) => setIdRule(event.target.value)}
                placeholder="예: ARM-001"
                style={FORM_INPUT_STYLE}
              />
            </Field>
            <Field label="브랜치">
              <input
                value={branchRule}
                onChange={(event) => setBranchRule(event.target.value)}
                placeholder="예: feat/ARM-001"
                style={FORM_INPUT_STYLE}
              />
            </Field>
          </div>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-[#f1ede4] bg-[#fafaf9] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-[#e8e8e4] bg-white px-4 py-2.5 text-[14px] font-semibold text-[var(--kb-ink-700)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSettings ? (
              <Save className="h-4 w-4" />
            ) : isMutation ? (
              <Send className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isSettings ? "저장" : isEdit ? "재심사 요청" : "다음"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-semibold uppercase text-[var(--kb-ink-500)]">
        {label}
      </span>
      {children}
    </label>
  );
}
