"use client";

import { useEffect } from "react";
import { trackEvent } from "./analytics-tracker";

type TrackedViewProps = {
  event: string;
  label: string;
};

/**
 * Fires a single analytics event when a page is viewed.
 * Use on public detail pages (product/service) so the admin
 * dashboard's "top products/services" lists stay current.
 */
export default function TrackedView({ event, label }: TrackedViewProps) {
  useEffect(() => {
    trackEvent(event, label);
  }, [event, label]);

  return null;
}
