"use server";

import { createClient } from "@/lib/supabase/server";

type CreateProductResult = {
  success: boolean;
  message: string;
  productId?: string;
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const IMAGE_KEYS = [
  "primary",
  "front",
  "side",
  "back",
  "top",
  "detail",
] as const;

type ImageKey = (typeof IMAGE_KEYS)[number];

function getSafeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
    : "";

  const baseName = fileName
    .substring(0, fileName.lastIndexOf("."))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "image"}${extension}`;
}

export async function createProduct(
  formData: FormData
): Promise<CreateProductResult> {
  const supabase = await createClient();

  // 1. Verify the signed-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "You must be signed in to create a product.",
    };
  }

  // 2. Verify the user's Regime admin role
  const { data: isAdmin, error: roleError } = await supabase.rpc(
    "has_admin_role",
    {
      required_roles: [
        "super_admin",
        "website_manager",
        "content_manager",
      ],
    }
  );

  if (roleError || !isAdmin) {
    return {
      success: false,
      message: "You do not have permission to create products.",
    };
  }

  // 3. Read product information
  const name = String(formData.get("name") || "").trim();

  const categoryId = String(
    formData.get("category_id") || ""
  ).trim();

  const shortDescription = String(
    formData.get("short_description") || ""
  ).trim();

  const description = String(
    formData.get("description") || ""
  ).trim();

  const sizeCapacity = String(
    formData.get("size_capacity") || ""
  ).trim();

  const features = String(
    formData.get("features") || ""
  ).trim();

  const specifications = String(
    formData.get("specifications") || ""
  ).trim();

  const suitableUse = String(
    formData.get("suitable_use") || ""
  ).trim();

  const availability = String(
    formData.get("availability") || "available"
  );

  const isFeatured =
    formData.get("is_featured") === "true";

  // 4. Basic validation
  if (!name) {
    return {
      success: false,
      message: "Product name is required.",
    };
  }

  if (!categoryId) {
    return {
      success: false,
      message: "Product category is required.",
    };
  }

  if (
    !["available", "unavailable", "on_request"].includes(
      availability
    )
  ) {
    return {
      success: false,
      message: "Invalid product availability.",
    };
  }

  // 5. Read uploaded images
  const uploadedImages: {
    key: ImageKey;
    file: File;
  }[] = [];

  for (const key of IMAGE_KEYS) {
    const value = formData.get(`image_${key}`);

    if (value instanceof File && value.size > 0) {
      uploadedImages.push({
        key,
        file: value,
      });
    }
  }

  // 6. Validate primary image
  const primaryImage = uploadedImages.find(
    (image) => image.key === "primary"
  );

  if (!primaryImage) {
    return {
      success: false,
      message: "Please upload a Primary Image.",
    };
  }

  // 7. Require at least 4 images
  if (uploadedImages.length < 4) {
    return {
      success: false,
      message: "Please upload at least 4 product images.",
    };
  }

  // 8. Validate image files
  for (const image of uploadedImages) {
    if (!ALLOWED_IMAGE_TYPES.includes(image.file.type)) {
      return {
        success: false,
        message: `Invalid image type for ${image.key}. Please use JPG, PNG, or WEBP.`,
      };
    }

    if (image.file.size > MAX_IMAGE_SIZE) {
      return {
        success: false,
        message: `The ${image.key} image is larger than 5MB.`,
      };
    }
  }

  // 9. Create a URL-friendly slug
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return {
      success: false,
      message: "Unable to create a valid product slug.",
    };
  }

  // 10. Create the product record
  const { data: product, error: productError } =
    await supabase
      .from("products")
      .insert({
        category_id: categoryId,
        name,
        slug,
        short_description: shortDescription || null,
        description: description || null,
        size_capacity: sizeCapacity || null,
        features: features || null,
        specifications: specifications || null,
        suitable_use: suitableUse || null,
        availability,
        is_featured: isFeatured,
        is_active: true,
      })
      .select("id")
      .single();

  if (productError || !product) {
    console.error(
      "Product creation error:",
      productError
    );

    return {
      success: false,
      message:
        productError?.code === "23505"
          ? "A product with this name or slug already exists."
          : "Unable to create the product.",
    };
  }

  const uploadedStoragePaths: string[] = [];

  try {
    // 11. Upload images to Supabase Storage
    for (let index = 0; index < uploadedImages.length; index++) {
      const image = uploadedImages[index];

      const safeFileName = getSafeFileName(
        image.file.name
      );

      const storagePath =
        `${product.id}/` +
        `${crypto.randomUUID()}-` +
        `${safeFileName}`;

      const fileBuffer = await image.file.arrayBuffer();

      const { error: uploadError } =
        await supabase.storage
          .from("product-images")
          .upload(
            storagePath,
            fileBuffer,
            {
              contentType: image.file.type,
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Failed to upload ${image.key} image: ${uploadError.message}`
        );
      }

      uploadedStoragePaths.push(storagePath);

      // 12. Get the public image URL
      const { data: publicUrlData } =
        supabase.storage
          .from("product-images")
          .getPublicUrl(storagePath);

      const imageUrl =
        publicUrlData.publicUrl;

      // 13. Save image metadata
      const { error: imageRecordError } =
        await supabase
          .from("product_images")
          .insert({
            product_id: product.id,
            image_url: imageUrl,
            alt_text: `${name} - ${image.key} image`,
            image_type: image.key,
            display_order: index,
            is_primary: image.key === "primary",
          });

      if (imageRecordError) {
        throw new Error(
          `Failed to save ${image.key} image record: ${imageRecordError.message}`
        );
      }
    }

    // 14. Everything succeeded
    return {
      success: true,
      message: "Product and images created successfully.",
      productId: product.id,
    };
  } catch (error) {
    console.error(
      "Product image processing error:",
      error
    );

    // 15. Remove uploaded storage files
    if (uploadedStoragePaths.length > 0) {
      const { error: cleanupError } =
        await supabase.storage
          .from("product-images")
          .remove(uploadedStoragePaths);

      if (cleanupError) {
        console.error(
          "Storage cleanup error:",
          cleanupError
        );
      }
    }

    // 16. Remove the product record
    const { error: deleteProductError } =
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

    if (deleteProductError) {
      console.error(
        "Product cleanup error:",
        deleteProductError
      );
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to upload product images.",
    };
  }
}
// ---------------------------------------------------------------------------
// Update an existing product (content is admin-editable)
// ---------------------------------------------------------------------------

type UpdateProductResult = {
  success: boolean;
  message: string;
};

export async function updateProduct(
  formData: FormData
): Promise<UpdateProductResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc(
    "has_admin_role",
    {
      required_roles: [
        "super_admin",
        "website_manager",
        "content_manager",
      ],
    }
  );

  if (roleError || !isAdmin) {
    return {
      success: false,
      message: "You do not have permission to edit products.",
    };
  }

  const productId = String(formData.get("product_id") || "").trim();

  if (!productId) {
    return { success: false, message: "Product id is missing." };
  }

  const name = String(formData.get("name") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const shortDescription = String(
    formData.get("short_description") || ""
  ).trim();
  const description = String(formData.get("description") || "").trim();
  const sizeCapacity = String(formData.get("size_capacity") || "").trim();
  const features = String(formData.get("features") || "").trim();
  const specifications = String(
    formData.get("specifications") || ""
  ).trim();
  const suitableUse = String(formData.get("suitable_use") || "").trim();
  const availability = String(
    formData.get("availability") || "available"
  );
  const isFeatured = formData.get("is_featured") === "true";
  const isActive = formData.get("is_active") === "true";

  if (!name) {
    return { success: false, message: "Product name is required." };
  }

  if (!categoryId) {
    return { success: false, message: "Product category is required." };
  }

  if (
    !["available", "unavailable", "on_request"].includes(availability)
  ) {
    return { success: false, message: "Invalid product availability." };
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return { success: false, message: "Unable to create a valid slug." };
  }

  // Keep the slug unique — if another product already owns it, keep the
  // existing slug instead of failing the whole save.
  const { data: slugOwner } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .neq("id", productId)
    .maybeSingle();

  const finalSlug = slugOwner ? undefined : slug;

  const { error: updateError } = await supabase
    .from("products")
    .update({
      category_id: categoryId,
      name,
      ...(finalSlug ? { slug: finalSlug } : {}),
      short_description: shortDescription || null,
      description: description || null,
      size_capacity: sizeCapacity || null,
      features: features || null,
      specifications: specifications || null,
      suitable_use: suitableUse || null,
      availability,
      is_featured: isFeatured,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (updateError) {
    console.error("Product update error:", updateError);

    return {
      success: false,
      message:
        updateError.code === "23505"
          ? "A product with this name or slug already exists."
          : "Unable to update the product.",
    };
  }

  // Optional: replace the primary image if a new file was provided.
  const primaryFile = formData.get("image_primary");

  if (primaryFile instanceof File && primaryFile.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.includes(primaryFile.type)) {
      return {
        success: false,
        message:
          "Invalid image type for the primary image. Use JPG, PNG, or WEBP.",
      };
    }

    if (primaryFile.size > MAX_IMAGE_SIZE) {
      return {
        success: false,
        message: "The primary image is larger than 5MB.",
      };
    }

    const { data: existingPrimary } = await supabase
      .from("product_images")
      .select("id, image_url")
      .eq("product_id", productId)
      .eq("is_primary", true)
      .maybeSingle();

    // Delete the old primary image record and its storage object.
    if (existingPrimary) {
      const marker = "/product-images/";
      const urlIndex = existingPrimary.image_url.indexOf(marker);

      if (urlIndex !== -1) {
        await supabase.storage
          .from("product-images")
          .remove([
            existingPrimary.image_url.slice(urlIndex + marker.length),
          ]);
      }

      await supabase
        .from("product_images")
        .delete()
        .eq("id", existingPrimary.id);
    }

    const safeFileName = getSafeFileName(primaryFile.name);
    const storagePath = `${productId}/${crypto.randomUUID()}-${safeFileName}`;
    const fileBuffer = await primaryFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, fileBuffer, {
        contentType: primaryFile.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: `Primary image upload failed: ${uploadError.message}`,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const { error: imageRecordError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: publicUrlData.publicUrl,
        alt_text: `${name} - primary image`,
        image_type: "primary",
        display_order: 0,
        is_primary: true,
      });

    if (imageRecordError) {
      return {
        success: false,
        message: `Primary image save failed: ${imageRecordError.message}`,
      };
    }
  }

  return {
    success: true,
    message: "Product updated successfully.",
  };
}

// ---------------------------------------------------------------------------
// Delete a product (and its images, both records and storage objects)
// ---------------------------------------------------------------------------

export async function deleteProduct(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc(
    "has_admin_role",
    {
      required_roles: ["super_admin", "website_manager"],
    }
  );

  if (roleError || !isAdmin) {
    return {
      success: false,
      message: "You do not have permission to delete products.",
    };
  }

  const productId = String(formData.get("product_id") || "").trim();

  if (!productId) {
    return { success: false, message: "Product id is missing." };
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("image_url")
    .eq("product_id", productId);

  if (images && images.length > 0) {
    const paths = images
      .map((image) => {
        const marker = "/product-images/";
        const index = image.image_url.indexOf(marker);

        return index !== -1
          ? image.image_url.slice(index + marker.length)
          : null;
      })
      .filter((path): path is string => path !== null);

    if (paths.length > 0) {
      await supabase.storage.from("product-images").remove(paths);
    }
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (deleteError) {
    console.error("Product delete error:", deleteError);

    return { success: false, message: "Unable to delete the product." };
  }

  return {
    success: true,
    message: "Product deleted successfully.",
  };
}
