import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Check, Loader2, RefreshCcw, ShieldAlert } from "lucide-react";
import {
  COURSE_MEMBER_DEFAULT_PATHS,
  listNavVisibility,
  setNavVisibility,
} from "../../api/nav-config";
import { dispatchNavVisibilityChanged } from "../../hooks/useCourseMemberNavPaths";
import { sanitizeUserError } from "../../utils/sanitize-error";

type ConfigurableItem = {
  href: string;
  label: string;
  hint?: string;
};

const COURSE_MEMBER_ITEMS: ConfigurableItem[] = [
  { href: "/member", label: "대시보드", hint: "활동 요약" },
  { href: "/member/notifications", label: "알림" },
  { href: "/member/announcements", label: "공지" },
  { href: "/member/contact-requests", label: "연락 요청" },
  { href: "/member/members", label: "멤버" },
  { href: "/member/space-booking", label: "공간 예약" },
  { href: "/member/study-log", label: "스터디 기록" },
  { href: "/member/study-playlist", label: "스터디 플레이리스트" },
  { href: "/member/projects", label: "프로젝트" },
  { href: "/member/events", label: "행사" },
  { href: "/member/resources", label: "자료실" },
  { href: "/member/equipment", label: "장비 대여" },
  { href: "/member/votes", label: "투표" },
];

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#fafaf9",
};

const CARD_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

export default function NavConfig() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingHref, setSavingHref] = useState<string | null>(null);
  const [savedHref, setSavedHref] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultsByHref = useMemo(() => {
    const defaults = new Set<string>(COURSE_MEMBER_DEFAULT_PATHS);
    return Object.fromEntries(
      COURSE_MEMBER_ITEMS.map((item) => [item.href, defaults.has(item.href)]),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const rows = await listNavVisibility("course_member");
        if (cancelled) return;
        const map: Record<string, boolean> = { ...defaultsByHref };
        for (const row of rows) map[row.href] = row.visible;
        setVisibility(map);
      } catch (err) {
        if (!cancelled) {
          setError(sanitizeUserError(err, "사이드바 설정을 불러오지 못했습니다."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [defaultsByHref]);

  async function handleToggle(href: string, next: boolean) {
    setSavingHref(href);
    setSavedHref(null);
    setError(null);
    const previous = visibility[href];
    setVisibility((prev) => ({ ...prev, [href]: next })); // optimistic
    try {
      await setNavVisibility("course_member", href, next);
      dispatchNavVisibilityChanged();
      setSavedHref(href);
      window.setTimeout(() => {
        setSavedHref((current) => (current === href ? null : current));
      }, 1500);
    } catch (err) {
      setVisibility((prev) => ({ ...prev, [href]: previous ?? false })); // rollback
      setError(sanitizeUserError(err, "저장하지 못했습니다."));
    } finally {
      setSavingHref(null);
    }
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              color: "var(--kb-ink-400)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            NAV CONFIG · COURSE MEMBER
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: 0,
              color: "var(--kb-ink-900)",
              letterSpacing: "-0.02em",
            }}
          >
            KOSS 사이드바 설정
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              color: "var(--kb-ink-500)",
              lineHeight: 1.6,
            }}
          >
            KOSS(course_member) 태그를 가진 부원이 사이드바에서 볼 수 있는 메뉴를
            토글합니다. 정규 부원(active)에는 영향이 없으며, 계정 페이지(프로필,
            보안, 회원 정보)는 항상 표시됩니다.
          </p>
        </div>

        {error && (
          <div
            style={{
              ...CARD_STYLE,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 16,
              fontSize: 14,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <section style={CARD_STYLE}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--kb-ink-900)" }}>
                메뉴 표시 여부
              </div>
              <div style={{ fontSize: 12.5, color: "var(--kb-ink-400)" }}>
                {loading ? "불러오는 중…" : `${COURSE_MEMBER_ITEMS.length}개 메뉴`}
              </div>
            </div>
            {loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : null}
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {COURSE_MEMBER_ITEMS.map((item) => {
              const checked = Boolean(visibility[item.href]);
              const saving = savingHref === item.href;
              const justSaved = savedHref === item.href;
              return (
                <li
                  key={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #ececeb",
                    background: "#fff",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--kb-ink-900)" }}>
                      {item.label}
                    </div>
                    <div
                      className="kb-mono"
                      style={{
                        fontSize: 11.5,
                        color: "var(--kb-ink-400)",
                        marginTop: 2,
                      }}
                    >
                      {item.href}
                      {item.hint ? <span style={{ marginLeft: 8 }}>· {item.hint}</span> : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {justSaved ? (
                      <span
                        aria-label="저장됨"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color: "#16a34a",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Check style={{ width: 14, height: 14 }} /> 저장됨
                      </span>
                    ) : null}
                    <label
                      style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        cursor: saving || loading ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={saving || loading}
                        onChange={(event) => handleToggle(item.href, event.target.checked)}
                        style={{
                          appearance: "none",
                          width: 36,
                          height: 20,
                          borderRadius: 999,
                          background: checked ? "#0a0a0a" : "#d4d4d4",
                          transition: "background 0.18s",
                          outline: "none",
                          margin: 0,
                          cursor: "inherit",
                          position: "relative",
                        }}
                      />
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          top: 2,
                          left: checked ? 18 : 2,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "left 0.18s",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                          pointerEvents: "none",
                        }}
                      />
                      {saving ? (
                        <Loader2
                          style={{
                            width: 14,
                            height: 14,
                            marginLeft: 8,
                            animation: "spin 1s linear infinite",
                            color: "var(--kb-ink-400)",
                          }}
                        />
                      ) : null}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--kb-ink-500)",
              background: "transparent",
              border: "1px solid #e8e8e4",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            <RefreshCcw style={{ width: 13, height: 13 }} /> 다시 불러오기
          </button>
        </div>
      </div>
    </div>
  );
}
