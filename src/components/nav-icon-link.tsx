"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * One desktop navigation item rendered as an icon.
 *
 * - The text label is hidden by default (width collapses to 0).
 * - On hover (desktop) the label expands smoothly and the icon gets a
 *   subtle lift; on mouse-leave it collapses back to icon-only.
 * - On touch devices, tapping toggles the label open/closed (and closes
 *   any other open item via `onOpenChange`). The link still navigates.
 * - Tooltips (native `title`) and `aria-label` keep the menu accessible,
 *   and the href is unchanged so every link keeps its original target.
 */

type IconDef = {
  /** Small inline SVG (stroke-based, inherits currentColor). */
  path: string;
  /** Icon only, no stroke cap/rounding tweaks needed — kept uniform. */
};

export type NavIconItem = {
  href: string;
  label: string;
  match: string;
  icon: IconDef;
  /** Brand-tone accent for the icon (blue is default). */
  tone?: "blue" | "red" | "gold" | "navy" | "teal";
};

/** Tailwind text colour per tone — blue stays the primary nav colour. */
const TONE_TEXT: Record<NonNullable<NavIconItem["tone"]>, string> = {
  blue: "text-regime-blue",
  navy: "text-regime-blue-dark",
  red: "text-regime-red",
  gold: "text-[#c98d1f]",
  teal: "text-regime-teal",
};

export default function NavIconLink({
  item,
  active,
  isOpen,
  onOpenChange,
}: {
  item: NavIconItem;
  active: boolean;
  isOpen: boolean;
  onOpenChange: (href: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const open = isOpen || hovered;

  const tone = item.tone ?? "blue";

  function handleClick() {
    // On touch devices there is no hover; first tap reveals the label.
    // A second tap on the already-open item follows the link naturally
    // (we never preventDefault, so navigation always works).
    if (!open) {
      onOpenChange(item.href);
    } else {
      onOpenChange(null);
    }
  }

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      title={item.label}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={`group/icon flex h-11 items-center gap-0 overflow-hidden rounded-xl border px-3 transition-all duration-300 ${active
          ? "border-regime-blue/30 bg-regime-blue/10 text-blue-900"
          : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-blue-50/70 hover:text-blue-900"
        }`}
    >
      {/* Icon — always visible, tinted with its assigned brand tone */}
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center transition-all duration-300 group-hover/icon:-translate-y-0.5 ${
          active ? "text-regime-blue-dark" : TONE_TEXT[tone]
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={item.icon.path} />
        </svg>
      </span>

      {/* Label — collapses/expands smoothly; also revealed via CSS on
          hover for devices that support it */}
      <span
        className={`nav-icon-label max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold tracking-wide transition-all duration-300 ease-out group-hover/icon:max-w-[180px] group-hover/icon:opacity-100 group-hover/icon:pl-2 ${open ? "max-w-[180px] pl-2 opacity-100" : "opacity-0"
          }`}
      >
        {item.label}
      </span>

      {/* Active dot */}
      <span
        aria-hidden="true"
        className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-regime-red transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"
          }`}
      />
    </Link>
  );
}
