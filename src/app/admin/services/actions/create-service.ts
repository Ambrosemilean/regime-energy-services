"use server";

import { createClient } from "@/lib/supabase/server";

type CreateServiceResult = {
  success: boolean;
  message: string;
  serviceId?: string;
};

type ServiceImage = {
  key: string;
  file: File;
  imageType: string;
  displayOrder: number;
  isPrimary: boolean;
};

export async function createService(
  formData: FormData
): Promise<CreateServiceResult> {
  const supabase = await createClient();

  // 1. Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "You must be signed in to create a service.",
    };
  }

  // 2. Check admin permission
  const { data: isAdmin, error: roleError } =
    await supabase.rpc("has_admin_role", {
      required_roles: [
        "super_admin",
        "website_manager",
        "content_manager",
      ],
    });

  if (roleError || !isAdmin) {
    return {
      success: false,
      message:
        "You do not have permission to create services.",
    };
  }

  // 3. Read service information
  const name = String(
    formData.get("name") || ""
  ).trim();

  const shortDescription = String(
    formData.get("short_description") || ""
  ).trim();

  const description = String(
    formData.get("description") || ""
  ).trim();

  const serviceCategory = String(
    formData.get("service_category") || ""
  ).trim();

  const isFeatured =
    formData.get("is_featured") === "true";

  // 4. Validate service name
  if (!name) {
    return {
      success: false,
      message: "Service name is required.",
    };
  }

  // 5. Collect images
  const imageDefinitions = [
    {
      key: "primary",
      imageType: "primary",
      displayOrder: 0,
      isPrimary: true,
    },
    {
      key: "front",
      imageType: "front",
      displayOrder: 1,
      isPrimary: false,
    },
    {
      key: "side",
      imageType: "side",
      displayOrder: 2,
      isPrimary: false,
    },
    {
      key: "back",
      imageType: "back",
      displayOrder: 3,
      isPrimary: false,
    },
    {
      key: "top",
      imageType: "top",
      displayOrder: 4,
      isPrimary: false,
    },
    {
      key: "detail",
      imageType: "detail",
      displayOrder: 5,
      isPrimary: false,
    },
  ];

  const images: ServiceImage[] = [];

  for (const definition of imageDefinitions) {
    const value = formData.get(
      `image_${definition.key}`
    );

    if (value instanceof File && value.size > 0) {
      images.push({
        key: definition.key,
        file: value,
        imageType: definition.imageType,
        displayOrder: definition.displayOrder,
        isPrimary: definition.isPrimary,
      });
    }
  }

  // 6. Primary image is required
  const primaryImage = images.find(
    (image) => image.isPrimary
  );

  if (!primaryImage) {
    return {
      success: false,
      message: "A primary service image is required.",
    };
  }

  // 7. Validate images
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  for (const image of images) {
    if (!allowedTypes.includes(image.file.type)) {
      return {
        success: false,
        message:
          "Only JPG, PNG, and WEBP images are allowed.",
      };
    }

    if (image.file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message:
          "Each image must be 5MB or smaller.",
      };
    }
  }

  // 8. Create slug
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return {
      success: false,
      message:
        "Unable to create a valid service slug.",
    };
  }

  // 9. Create service record
  const { data: service, error: serviceError } =
    await supabase
      .from("services")
      .insert({
        name,
        slug,
        short_description:
          shortDescription || null,
        description:
          description || null,
        service_category:
          serviceCategory || null,
        image_url: null,
        is_featured: isFeatured,
        is_active: true,
      })
      .select("id")
      .single();

  if (serviceError || !service) {
    console.error(
      "Service creation error:",
      serviceError
    );

    return {
      success: false,
      message:
        serviceError?.code === "23505"
          ? "A service with this name or slug already exists."
          : "Unable to create the service.",
    };
  }

  const uploadedPaths: string[] = [];

  try {
    // 10. Upload images
    for (const image of images) {
      const fileExtension =
        image.file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const filePath = `${service.id}/${image.key}-${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("service-images")
          .upload(filePath, image.file, {
            contentType: image.file.type,
            upsert: false,
          });

      if (uploadError) {
        throw new Error(
          `Image upload failed: ${uploadError.message}`
        );
      }

      uploadedPaths.push(filePath);

      // 11. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("service-images")
        .getPublicUrl(filePath);

      // 12. Save image record
      const { error: imageRecordError } =
        await supabase
          .from("service_images")
          .insert({
            service_id: service.id,
            image_url: publicUrl,
            alt_text: `${name} - ${image.imageType}`,
            image_type: image.imageType,
            display_order: image.displayOrder,
            is_primary: image.isPrimary,
          });

      if (imageRecordError) {
        throw new Error(
          `Image record failed: ${imageRecordError.message}`
        );
      }

      // 13. Save primary image URL to services table
      if (image.isPrimary) {
        const { error: updateError } =
          await supabase
            .from("services")
            .update({
              image_url: publicUrl,
            })
            .eq("id", service.id);

        if (updateError) {
          throw new Error(
            `Primary image update failed: ${updateError.message}`
          );
        }
      }
    }

    return {
      success: true,
      message: "Service created successfully.",
      serviceId: service.id,
    };
  } catch (error) {
    console.error(
      "Service image processing error:",
      error
    );

    // 14. Clean up uploaded files
    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from("service-images")
        .remove(uploadedPaths);
    }

    // 15. Clean up service record
    await supabase
      .from("services")
      .delete()
      .eq("id", service.id);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to upload service images.",
    };
  }
}