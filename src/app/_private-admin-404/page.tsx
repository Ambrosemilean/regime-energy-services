import { notFound } from "next/navigation";

/**
 * Internal rewrite target used by src/proxy.ts to turn direct visits to
 * /admin/* and /api/admin/* into a genuine HTTP 404. This page is never
 * linked anywhere and the route itself is also 404-guarded by the proxy
 * (it rewrites here only from src/proxy.ts).
 */
export default function PrivateAdminNotFoundPage() {
  notFound();
}
