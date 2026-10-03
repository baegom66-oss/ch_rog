import type { CSSProperties } from "react";
import { pick } from "@/lib/random";

/** 캐릭터 대표 색상 프리셋 (생성 시 이 중 하나를 무작위로) */
export const CHARACTER_COLORS = [
  "#3D6B5A",
  "#C45C26",
  "#2F5D8A",
  "#7A5C8A",
  "#8B5A2B",
  "#4A6B4E",
  "#A63D4A",
  "#D4A017",
  "#2A9D8F",
  "#E07A5F",
  "#5C6BC0",
  "#C2185B",
  "#6D8B3A",
  "#455A64",
  "#B5838D",
  "#0077B6",
];

/** 다른 캐릭터가 쓰지 않는 프리셋을 우선해 무작위로 고른다 */
export function randomCharacterColor(usedColors: string[]): string {
  const used = new Set(usedColors.map((c) => c.toLowerCase()));
  const unused = CHARACTER_COLORS.filter((c) => !used.has(c.toLowerCase()));
  return pick(unused.length > 0 ? unused : CHARACTER_COLORS)!;
}

function relativeLuminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 대표 색상으로 강조색(--accent)과 옅은 배경색(--accent-soft)을 덮어쓰는 style.
 * 밝은 색은 흰 배경 위 글자로 읽히도록 어둡게 섞는다.
 */
export function characterTheme(color: string | undefined): CSSProperties | undefined {
  if (!color) return undefined;
  const luminance = relativeLuminance(color);
  if (luminance === null) return undefined;
  const accent = luminance > 0.3 ? `color-mix(in srgb, ${color} 60%, #292735)` : color;
  return {
    "--accent": accent,
    "--accent-soft": `color-mix(in srgb, ${color} 18%, white)`,
    "--accent-gradient": `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 65%, white) 100%)`,
  } as CSSProperties;
}

/** 캐릭터 프로필 화면용: 강조색에 더해 테두리·옅은 배경까지 대표 색상으로 물들인다 */
export function characterProfileTheme(color: string | undefined): CSSProperties | undefined {
  const base = characterTheme(color);
  if (!base) return undefined;
  const line = `color-mix(in srgb, ${color} 30%, white)`;
  return {
    ...base,
    "--character": color,
    "--line": line,
    "--light-violet": line,
    "--wash": `color-mix(in srgb, ${color} 9%, white)`,
  } as CSSProperties;
}
