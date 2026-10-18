"use client";

import { useEffect } from "react";
import { trackEvent } from "./analytics-tracker";

/**
 * Fires a single "branch_page_view" analytics event when the public
 * branches page is loaded. Feeds the "Branch Page Views (30d)" stat
 * on the admin Branch Engagement dashboard.
 *
 * Rendered once per branches page load (keyed by page, not by branch).
 */
export default function TrackedBranchView() {
  useEffect(() => {
    trackEvent("branch_page_view", "Branches Page");
  }, []);

  return null;
}
