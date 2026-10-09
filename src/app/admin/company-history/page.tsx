import { createClient } from "@/lib/supabase/server";
import CompanyHistoryManager from "./company-history-manager";

export default async function CompanyHistoryPage() {
  const supabase = await createClient();

  const { data: milestones, error } = await supabase
    .from("company_history")
    .select("*")
    .order("display_order", { ascending: true })
    .order("year", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">
          REGIME ENERGY SERVICES
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Company History
        </h1>

        <p className="mt-2 text-gray-600">
          Add the milestones and key events that tell the story of
          Regime Energy Services. Active milestones appear on the
          public website at{" "}
          <a
            href="/company-history"
            className="font-semibold text-blue-600 hover:underline"
          >
            /company-history
          </a>
          .
        </p>
      </div>

      {error && (
        <div className="rounded-xl border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load company history from the database. Make sure
          the <code>company_history</code> table exists (see
          supabase/migrations).
        </div>
      )}

      <CompanyHistoryManager milestones={milestones ?? []} />
    </div>
  );
}
