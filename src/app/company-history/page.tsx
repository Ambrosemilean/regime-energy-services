import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Our History — Regime Energy Services",
  description:
    "The story and milestones of Regime Energy Services.",
};

export default async function CompanyHistoryPage() {
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("company_profile")
    .select("company_name")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const { data: milestones } = await supabase
    .from("company_history")
    .select("id, year, title, description")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("year", { ascending: true });

  const companyName =
    company?.company_name || "Regime Energy Services";

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold text-blue-700"
          >
            {companyName}
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-blue-700"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Intro */}
      <section className="bg-blue-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Our History
          </p>

          <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-5xl">
            The story of {companyName}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
            From our beginning to where we are today — the
            milestones that shaped our company.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          {!milestones || milestones.length === 0 ? (
            <div className="rounded-2xl border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-gray-600">
                Our company history will be published here soon.
              </p>

              <Link
                href="/"
                className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
              >
                Return to homepage →
              </Link>
            </div>
          ) : (
            <ol className="relative space-y-12 border-l-2 border-blue-100 pl-8">
              {milestones.map((milestone) => (
                <li key={milestone.id} className="relative">
                  <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 ring-4 ring-white" />

                  <p className="text-sm font-bold uppercase tracking-widest text-red-600">
                    {milestone.year}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {milestone.title}
                  </h2>

                  {milestone.description && (
                    <p className="mt-3 leading-8 text-gray-600">
                      {milestone.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Be part of the next chapter
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-600">
            Contact {companyName} for dependable LPG supply,
            distribution and energy services.
          </p>

          <Link
            href="/#contact"
            className="mt-8 inline-block rounded-lg bg-blue-700 px-8 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
