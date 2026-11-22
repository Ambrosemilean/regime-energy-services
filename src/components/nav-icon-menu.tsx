"use client";

import { useEffect, useState } from "react";
import NavIconLink, { type NavIconItem } from "@/components/nav-icon-link";

/**
 * Desktop icon-based navigation row.
 *
 * Each item is an icon-only chip; the label expands on hover (desktop) or
 * on tap (touch). Exactly one item's label can be tap-open at a time.
 */

const ICON_NAV_ITEMS: NavIconItem[] = [
  {
    href: "/",
    label: "Home",
    match: "/",
    tone: "blue",
    icon: { path: "M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M10 20v-5.5h4V20" },
  },
  {
    href: "/#about",
    label: "About Regime",
    match: "/company-history",
    tone: "navy",
    icon: {
      path: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    },
  },
  {
    href: "/#safety-first",
    label: "Safety First",
    match: "/chat",
    tone: "red",
    icon: {
      path: "M12 3 5 5.5v5c0 4.6 3 8.4 7 10.5 4-2.1 7-5.9 7-10.5v-5L12 3Zm-2.5 8.5 2 2 4-4",
    },
  },
  {
    href: "/#what-we-do",
    label: "What We Do",
    match: "/what-we-do",
    tone: "blue",
    icon: {
      path: "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16M11 13v2h2v-2",
    },
  },
  {
    href: "/#where-we-operate",
    label: "Where We Operate",
    match: "/branches",
    tone: "navy",
    icon: {
      path: "M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    },
  },
  {
    href: "/#why-choose-us",
    label: "Why Choose Us",
    match: "/why-choose-us",
    tone: "gold",
    icon: {
      path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    },
  },
  {
    href: "/#our-operations",
    label: "Our Operations",
    match: "/gallery",
    tone: "blue",
    icon: {
      path: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4 1.25a1.5 1.5 0 0 0 .3 1.65l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-1 1.4V22a2 2 0 0 1-4 0v-.05a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.65.3l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.4-1H2a2 2 0 0 1 0-4h.05a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.65l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05a1.5 1.5 0 0 0 1.65.3 1.5 1.5 0 0 0 1-1.4V2a2 2 0 0 1 4 0v.05a1.5 1.5 0 0 0 1 1.4 1.5 1.5 0 0 0 1.65-.3l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05a1.5 1.5 0 0 0-.3 1.65 1.5 1.5 0 0 0 1.4 1H22a2 2 0 0 1 0 4h-.05a1.5 1.5 0 0 0-1.4 1Z",
    },
  },
  // NOTE: no "/#contact" item here — Contact Regime is reachable through
  // the header CTA button (kept singular to avoid a duplicate nav item).
];

/** Section ids watched for scroll-spy active-state updates. */
const WATCHED_SECTIONS = [
  "about",
  "safety-first",
  "what-we-do",
  "featured-services",
  "where-we-operate",
  "why-choose-us",
  "our-operations",
  "contact",
];

export default function NavIconMenu({ currentPath }: { currentPath: string }) {
  const [openHref, setOpenHref] = useState<string | null>(null);

  /** Section currently in view (scroll-spy); null outside watched zones. */
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Scroll-spy: highlight the nav icon whose homepage section is in view.
  // Uses a lightweight scroll listener + rootMargin so the fixed header
  // never counts as covering the section.
  useEffect(() => {
    const onScroll = () => {
      const headerHeight = 96; // approximate fixed header offset
      let current: string | null = null;

      for (const id of WATCHED_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top - headerHeight <= 0 && rect.bottom > headerHeight) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-1.5 lg:flex"
    >
      {ICON_NAV_ITEMS.map((item) => {
        const routeMatch =
          item.match === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.match);

        // While scrolling the homepage, the in-view section decides the
        // highlighted icon; on interior pages the route match decides it.
        const sectionId = item.href.startsWith("/#")
          ? item.href.slice(2)
          : null;
        const active = routeMatch || (sectionId !== null && activeSection === sectionId);

        return (
          <NavIconLink
            key={item.href}
            item={item}
            active={active}
            isOpen={openHref === item.href}
            onOpenChange={setOpenHref}
          />
        );
      })}
    </nav>
  );
}
