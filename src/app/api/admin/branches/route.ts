import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "You do not have permission to create branches." },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const address = String(formData.get("address") || "").trim();
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
      formData.get("display_order") || "0"
    ).trim();

    const isActive =
      formData.get("is_active") === "on";

    if (!name || !address) {
      return NextResponse.json(
        { error: "Branch name and address are required." },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const latitude = latitudeValue
      ? Number(latitudeValue)
      : null;

    const longitude = longitudeValue
      ? Number(longitudeValue)
      : null;

    const display_order = Number(displayOrderValue) || 0;

    if (
      (latitudeValue && Number.isNaN(latitude)) ||
      (longitudeValue && Number.isNaN(longitude))
    ) {
      return NextResponse.json(
        { error: "Latitude and longitude must be valid numbers." },
        { status: 400 }
      );
    }

    // Create branch first
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .insert({
        name,
        slug,
        address,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        google_maps_url: google_maps_url || null,
        latitude,
        longitude,
        description: description || null,
        is_active: isActive,
        display_order,
      })
      .select("id")
      .single();

    if (branchError) {
      console.error("Branch creation error:", branchError);

      return NextResponse.json(
        { error: branchError.message },
        { status: 500 }
      );
    }

    // Upload branch image if one was selected
    const image = formData.get("image");

    if (image instanceof File && image.size > 0) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(image.type)) {
        await supabase
          .from("branches")
          .delete()
          .eq("id", branch.id);

        return NextResponse.json(
          { error: "Only JPG, PNG, and WEBP images are allowed." },
          { status: 400 }
        );
      }

      if (image.size > 5 * 1024 * 1024) {
        await supabase
          .from("branches")
          .delete()
          .eq("id", branch.id);

        return NextResponse.json(
          { error: "Branch image must not exceed 5MB." },
          { status: 400 }
        );
      }

      const extension =
        image.type === "image/png"
          ? "png"
          : image.type === "image/webp"
            ? "webp"
            : "jpg";

      const filePath = `${branch.id}/branch-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("branch-images")
        .upload(filePath, image, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Branch image upload error:", uploadError);

        await supabase
          .from("branches")
          .delete()
          .eq("id", branch.id);

        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("branch-images")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("branches")
        .update({
          image_url: publicUrl,
        })
        .eq("id", branch.id);

      if (updateError) {
        console.error(
          "Branch image URL update error:",
          updateError
        );

        await supabase.storage
          .from("branch-images")
          .remove([filePath]);

        await supabase
          .from("branches")
          .delete()
          .eq("id", branch.id);

        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      branch_id: branch.id,
    });
  } catch (error) {
    console.error("Unexpected branch creation error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}