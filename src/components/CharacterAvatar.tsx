"use client";

interface CharacterAvatarProps {
  url?: string;
  /** 대표 색상. 사진이 없을 때 단색 배경으로 보인다 */
  color: string;
  name: string;
  size?: "xs" | "sm" | "story" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "h-6 w-6",
  sm: "h-10 w-10",
  story: "h-14 w-14",
  md: "h-16 w-16",
  lg: "h-24 w-24",
} as const;

export default function CharacterAvatar({
  url,
  color,
  name,
  size = "sm",
  className = "",
}: CharacterAvatarProps) {
  const sizeClass = SIZE_MAP[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${name} 초상화`}
        className={`${sizeClass} shrink-0 rounded-full object-cover shadow-sm ring-2 ring-[var(--paper)] ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      className={`${sizeClass} shrink-0 rounded-full shadow-sm ring-2 ring-[var(--paper)] ${className}`}
      style={{ backgroundColor: color }}
      aria-label={`${name} 기본 아바타`}
    />
  );
}
