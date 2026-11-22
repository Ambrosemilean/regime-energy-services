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
  {
    href: "/",
    label: "Home",
    isLink: true,
    tone: "blue",
    icon: "M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M10 20v-5.5h4V20",
  },
  {
    href: "/#about",
    label: "About Regime",
    isLink: true,
    tone: "navy",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  },
  {
    href: "/#safety-first",
    label: "Safety First",
    isLink: true,
    tone: "red",
    icon: "M12 3 5 5.5v5c0 4.6 3 8.4 7 10.5 4-2.1 7-5.9 7-10.5v-5L12 3Zm-2.5 8.5 2 2 4-4",
  },
  {
    href: "/#what-we-do",
    label: "What We Do",
    isLink: true,
    tone: "blue",
    icon: "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16M11 13v2h2v-2",
  },
  {
    href: "/#where-we-operate",
    label: "Where We Operate",
    isLink: true,
    tone: "navy",
    icon: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  },
  {
    href: "/#why-choose-us",
    label: "Why Choose Us",
    isLink: true,
    tone: "gold",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  {
    href: "/#our-operations",
    label: "Our Operations",
    isLink: true,
    tone: "blue",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4 1.25a1.5 1.5 0 0 0 .3 1.65l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-1 1.4V22a2 2 0 0 1-4 0v-.05a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.65.3l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.4-1H2a2 2 0 0 1 0-4h.05a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.65l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05a1.5 1.5 0 0 0 1.65.3 1.5 1.5 0 0 0 1-1.4V2a2 2 0 0 1 4 0v.05a1.5 1.5 0 0 0 1 1.4 1.5 1.5 0 0 0 1.65-.3l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05a1.5 1.5 0 0 0-.3 1.65 1.5 1.5 0 0 0 1.4 1H22a2 2 0 0 1 0 4h-.05a1.5 1.5 0 0 0-1.4 1Z",
  },
  {
    href: "/#contact",
    label: "Contact Regime",
    isLink: true,
    tone: "blue",
    icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  },
] as const;

const TONE_TEXT: Record<string, string> = {
  blue: "text-regime-blue",
  navy: "text-regime-blue-dark",
  red: "text-regime-red",
  gold: "text-[#c98d1f]",
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
                      className={`flex h-6 w-6 shrink-0 items-center justify-center ${TONE_TEXT[item.tone]}`}
                      aria-hidden="true"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={item.icon} />
                      </svg>
                    </span>
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-base font-medium text-gray-800 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center ${TONE_TEXT[item.tone]}`}
                      aria-hidden="true"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={item.icon} />
                      </svg>
                    </span>
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
