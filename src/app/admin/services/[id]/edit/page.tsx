import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditServiceForm from "../edit-service-form";

type EditServicePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select(
      `
      id,
      name,
      slug,
      short_description,
      description,
      service_category,
      is_featured,
      is_active
    `
    )
    .eq("id", id)
    .single();

  if (!service) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <EditServiceForm service={service} />
    </div>
  );
}
