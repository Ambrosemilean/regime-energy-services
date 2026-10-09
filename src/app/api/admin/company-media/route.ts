import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("AUTH ERROR:", userError);

      return NextResponse.json(
        {
          error: "Unauthorized. Please log in again.",
          details: userError?.message || null,
        },
        { status: 401 }
      );
    }

    const { data: isAdmin, error: roleError } =
      await supabase.rpc("has_admin_role", {
        required_roles: ADMIN_ROLES,
      });

    if (roleError) {
      console.error("ROLE CHECK ERROR:", roleError);

      return NextResponse.json(
        {
          error: "Unable to verify administrator permissions.",
          details: roleError.message,
        },
        { status: 403 }
      );
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "You do not have permission to upload images.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: "No images were provided.",
        },
        { status: 400 }
      );
    }

    console.log(
      `COMPANY MEDIA: Received ${files.length} file(s).`
    );

    const { count, error: countError } = await supabase
      .from("company_media")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (countError) {
      console.error(
        "DATABASE COUNT ERROR:",
        countError
      );

      return NextResponse.json(
        {
          error: "Unable to read company media records.",
          details: countError.message,
        },
        { status: 500 }
      );
    }

    let nextOrder = count ?? 0;
    let uploaded = 0;

    const errors: string[] = [];

    for (const file of files) {
      console.log(
        `Uploading: ${file.name} | ${file.type} | ${file.size} bytes`
      );

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = `slideshow/${fileName}`;

      // Upload image to Supabase Storage
      const { error: uploadError } =
        await supabase.storage
          .from("company-media")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error(
          "STORAGE UPLOAD ERROR:",
          uploadError
        );

        errors.push(
          `${file.name}: Storage upload failed - ${uploadError.message}`
        );

        continue;
      }

      console.log(
        `Storage upload successful: ${filePath}`
      );

      const { data: publicUrlData } =
        supabase.storage
          .from("company-media")
          .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Insert image record into database
      const { error: insertError } = await supabase
        .from("company_media")
        .insert({
          image_url: imageUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
          alt_text: "Regime Energy Services",
          display_order: nextOrder,
          is_active: true,
        });

      if (insertError) {
        console.error(
          "DATABASE INSERT ERROR:",
          insertError
        );

        errors.push(
          `${file.name}: Database insert failed - ${insertError.message}`
        );

        // Remove uploaded file if database insert fails
        await supabase.storage
          .from("company-media")
          .remove([filePath]);

        continue;
      }

      console.log(
        `Database insert successful: ${file.name}`
      );

      uploaded++;
      nextOrder++;
    }

    if (uploaded === 0) {
      return NextResponse.json(
        {
          error: "No images were uploaded successfully.",
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      uploaded,
      errors,
    });
  } catch (error) {
    console.error(
      "COMPANY MEDIA POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to upload company images.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}