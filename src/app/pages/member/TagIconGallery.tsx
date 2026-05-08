import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { TagChip } from "../../components/TagChip";
import { TAG_ICON_GROUPS, type TagIconCandidate } from "../../config/tag-icons";

const CURRENT_TAGS = [
  { slug: "president", label: "회장", color: "#8a6d1c", isClub: false, iconName: "Crown" },
  { slug: "vice_president", label: "부회장", color: "#4b5563", isClub: false, iconName: "Crown" },
  { slug: "kobot", label: "KOBOT", color: "#111827", isClub: true, iconName: "Bot" },
];

export default function TagIconGallery() {
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const totalCount = useMemo(
    () => TAG_ICON_GROUPS.reduce((sum, group) => sum + group.items.length, 0),
    [],
  );

  async function copyIconName(name: string) {
    setCopiedName(name);

    try {
      await navigator.clipboard?.writeText(name);
    } catch {
      // Clipboard permission is optional; visual feedback still helps during review.
    }

    window.setTimeout(() => {
      setCopiedName((current) => (current === name ? null : current));
    }, 1200);
  }

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle}>
          <div>
            <Link to="/member/tags" style={backLinkStyle}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
              태그 관리
            </Link>
            <h1 style={titleStyle}>태그 아이콘 후보</h1>
            <p style={leadStyle}>
              회장, 부회장, KOBOT처럼 칩 위에 올릴 수 있는 Lucide 아이콘 후보를 분야별로 모았습니다.
            </p>
          </div>
          <div style={summaryStyle}>
            <strong style={{ display: "block", fontSize: 26, lineHeight: 1 }}>{totalCount}</strong>
            <span style={{ color: "var(--kb-ink-500)", fontSize: 13 }}>후보 아이콘</span>
          </div>
        </header>

        <section aria-labelledby="current-icons" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 id="current-icons" style={sectionTitleStyle}>
                현재 적용 중
              </h2>
              <p style={sectionDescriptionStyle}>
                지금 실제 태그 칩에서 보이는 왕관과 로봇 아이콘입니다.
              </p>
            </div>
          </div>
          <div style={currentGridStyle}>
            {CURRENT_TAGS.map((tag) => (
              <div key={tag.slug} style={currentItemStyle}>
                <TagChip tag={tag} size="lg" />
                <span style={currentSlugStyle}>{tag.slug}</span>
              </div>
            ))}
          </div>
        </section>

        {TAG_ICON_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={group.title} style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 id={group.title} style={sectionTitleStyle}>
                  {group.title}
                </h2>
                <p style={sectionDescriptionStyle}>{group.description}</p>
              </div>
              <span style={{ ...countPillStyle, borderColor: group.accent, color: group.accent }}>
                {group.items.length}개
              </span>
            </div>
            <div style={iconGridStyle}>
              {group.items.map((item) => (
                <IconPreviewCard
                  key={`${group.title}-${item.name}-${item.slug}`}
                  item={item}
                  copied={copiedName === item.name}
                  onCopy={() => void copyIconName(item.name)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function IconPreviewCard({
  item,
  copied,
  onCopy,
}: {
  item: TagIconCandidate;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <article style={iconCardStyle}>
      <div style={previewStageStyle}>
        <TagChip
          tag={{ slug: item.slug, label: item.label, color: item.color, iconName: item.name }}
          size="md"
        />
      </div>
      <div style={metaStyle}>
        <strong style={iconNameStyle}>{item.name}</strong>
        <span style={slugStyle}>{item.slug}</span>
      </div>
      <button type="button" onClick={onCopy} style={copyButtonStyle} aria-label={`${item.name} 복사`}>
        {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
        {copied ? "복사됨" : "복사"}
      </button>
    </article>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: "32px 24px 48px",
  background: "#f6f7f9",
};

const contentStyle: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 18,
  marginBottom: 30,
  flexWrap: "wrap",
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  marginBottom: 14,
  color: "var(--kb-ink-600)",
  fontSize: 14,
  fontWeight: 750,
  textDecoration: "none",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--kb-ink-900)",
  fontSize: 32,
  fontWeight: 850,
  lineHeight: 1.18,
};

const leadStyle: CSSProperties = {
  margin: "10px 0 0",
  maxWidth: 660,
  color: "var(--kb-ink-500)",
  fontSize: 15,
  lineHeight: 1.65,
};

const summaryStyle: CSSProperties = {
  minWidth: 132,
  padding: "14px 16px",
  border: "1px solid #d7dce3",
  borderRadius: 8,
  background: "#fff",
  color: "var(--kb-ink-900)",
};

const sectionStyle: CSSProperties = {
  marginTop: 28,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--kb-ink-900)",
  fontSize: 19,
  fontWeight: 820,
};

const sectionDescriptionStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "var(--kb-ink-500)",
  fontSize: 13.5,
  lineHeight: 1.55,
};

const countPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 52,
  height: 30,
  border: "1px solid",
  borderRadius: 999,
  background: "#fff",
  fontSize: 12,
  fontWeight: 800,
};

const currentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const currentItemStyle: CSSProperties = {
  minHeight: 108,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  border: "1px solid #d7dce3",
  borderRadius: 8,
  background: "#fff",
};

const currentSlugStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: 12,
  color: "var(--kb-ink-400)",
};

const iconGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
  gap: 10,
};

const iconCardStyle: CSSProperties = {
  minHeight: 174,
  display: "grid",
  gridTemplateRows: "74px 1fr auto",
  gap: 8,
  padding: 12,
  border: "1px solid #d7dce3",
  borderRadius: 8,
  background: "#fff",
};

const previewStageStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible",
};

const metaStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  gap: 3,
};

const iconNameStyle: CSSProperties = {
  color: "var(--kb-ink-900)",
  fontSize: 13.5,
  lineHeight: 1.3,
};

const slugStyle: CSSProperties = {
  color: "var(--kb-ink-400)",
  fontSize: 11.5,
  lineHeight: 1.25,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const copyButtonStyle: CSSProperties = {
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "1px solid #d7dce3",
  borderRadius: 8,
  background: "#f8fafc",
  color: "var(--kb-ink-700)",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 760,
  cursor: "pointer",
};
