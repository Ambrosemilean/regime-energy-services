import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Our History — Regime Energy Services",
  description:
    "Discover the story, growth, and milestones of Regime Energy Services.",
};

type Milestone = {
  id: string;
  year: string;
  title: string;
  description: string | null;
  display_order: number;
};

export default async function CompanyHistoryPage() {
  const supabase = await createClient();

  const [{ data: company }, { data: milestones }] = await Promise.all([
    supabase
      .from("company_profile")
      .select("company_name, tagline, logo_url")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),

    supabase
      .from("company_history")
      .select("id, year, title, description, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("year", { ascending: true }),
  ]);

  const companyName =
    company?.company_name || "Regime Energy Services";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label={`${companyName} homepage`}
            className="flex min-w-0 items-center gap-3"
          >
            {company?.logo_url ? (
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src={company.logo_url}
                  alt={`${companyName} logo`}
                  fill
                  priority
                  sizes="48px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-extrabold text-blue-800">
                RG
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-blue-950 sm:text-lg">
                {companyName}
              </p>

              {company?.tagline && (
                <p className="line-clamp-1 text-xs text-gray-500">
                  {company.tagline}
                </p>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-600 hover:text-blue-700"
            >
              <span aria-hidden="true">← </span>
              Home
            </Link>

            <Link
              href="/#contact"
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-blue-950 px-4 py-16 text-white sm:px-6 sm:py-24">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />

        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-yellow-300">
            Our Story
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            The Journey of {companyName}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
            Every milestone tells a story of growth, dedication, and service.
            Discover the key moments that have shaped our journey in the LPG
            and energy services industry.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              Our beginnings
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              Our progress
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              Our future
            </span>
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-600">
              Our Journey
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-gray-950 sm:text-4xl">
              Milestones That Define Us
            </h2>

            <p className="mt-4 max-w-2xl leading-7 text-gray-600">
              Explore the important events and achievements that have
              contributed to the development of Regime Energy Services.
            </p>
          </div>

          {!milestones || milestones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-xl font-bold text-gray-900">
                Our Story Is Coming Together
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-600">
                Our company milestones will appear here as they are added and
                published by our team.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex rounded-lg bg-blue-700 px-7 py-3 font-bold text-white transition hover:bg-blue-800"
              >
                Return Home
              </Link>
            </div>
          ) : (
            <ol className="relative space-y-8 border-l-2 border-blue-100 pl-6 sm:space-y-10 sm:pl-9">
              {milestones.map((milestone, index) => (
                <li key={milestone.id} className="relative">
                  {/* Timeline marker */}
                  <span className="absolute -left-[33px] top-6 h-4 w-4 rounded-full border-4 border-white bg-blue-700 ring-2 ring-blue-100 sm:-left-[46px] sm:h-5 sm:w-5">
                    <span className="sr-only">
                      Milestone {index + 1}
                    </span>
                  </span>

                  {/* Milestone card */}
                  <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md sm:p-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-800">
                        {milestone.year}
                      </span>

                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Milestone{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-bold leading-snug text-gray-950 sm:text-2xl">
                      {milestone.title}
                    </h3>

                    {milestone.description && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600 sm:text-base">
                        {milestone.description}
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* Contact Call to Action */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-blue-950 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-yellow-300">
            Looking Ahead
          </p>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Be Part of Our Next Chapter
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-8 text-blue-100">
            Contact {companyName} for dependable LPG supply, distribution,
            and energy services.
          </p>

          <Link
            href="/#contact"
            className="mt-8 inline-flex items-center rounded-lg bg-white px-6 py-3 font-bold text-blue-900 transition hover:bg-blue-50"
          >
            Contact Our Team
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-4 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </footer>
    </main>
  );
}