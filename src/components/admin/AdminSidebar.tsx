"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Analytics", href: "/admin/analytics" },
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

  const [companyName, setCompanyName] = useState("REGIME GAS");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyProfile() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("company_profile")
        .select("company_name, logo_url")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!isMounted || error || !data) return;

      setCompanyName(data.company_name || "REGIME GAS");
      setLogoUrl(data.logo_url || null);
    }

    loadCompanyProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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
    <>
      {/* Mobile top bar with menu toggle — hidden on lg and up */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 text-slate-200 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-controls="admin-sidebar"
          aria-label={mobileOpen ? "Close admin menu" : "Open admin menu"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-200 transition hover:bg-slate-800"
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        <span className="truncate text-sm font-semibold text-white">{companyName}</span>
      </div>

      {/* Backdrop for the mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Logo / Header */}
      <div className="border-b border-slate-800 p-5">
        <Link href="/admin" className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white p-1">
              <Image
                src={logoUrl}
                alt={`${companyName} logo`}
                fill
                sizes="44px"
                className="object-contain p-1"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-bold tracking-tight text-white shadow-inner">
              RG
            </div>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-white">
              {companyName}
            </h1>

            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Admin Console
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Manage
        </p>
        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group relative block rounded-md px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-slate-800 font-medium text-white"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`}
            >
              {active && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-blue-500" />
              )}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-800 p-3">
        <Link
          href="/"
          className="mb-1 block rounded-md px-3 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-100"
        >
          ← Back to Website
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2.5 text-left text-sm text-red-400/90 transition hover:bg-red-500/10 hover:text-red-300"
        >
          Logout
        </button>
      </div>
      </aside>
    </>
  );
}