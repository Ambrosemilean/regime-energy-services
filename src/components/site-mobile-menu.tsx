"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/products", label: "Products", isLink: true },
  { href: "/services", label: "Services", isLink: true },
  { href: "/branches", label: "Branches", isLink: true },
  { href: "/company-history", label: "Our History", isLink: true },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export default function SiteMobileMenu({
  whatsappHref,
}: {
  whatsappHref?: string | null;
}) {
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
                    className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-gray-800 transition hover:bg-blue-50 hover:text-blue-800"
                  >
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
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-green-600 px-5 text-base font-bold text-white transition hover:bg-green-700"
              >
                Order Gas on WhatsApp
              </a>
            ) : (
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-5 text-base font-bold text-white transition hover:bg-blue-800"
              >
                Contact Us
              </a>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
