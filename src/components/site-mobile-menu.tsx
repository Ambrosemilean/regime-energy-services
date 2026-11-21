"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Mobile navigation mirrors the desktop navigation and the homepage
 * section order. Anchor links ("/#about", "/#safety-first", ...) take
 * the visitor to the corresponding homepage section.
 */
/** Mobile nav mirrors the desktop menu, with the same brand-tone accents. */
const NAV_ITEMS = [
  { href: "/", label: "Home", isLink: true, tone: "blue" },
  { href: "/#about", label: "About Regime", isLink: true, tone: "navy" },
  { href: "/#safety-first", label: "Safety First", isLink: true, tone: "red" },
  { href: "/#what-we-do", label: "What We Do", isLink: true, tone: "blue" },
  { href: "/#where-we-operate", label: "Where We Operate", isLink: true, tone: "navy" },
  { href: "/#why-choose-us", label: "Why Choose Us", isLink: true, tone: "gold" },
  { href: "/#our-operations", label: "Our Operations", isLink: true, tone: "blue" },
  { href: "/#contact", label: "Contact Regime", isLink: true, tone: "blue" },
] as const;

const TONE_DOT: Record<string, string> = {
  blue: "bg-regime-blue",
  navy: "bg-regime-blue-dark",
  red: "bg-regime-red",
  gold: "bg-regime-yellow",
};

export default function SiteMobileMenu() {
  const [open, setOpen] = useState(false);

  // Close the menu if the viewport grows to desktop size.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Lock page scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger toggle — only visible below the md breakpoint */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 md:hidden"
      >
        {open ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {/* Slide-down drawer — anchored just below the sticky header */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full z-50 border-b border-gray-200 bg-white shadow-lg md:hidden"
        >
          <ul className="space-y-1 px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                {item.isLink ? (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-base font-medium text-gray-800 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[item.tone]}`}
                    />
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-gray-800 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-100 px-4 py-4">
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-regime-blue px-5 text-base font-bold text-white transition hover:bg-regime-blue-dark"
            >
              Contact Regime
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
