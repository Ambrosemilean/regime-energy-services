"use client";

import type { ReactNode } from "react";
import { trackEvent } from "./analytics-tracker";

type TrackedLinkProps = {
  href: string;
  event: string;
  label: string;
  className?: string;
  children: ReactNode;
  target?: string;
};

/**
 * Client-side wrapper around an <a> tag so that click tracking
 * can be used from Server Components (which cannot pass event
 * handlers to DOM elements directly).
 */
export default function TrackedLink({
  href,
  event,
  label,
  className,
  children,
  target = "_blank",
}: TrackedLinkProps) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      onClick={() => trackEvent(event, label)}
      className={className}
    >
      {children}
    </a>
  );
}
