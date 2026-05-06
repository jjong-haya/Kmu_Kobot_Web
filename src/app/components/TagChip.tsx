// 태그 칩 — 모든 페이지가 동일한 모양·아이콘으로 태그를 그린다.
//
// 디자인 원칙:
//   • 칩 본체는 항상 solid (tag.color 배경, 흰 글자). 톤다운 X.
//   • 슬러그별 아이콘은 칩 안에 끼워 넣지 않고 **칩 위에 모자처럼** 얹힌다 (외부 데코).
//     아이콘이 라벨을 가리지 않고 칩 자체가 단정하게 유지됨.
//   • 신규 슬러그용 아이콘은 SLUG_ICONS 한 곳에만 추가하면 모든 화면에 자동 반영.
//   (docs/product/tag-system.md → Touchpoints)

import type { CSSProperties } from "react";
import { Bot, Crown, Tag as DefaultTagIcon } from "lucide-react";

type Texture = "gold" | "silver" | "bronze" | "gunmetal";
type TagDecoration = {
  Icon?: typeof Bot;
  color: string;
  strokeWidth?: number;
  texture?: Texture;
};

// 슬러그별 데코 — 아이콘 + 색 + 선 굵기 + 선택 시 metallic 질감 (옵션).
// 새 슬러그는 여기 한 곳에만 추가하면 자동 반영.
const BRONZE_TEAM_LEAD_DECORATION: TagDecoration = {
  color: "#92400e",
  texture: "bronze",
};

const SLUG_DECORATIONS: Record<string, TagDecoration> = {
  kobot: {
    Icon: Bot,
    color: "#111827",
    strokeWidth: 2.4,
    texture: "gunmetal", // KOBOT은 은보다 차분한 흑철/건메탈 질감
  },
  president: {
    Icon: Crown,
    color: "#8a6d1c",
    strokeWidth: 2.4,
    texture: "gold", // 회장은 골드 질감 칩
  },
  vice_president: {
    Icon: Crown,
    color: "#4b5563",
    strokeWidth: 2.2,
    texture: "silver", // 부회장 계열은 KOBOT보다 밝은 실버 질감
  },
  "vice-president": {
    Icon: Crown,
    color: "#4b5563",
    strokeWidth: 2.2,
    texture: "silver",
  },
  official_team_lead_a: BRONZE_TEAM_LEAD_DECORATION,
  official_team_lead_b: BRONZE_TEAM_LEAD_DECORATION,
  official_team_lead_c: BRONZE_TEAM_LEAD_DECORATION,
  official_team_lead_d: BRONZE_TEAM_LEAD_DECORATION,
};

// metallic 그라디언트 정의. 선택 상태(selected=true)일 때 사용.
const TEXTURE_GRADIENTS: Record<Texture, { background: string; border: string; color: string; textShadow: string }> = {
  gold: {
    background:
      "linear-gradient(135deg,#fde68a 0%,#fbbf24 35%,#b45309 70%,#fde68a 100%)",
    border: "#8a6d1c",
    color: "#3f2d05",
    textShadow: "0 1px 0 rgba(255,255,255,0.4)",
  },
  silver: {
    background:
      "linear-gradient(135deg,#f3f4f6 0%,#d1d5db 35%,#6b7280 70%,#f3f4f6 100%)",
    border: "#4b5563",
    color: "#1f2937",
    textShadow: "0 1px 0 rgba(255,255,255,0.58)",
  },
  bronze: {
    background:
      "linear-gradient(135deg,#f7c98b 0%,#c47a2c 34%,#7c2d12 67%,#f0b66b 100%)",
    border: "#7c2d12",
    color: "#fff7ed",
    textShadow: "0 1px 0 rgba(0,0,0,0.32)",
  },
  gunmetal: {
    background:
      "linear-gradient(135deg,#111827 0%,#374151 32%,#0f172a 58%,#4b5563 82%,#111827 100%)",
    border: "#020617",
    color: "#f8fafc",
    textShadow: "0 1px 0 rgba(0,0,0,0.45)",
  },
};

export type TagChipData = {
  slug: string;
  label: string;
  color: string;
  /** 동아리 메타 여부. 칩 데코는 slug 매핑이 있을 때만 붙는다. */
  isClub?: boolean;
};

export type TagChipSize = "sm" | "md" | "lg";

const SIZE: Record<
  TagChipSize,
  {
    fontSize: number;
    paddingY: number;
    paddingX: number;
    gap: number;
    iconSize: number; // 외부 모자 아이콘 픽셀
    iconLift: number; // 아이콘이 칩 위로 솟는 양 (px)
    closeSize: number;
  }
> = {
  // iconLift 는 더 이상 사용하지 않음 (paddingTop 은 iconSize * 0.75 로 자동 계산).
  sm: { fontSize: 11, paddingY: 3, paddingX: 9, gap: 4, iconSize: 16, iconLift: 0, closeSize: 11 },
  md: { fontSize: 12.5, paddingY: 4, paddingX: 11, gap: 5, iconSize: 18, iconLift: 0, closeSize: 13 },
  lg: { fontSize: 14, paddingY: 5, paddingX: 13, gap: 6, iconSize: 20, iconLift: 0, closeSize: 14 },
};

export function TagChip({
  tag,
  size = "sm",
  selected = false,
  onClick,
  onRemove,
}: {
  tag: TagChipData;
  size?: TagChipSize;
  /** 선택 상태 (picker UI 강조). 비활성/선택 모두 solid 디자인은 유지하되 테두리만 굵어진다. */
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  const s = SIZE[size];
  // 슬러그 매핑이 있는 태그만 외부 아이콘을 얹는다.
  // 동아리 여부는 멤버 카드의 "건물 아이콘 + 동아리명" 메타에만 쓰고 칩에는 자동 아이콘을 붙이지 않는다.
  const decoration =
    (SLUG_DECORATIONS[tag.slug.toLowerCase()] as TagDecoration | undefined) ?? null;
  const Icon = decoration?.Icon;
  const iconStrokeWidth = decoration?.strokeWidth ?? 2;
  const decorationColor = decoration?.color ?? tag.color;

  // 디자인:
  //   • 일반 칩: 윤곽 = tag.color, 배경 = 그 색의 파스텔 틴트, 텍스트 = tag.color (윤곽과 동일)
  //   • 선택 상태(selected=true): 솔리드 (배경=tag.color, 흰 글자)
  //   • metallic texture (예: 회장 gold): 선택 여부와 무관하게 그라디언트 배경
  const metallic = decoration?.texture ? TEXTURE_GRADIENTS[decoration.texture] : null;

  const chipStyle: CSSProperties = metallic
    ? {
        background: metallic.background,
        color: metallic.color,
        border: `1.5px solid ${metallic.border}`,
        textShadow: metallic.textShadow,
      }
    : selected
      ? {
          background: tag.color,
          color: "#fff",
          border: `1.5px solid ${tag.color}`,
        }
      : {
          background: hexToTint(tag.color, 0.18),
          color: tag.color,
          border: `1.5px solid ${tag.color}`,
        };

  const finalChipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: `${s.paddingY}px ${s.paddingX}px`,
    borderRadius: 999,
    // 모든 칩이 라벨 길이와 무관하게 동일한 최소 가로폭을 갖도록 고정.
    minWidth: 70,
    fontSize: s.fontSize,
    fontWeight: 700,
    cursor: onClick ? "pointer" : "default",
    fontFamily: "inherit",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    ...chipStyle,
  };

  // 아이콘 색은 데코 정의 색을 그대로 사용 — 파스텔 칩 위에서도 또렷이 보임.
  const iconColor = decorationColor;

  // 아이콘 위치 — 칩 위에 *얹혀있는* 느낌.
  //   - 세로: 아이콘 하단이 칩 상단 윤곽에 정확히 맞닿는다 (overlap 0). 아이콘 전체가 칩 위로 올라옴.
  //     wrapper.paddingTop = iconSize 로 두면 chip top = iconSize 위치가 되고, icon top:0 / height:iconSize 이므로
  //     icon bottom = iconSize = chip top → 정확히 윤곽에 적층.
  //   - 가로: 칩 폭에 상관없이 항상 정중앙 (left:50% + translateX(-50%)).
  // 아이콘이 없는 태그도 같은 top slot 을 예약해야 섞여 있을 때 칩 본체 높이가 맞는다.
  const wrapperStyle: CSSProperties = {
    position: "relative",
    display: "inline-block",
    lineHeight: 0,
    paddingTop: s.iconSize,
    verticalAlign: "top",
  };

  return (
    <span style={wrapperStyle}>
      <span
        role={onClick ? "button" : undefined}
        onClick={onClick}
        title={tag.slug}
        style={finalChipStyle}
      >
        <span>{tag.label}</span>
        {onRemove ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove();
            }}
            aria-label={`${tag.label} 회수`}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "inherit",
              opacity: 0.85,
              display: "inline-flex",
              alignItems: "center",
              marginLeft: 1,
            }}
          >
            <CloseGlyph size={s.closeSize - 1} />
          </button>
        ) : null}
      </span>
      {Icon ? (
        <Icon
          aria-hidden
          strokeWidth={iconStrokeWidth}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: s.iconSize,
            height: s.iconSize,
            color: iconColor,
            filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.18))",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ) : null}
    </span>
  );
}

/**
 * 칩이 어울리지 않는 자리(드롭다운 옵션 등) 에서 슬러그 아이콘만 가져다 쓰고 싶을 때.
 * 슬러그에 매핑이 없으면 일반 태그 아이콘 fallback.
 */
export function TagSlugIcon({ slug, size = 12 }: { slug: string; size?: number }) {
  const decoration = SLUG_DECORATIONS[slug.toLowerCase()];
  const Icon = decoration?.Icon ?? DefaultTagIcon;
  const color = decoration?.color;
  return <Icon style={{ width: size, height: size, color }} />;
}

function CloseGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
      <path
        d="M3 3 L9 9 M9 3 L3 9"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── color helpers ────────────────────────────────────────────────────────────
function clampHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
function parseHex(input: string) {
  const m = input.replace(/^#/, "").match(/^([0-9a-f]{6})$/i);
  if (!m) return { r: 100, g: 100, b: 100 };
  const num = parseInt(m[1], 16);
  return { r: (num >> 16) & 0xff, g: (num >> 8) & 0xff, b: num & 0xff };
}
function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clampHex(value).toString(16).padStart(2, "0"))
    .join("")}`;
}
/** ratio 1.0 = 원래 색, 0.0 = 흰색 — 파스텔 배경용 (낮은 값으로 호출) */
function hexToTint(hex: string, ratio: number) {
  const { r, g, b } = parseHex(hex);
  const k = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    r + (255 - r) * (1 - k),
    g + (255 - g) * (1 - k),
    b + (255 - b) * (1 - k),
  );
}
