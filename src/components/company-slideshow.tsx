"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type CompanyMedia = {
  id: string;
  image_url: string;
  title: string | null;
  alt_text: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export default function CompanySlideshow({
  media,
  children,
}: {
  media: CompanyMedia[];
  /** Optional content rendered over the slides (e.g. hero copy + CTAs). */
  children?: React.ReactNode;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeMedia = media
    .filter((item) => item.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  useEffect(() => {
    if (activeMedia.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((current) =>
        current === activeMedia.length - 1
          ? 0
          : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [activeMedia.length]);

  if (activeMedia.length === 0) {
    return null;
  }

  const currentImage = activeMedia[currentIndex];

  function goToPrevious() {
    setCurrentIndex((current) =>
      current === 0
        ? activeMedia.length - 1
        : current - 1
    );
  }

  function goToNext() {
    setCurrentIndex((current) =>
      current === activeMedia.length - 1
        ? 0
        : current + 1
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-gray-900">
      {/* Main Image */}
      <div className="relative h-[min(60vh,max(22rem,26rem))] w-full md:h-[min(650px,75vh)]">
        <Image
          key={currentImage.id}
          src={currentImage.image_url}
          alt={
            currentImage.alt_text ||
            currentImage.title ||
            "Regime Energy Services"
          }
          fill
          sizes="100vw"
          className="object-cover"
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/55 to-slate-900/20" />

        {/* Hero overlay content (homepage headline + actions) */}
        {children && (
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">{children}</div>
          </div>
        )}

        {/* Previous Button */}
        {activeMedia.length > 1 && (
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-gray-900 shadow-lg transition hover:bg-white md:left-8"
          >
            ‹
          </button>
        )}

        {/* Next Button */}
        {activeMedia.length > 1 && (
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next image"
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl text-gray-900 shadow-lg transition hover:bg-white md:right-8"
          >
            ›
          </button>
        )}

        {/* Slide Indicators */}
        {activeMedia.length > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {activeMedia.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}