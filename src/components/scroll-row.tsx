"use client";

import { useRef, useState, useEffect, useCallback } from "react";

/**
 * A horizontally scrollable row with CSS scroll snapping (no carousel
 * library). Touch/swipe works natively; desktop users get arrow buttons
 * that appear only when there is overflow in that direction.
 */
export default function ScrollRow({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;

    setCanScrollLeft(row.scrollLeft > 4);
    setCanScrollRight(
      row.scrollLeft + row.clientWidth < row.scrollWidth - 4
    );
  }, []);

  useEffect(() => {
    updateArrows();

    const row = rowRef.current;
    if (!row) return;

    row.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      row.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  function scrollByCard(direction: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;

    // Scroll by roughly one card (the first child's width + gap).
    const firstChild = row.firstElementChild as HTMLElement | null;
    const cardWidth = firstChild ? firstChild.offsetWidth + 24 : 320;

    row.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={rowRef}
        role="region"
        aria-label={ariaLabel}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label={`Scroll ${ariaLabel} left`}
          className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-md transition hover:bg-gray-50 md:flex"
        >
          ‹
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label={`Scroll ${ariaLabel} right`}
          className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-xl text-gray-700 shadow-md transition hover:bg-gray-50 md:flex"
        >
          ›
        </button>
      )}
    </div>
  );
}
