// src/features/profiles/HobbyBadge.tsx
import React from "react";

type Props = {
  label: string;
  interactive?: boolean; // if true, shows hover + pointer + onClick
  selected?: boolean; // for toggle/filter UIs
  onClick?: () => void;
  className?: string;
};

export default function HobbyBadge({
  label,
  interactive = false,
  selected = false,
  onClick,
  className = "",
}: Props) {
  const base =
    "inline-flex items-center rounded-full border-2 border-black px-3 py-1 font-pixel text-xs shadow";
  const palette = selected ? "bg-game-yellow" : "bg-white";
  const inter = interactive
    ? "cursor-pointer hover:translate-y-0.5 transition-transform"
    : "";

  return (
    <span
      className={`${base} ${palette} ${inter} ${className}`}
      onClick={interactive ? onClick : undefined}
      role={interactive ? "button" : "text"}
      aria-pressed={interactive ? selected : undefined}
    >
      {label}
    </span>
  );
}
