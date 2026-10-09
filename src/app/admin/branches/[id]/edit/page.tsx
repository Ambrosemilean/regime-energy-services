import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditBranchForm from "./edit-branch-form";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: branch, error } = await supabase
    .from("branches")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !branch) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Branch
        </h1>

        <p className="mt-2 text-gray-600">
          Update information and the image for this Regime branch.
        </p>
      </div>

      <EditBranchForm branch={branch} />
    </div>
  );
}