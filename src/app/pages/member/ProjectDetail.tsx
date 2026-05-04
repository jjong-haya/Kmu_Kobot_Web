import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  FolderKanban,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { getProjectBySlug, type ProjectDetail as ProjectDetailData } from "../../api/projects";
import { getProjectRoleLabel, getProjectStatusLabel } from "../../api/project-policy.js";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

const CONTAINER_STYLE: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e8e8e4",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05), 0 0 1px rgba(0, 0, 0, 0.08)",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function initialsFor(name: string) {
  const normalized = name.trim();
  if (!normalized) return "KB";
  return normalized.slice(0, 2).toUpperCase();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#f1ede4] px-5 py-3 first:border-t-0">
      <span className="text-[13px] font-semibold text-[var(--kb-ink-500)]">{label}</span>
      <span className="text-right text-[14px] text-[var(--kb-ink-900)]">{value}</span>
    </div>
  );
}

function MemberList({ project }: { project: ProjectDetailData }) {
  return (
    <section style={{ ...CONTAINER_STYLE, overflow: "hidden" }}>
      <div className="flex items-center justify-between border-b border-[#f1ede4] px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--kb-navy-800)]" />
          <h2 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">멤버</h2>
        </div>
        <span className="text-[13px] text-[var(--kb-ink-500)]">{project.members.length}명</span>
      </div>

      {project.members.length === 0 ? (
        <div className="px-5 py-10 text-center text-[14px] text-[var(--kb-ink-500)]">
          등록된 프로젝트 멤버가 없습니다.
        </div>
      ) : (
        <div>
          {project.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 border-t border-[#f1ede4] px-5 py-3 first:border-t-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a0a0a] text-[12px] font-semibold text-white">
                {initialsFor(member.displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[var(--kb-ink-900)]">
                  {member.displayName}
                </div>
                <div className="truncate text-[12.5px] text-[var(--kb-ink-500)]">
                  {member.loginId ? `@${member.loginId}` : "ID 없음"}
                </div>
              </div>
              <span className="rounded-full border border-[#e8e8e4] bg-[#fafaf6] px-2.5 py-1 text-[12px] font-semibold text-[var(--kb-ink-700)]">
                {member.roleLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectGuide({ project }: { project: ProjectDetailData }) {
  return (
    <section style={{ ...CONTAINER_STYLE, overflow: "hidden" }}>
      <div className="flex items-center gap-2 border-b border-[#f1ede4] px-5 py-4">
        <FileText className="h-4 w-4 text-[var(--kb-navy-800)]" />
        <h2 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">
          프로젝트 가이드
        </h2>
      </div>

      <div className="grid gap-5 px-5 py-5">
        <div>
          <div className="mb-2 text-[12px] font-semibold uppercase text-[var(--kb-ink-400)]">
            협업 규칙
          </div>
          <p className="m-0 text-[14.5px] leading-6 text-[var(--kb-ink-700)]">
            {project.guide ?? "프로젝트 가이드가 아직 등록되지 않았습니다."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-[#e8e8e4] bg-[#fafaf6] p-4">
            <div className="mb-2 text-[12px] font-semibold uppercase text-[var(--kb-ink-400)]">
              태스크 ID 규칙
            </div>
            <code className="text-[13px] text-[var(--kb-ink-900)]">
              {project.idRule ?? "등록 안 됨"}
            </code>
          </div>
          <div className="rounded-md border border-[#e8e8e4] bg-[#fafaf6] p-4">
            <div className="mb-2 text-[12px] font-semibold uppercase text-[var(--kb-ink-400)]">
              브랜치 규칙
            </div>
            <code className="text-[13px] text-[var(--kb-ink-900)]">
              {project.branchRule ?? "등록 안 됨"}
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProjectDetail() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!user || !slug) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setProject(await getProjectBySlug(slug, user.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "프로젝트를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [slug, user?.id]);

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <Link
          to="/member/projects"
          className="inline-flex w-fit items-center gap-1.5 text-[13.5px] text-[var(--kb-ink-500)] no-underline hover:text-[var(--kb-ink-900)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          프로젝트로
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-20 text-[15px] text-[var(--kb-ink-500)]">
            <RefreshCw className="h-4 w-4 animate-spin" />
            프로젝트를 불러오는 중입니다.
          </div>
        ) : error ? (
          <section style={{ ...CONTAINER_STYLE, padding: 32 }}>
            <div className="text-[15px] text-red-700">{error}</div>
          </section>
        ) : !project ? (
          <section style={{ ...CONTAINER_STYLE, padding: 56 }} className="text-center">
            <FolderKanban className="mx-auto mb-3 h-8 w-8 text-[var(--kb-ink-300)]" />
            <div className="text-[15px] text-[var(--kb-ink-500)]">
              프로젝트를 찾을 수 없습니다.
            </div>
          </section>
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-md bg-[#0a0a0a] text-[14px] font-bold text-white"
                  style={{ fontFamily: "var(--kb-font-mono)", letterSpacing: "0.04em" }}
                >
                  {project.prefix}
                </div>
                <div>
                  <div
                    className="kb-mono mb-1 text-[12.5px] uppercase text-[var(--kb-ink-500)]"
                    style={{ letterSpacing: "0.14em" }}
                  >
                    {project.slug}
                  </div>
                  <h1
                    className="kb-display m-0 text-[29px] font-semibold leading-tight text-[#0a0a0a]"
                    style={{ letterSpacing: 0 }}
                  >
                    {project.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[var(--kb-ink-500)]">
                    <span className="font-semibold text-[var(--kb-navy-800)]">
                      {getProjectStatusLabel(project.status)}
                    </span>
                    <span>멤버 {project.memberCount}명</span>
                    <span>{project.visibility === "public" ? "공개" : "비공개"}</span>
                    <span>{project.myRole ? getProjectRoleLabel(project.myRole) : "미참여"}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-2 rounded-md border border-[#ebe8e0] bg-white px-4 py-2.5 text-[14px] font-medium text-[var(--kb-ink-700)] hover:border-[var(--kb-ink-300)]"
              >
                <RefreshCw className="h-4 w-4" />
                새로고침
              </button>
            </header>

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="flex flex-col gap-5">
                <section style={{ ...CONTAINER_STYLE, padding: 24 }}>
                  <div className="mb-2 text-[12px] font-semibold uppercase text-[var(--kb-ink-400)]">
                    설명
                  </div>
                  <p className="m-0 text-[15px] leading-7 text-[var(--kb-ink-700)]">
                    {project.description ?? project.summary ?? "프로젝트 설명이 없습니다."}
                  </p>

                  {project.progress !== null && (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-[var(--kb-ink-700)]">진척도</span>
                        <span className="font-semibold text-[var(--kb-ink-900)]">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f1ede4]">
                        <div
                          className="h-full rounded-full bg-[var(--kb-navy-800)]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                <ProjectGuide project={project} />
                <MemberList project={project} />
              </div>

              <aside className="flex flex-col gap-5">
                <section style={{ ...CONTAINER_STYLE, overflow: "hidden" }}>
                  <div className="flex items-center gap-2 border-b border-[#f1ede4] px-5 py-4">
                    <ShieldCheck className="h-4 w-4 text-[var(--kb-navy-800)]" />
                    <h2 className="m-0 text-[16px] font-semibold text-[var(--kb-ink-900)]">
                      프로젝트 정보
                    </h2>
                  </div>
                  <InfoRow label="상태" value={getProjectStatusLabel(project.status)} />
                  <InfoRow label="유형" value={project.projectType} />
                  <InfoRow label="공개 범위" value={project.visibility === "public" ? "공개" : "비공개"} />
                  <InfoRow label="내 역할" value={project.myRoleLabel} />
                  <InfoRow label="리드" value={project.lead?.displayName ?? "등록 안 됨"} />
                  <InfoRow label="생성일" value={formatDate(project.createdAt)} />
                  <InfoRow label="수정일" value={formatDate(project.updatedAt)} />
                </section>

                <section style={{ ...CONTAINER_STYLE, padding: 20 }}>
                  <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                    <CalendarDays className="h-4 w-4 text-[var(--kb-navy-800)]" />
                    태스크/파일
                  </div>
                  <p className="m-0 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
                    태스크, 파일, 활동 로그는 아직 별도 DB 테이블이 없어 실제 데이터가 연결되지 않았습니다.
                  </p>
                </section>

                <section style={{ ...CONTAINER_STYLE, padding: 20 }}>
                  <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-[var(--kb-ink-900)]">
                    <UserRound className="h-4 w-4 text-[var(--kb-navy-800)]" />
                    멤버십
                  </div>
                  <p className="m-0 text-[13.5px] leading-6 text-[var(--kb-ink-500)]">
                    현재 멤버십은 `project_team_memberships` 기준으로 표시됩니다.
                  </p>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
