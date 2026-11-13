import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProductForm from "../edit-product-form";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        category_id,
        short_description,
        description,
        size_capacity,
        features,
        specifications,
        suitable_use,
        availability,
        is_featured,
        is_active
      `
      )
      .eq("id", id)
      .single(),
    supabase
      .from("product_categories")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <EditProductForm
          product={product}
          categories={categories ?? []}
        />
      </div>
    </main>
  );
}
