"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Products", href: "/admin/products" },
  { name: "Services", href: "/admin/services" },
  { name: "Branches", href: "/admin/branches" },
  { name: "Company Profile", href: "/admin/company-profile" },
  { name: "Company History", href: "/admin/company-history" },
  { name: "Site Settings", href: "/admin/site-settings" },
  { name: "Chat Assistant", href: "/admin/chat" },
  { name: "Admin Management", href: "/admin/admins" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/admin/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gray-950 text-white">
      {/* Logo / Header */}
      <div className="border-b border-gray-800 p-6">
        <h1 className="text-xl font-bold">
          Regime Admin
        </h1>

        <p className="mt-1 text-xs text-gray-400">
          Energy Services Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 text-sm transition ${
                active
                  ? "bg-blue-600 font-semibold text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-800 p-4">
        <Link
          href="/"
          className="mb-2 block rounded-lg px-4 py-3 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-white"
        >
          ← Back to Website
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}