"use client";

interface CharacterAvatarProps {
  url?: string;
  emoji: string;
  color: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-2xl",
  lg: "h-24 w-24 text-4xl",
} as const;

export default function CharacterAvatar({
  url,
  emoji,
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
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-[var(--paper)] ${className}`}
      style={{ backgroundColor: color }}
      aria-label={`${name} 기본 아바타`}
    >
      <span className="leading-none select-none" role="img" aria-hidden>
        {emoji}
      </span>
    </div>
  );
}
