import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { BookOpen, CalendarDays, Clock, Loader2, Plus, RefreshCw, UserRound } from "lucide-react";
import type { ProjectDetail as ProjectDetailData } from "../../api/projects";
import {
  listProjectStudyRecords,
  submitStudyRecord,
  type StudyRecord,
  type StudyRecordVisibility,
} from "../../api/studies";
import { sanitizeUserError } from "../../utils/sanitize-error";

const CARD_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

const INPUT_STYLE: CSSProperties = {
  width: "100%",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  background: "#fff",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "시간 없음";

  return date.toLocaleString("ko-KR", {
    month: "short",
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

function StudyRecordRow({ record }: { record: StudyRecord }) {
  return (
    <article className="border-t border-[#f1ede4] px-5 py-4 first:border-t-0">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 truncate text-[15px] font-semibold text-[var(--kb-ink-900)]">
            {record.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--kb-ink-500)]">
            <span className="inline-flex items-center gap-1">
              <UserRound className="h-3.5 w-3.5" />
              {record.author?.displayName ?? "작성자 없음"}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(record.occurredAt)}
            </span>
            {record.durationMinutes !== null ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {record.durationMinutes}분
              </span>
            ) : null}
          </div>
        </div>
        <span className="rounded-full border border-[#e8e8e4] bg-[#fafaf6] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-700)]">
          {visibilityLabel(record.visibility)}
        </span>
      </div>

      {record.body ? (
        <p className="m-0 whitespace-pre-wrap text-[14px] leading-6 text-[var(--kb-ink-600)]">
          {record.body}
        </p>
      ) : (
        <p className="m-0 text-[13.5px] text-[var(--kb-ink-400)]">기록 내용 없음</p>
      )}
    </article>
  );
}

export default function ProjectStudyPanel({ project }: { project: ProjectDetailData }) {
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [duration, setDuration] = useState("");
  const [visibility, setVisibility] = useState<StudyRecordVisibility>("project");

  const canWrite = project.isMember && (project.status === "pending" || project.status === "active");
  const totalMinutes = useMemo(
    () =>
      records.reduce(
        (sum, record) => sum + (typeof record.durationMinutes === "number" ? record.durationMinutes : 0),
        0,
      ),
    [records],
  );

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      setRecords(await listProjectStudyRecords(project.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트 스터디 기록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [project.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError("스터디 기록 제목을 입력해 주세요.");
      return;
    }

    const parsedDuration = duration.trim() ? Number.parseInt(duration.trim(), 10) : null;
    if (parsedDuration !== null && (!Number.isFinite(parsedDuration) || parsedDuration < 0)) {
      setError("스터디 시간은 0 이상의 숫자로 입력해 주세요.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await submitStudyRecord({
        projectTeamId: project.id,
        title: title.trim(),
        body: body.trim() || null,
        durationMinutes: parsedDuration,
        visibility,
      });
      setRecords((current) => [created, ...current]);
      setTitle("");
      setBody("");
      setDuration("");
      setVisibility("project");
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "스터디 기록을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ ...CARD_STYLE, overflow: "hidden" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1ede4] px-5 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--kb-navy-800)]" />
          <h2 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">
            프로젝트 스터디
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-[var(--kb-ink-500)]">
          <span>기록 {records.length}건</span>
          {totalMinutes > 0 ? <span>누적 {totalMinutes}분</span> : null}
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ebe8e0] bg-white text-[var(--kb-ink-500)] hover:border-[var(--kb-ink-300)]"
            aria-label="스터디 기록 새로고침"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-[13.5px] font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {canWrite ? (
        <form onSubmit={handleSubmit} className="grid gap-3 border-b border-[#f1ede4] bg-[#fbfbf8] px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px_130px]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="오늘 진행한 스터디 제목"
              style={INPUT_STYLE}
            />
            <input
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              placeholder="분"
              inputMode="numeric"
              style={INPUT_STYLE}
            />
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as StudyRecordVisibility)}
              style={INPUT_STYLE}
            >
              <option value="project">프로젝트만</option>
              <option value="self">나만</option>
              <option value="member">부원 전체</option>
            </select>
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="무엇을 공부했고 프로젝트에 어떤 영향을 주는지 적어 주세요."
            rows={4}
            style={{ ...INPUT_STYLE, resize: "vertical", lineHeight: 1.6 }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[#0a0a0a] px-4 py-2.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              기록 추가
            </button>
          </div>
        </form>
      ) : (
        <div className="border-b border-[#f1ede4] bg-[#fbfbf8] px-5 py-3 text-[13.5px] text-[var(--kb-ink-500)]">
          프로젝트 멤버만 이 프로젝트에 스터디 기록을 추가할 수 있습니다.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-5 py-10 text-[14px] text-[var(--kb-ink-500)]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          스터디 기록을 불러오는 중입니다.
        </div>
      ) : records.length === 0 ? (
        <div className="px-5 py-10 text-center text-[14px] text-[var(--kb-ink-500)]">
          아직 이 프로젝트에 연결된 스터디 기록이 없습니다.
        </div>
      ) : (
        <div>
          {records.map((record) => (
            <StudyRecordRow key={record.id} record={record} />
          ))}
        </div>
      )}
    </section>
  );
}
