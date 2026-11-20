import { createClient } from "@/lib/supabase/server";
import NewServiceForm from "./new-service-form";

export default async function NewServicePage() {
  const supabase = await createClient();

  // All category values currently used by services, so the Add Service
  // form's dropdown always offers every existing service category.
  const { data: services } = await supabase
    .from("services")
    .select("service_category")
    .order("service_category", { ascending: true });

  const categories = Array.from(
    new Set(
      (services ?? [])
        .map((service) => (service.service_category ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  // Standard services the company offers, always offered in the dropdown
  // even before they exist in the database (mirrors the contact form's
  // inquiry reasons).
  const STANDARD_SERVICES = [
    "General Inquiry",
    "LPG Supply",
    "Haulage and Transportation",
    "Consultancy",
    "LPG Plant Installation",
    "Gas Delivery",
    "Repairs",
    "Weighbridge",
    "Safety Training",
  ];

  const allCategories = Array.from(
    new Set([...STANDARD_SERVICES, ...categories])
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Add New Service
        </h1>

        <p className="mt-2 text-gray-600">
          Create a new service for Regime Energy Services.
        </p>
      </div>

      <NewServiceForm categories={allCategories} />
    </div>
  );
}
