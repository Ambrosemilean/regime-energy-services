"use client";

import Link from "next/link";

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
 * Wraps a Link for internal pages so the click can be tracked while
 * still getting Next.js client-side navigation.
 */
export function TrackedPageLink({
  href,
  event,
  label,
  className,
  children,
}: TrackedLinkProps & { href: string }) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent(event, label)}
      className={className}
    >
      {children}
    </Link>
  );
}

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
