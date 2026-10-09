import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
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
      return NextResponse.json(
        { error: "You do not have permission to update branches." },
        { status: 403 }
      );
    }

    // Read submitted form
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const address = String(formData.get("address") || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Branch name is required." },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Branch address is required." },
        { status: 400 }
      );
    }

    const phone = String(formData.get("phone") || "").trim();
    const whatsapp = String(formData.get("whatsapp") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const google_maps_url = String(
      formData.get("google_maps_url") || ""
    ).trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    const latitudeValue = String(
      formData.get("latitude") || ""
    ).trim();

    const longitudeValue = String(
      formData.get("longitude") || ""
    ).trim();

    const displayOrderValue = String(
      formData.get("display_order") || "1"
    ).trim();

    const latitude =
      latitudeValue === "" ? null : Number(latitudeValue);

    const longitude =
      longitudeValue === "" ? null : Number(longitudeValue);

    const display_order = Number(displayOrderValue);

    if (
      latitudeValue !== "" &&
      !Number.isFinite(latitude)
    ) {
      return NextResponse.json(
        { error: "Latitude must be a valid number." },
        { status: 400 }
      );
    }

    if (
      longitudeValue !== "" &&
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        { error: "Longitude must be a valid number." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(display_order)) {
      return NextResponse.json(
        { error: "Display order must be a valid number." },
        { status: 400 }
      );
    }

    const is_active =
  formData.get("is_active") === "true" ||
  formData.get("is_active") === "on";

    // Create a clean slug from the branch name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check whether a new image was submitted
    const image = formData.get("image");

    let image_url: string | undefined;

    if (image instanceof File && image.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid image type. Please upload JPG, PNG, or WEBP.",
          },
          { status: 400 }
        );
      }

      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: "Image is too large. Maximum size is 5MB.",
          },
          { status: 400 }
        );
      }

      const extension =
        image.type === "image/jpeg"
          ? "jpg"
          : image.type === "image/png"
          ? "png"
          : "webp";

      const filePath = `${id}/branch-${Date.now()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("branch-images")
          .upload(filePath, image, {
            contentType: image.type,
            upsert: false,
          });

      if (uploadError) {
        console.error("Branch image upload error:", uploadError);

        return NextResponse.json(
          { error: "Failed to upload branch image." },
          { status: 500 }
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("branch-images")
          .getPublicUrl(filePath);

      image_url = publicUrlData.publicUrl;
    }

    // Prepare database update
    const updateData: Record<string, unknown> = {
      name,
      slug,
      address,
      phone,
      whatsapp,
      email,
      google_maps_url,
      latitude,
      longitude,
      description,
      is_active,
      display_order,
      updated_at: new Date().toISOString(),
    };

    // Only replace image_url if a new image was uploaded
    if (image_url) {
      updateData.image_url = image_url;
    }

    const { error: updateError } = await supabase
      .from("branches")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Branch update error:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      branch_id: id,
    });
  } catch (error) {
    console.error("Unexpected branch update error:", error);

    return NextResponse.json(
      { error: "Something went wrong while updating the branch." },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    // Check logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: isAdmin, error: roleError } =
      await supabase.rpc("has_admin_role", {
        required_roles: [
          "super_admin",
          "website_manager",
          "content_manager",
        ],
      });

    if (roleError || !isAdmin) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to delete branches.",
        },
        { status: 403 }
      );
    }

    // Check that the branch exists
    const { data: branch, error: branchError } =
      await supabase
        .from("branches")
        .select("id, image_url")
        .eq("id", id)
        .single();

    if (branchError || !branch) {
      return NextResponse.json(
        { error: "Branch not found." },
        { status: 404 }
      );
    }

    // Delete the branch record
    const { error: deleteError } = await supabase
      .from("branches")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Branch delete error:", deleteError);

      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // Try to remove the branch's stored images.
    // This is done after the database record is deleted.
    const { data: files } = await supabase.storage
      .from("branch-images")
      .list(id);

    if (files && files.length > 0) {
      const filePaths = files
        .filter((file) => file.name)
        .map((file) => `${id}/${file.name}`);

      if (filePaths.length > 0) {
        const { error: storageError } =
          await supabase.storage
            .from("branch-images")
            .remove(filePaths);

        if (storageError) {
          console.error(
            "Branch image cleanup error:",
            storageError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      branch_id: id,
    });
  } catch (error) {
    console.error(
      "Unexpected branch delete error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while deleting the branch.",
      },
      { status: 500 }
    );
  }
}