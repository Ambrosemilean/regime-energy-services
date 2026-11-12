import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

/**
 * Deletes a company media image.
 *
 * Removes BOTH the Supabase Storage object (derived from the stored public
 * URL) and the company_media database row, so the file no longer consumes
 * storage once the admin removes it from the slideshow.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc(
      "has_admin_role",
      { required_roles: ADMIN_ROLES }
    );

    if (roleError || !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to delete images." },
        { status: 403 }
      );
    }

    // Fetch the record first so we know which storage object to remove.
    const { data: media, error: fetchError } = await supabase
      .from("company_media")
      .select("id, image_url")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Unable to read the image record.", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!media) {
      return NextResponse.json(
        { error: "Image not found." },
        { status: 404 }
      );
    }

    // Derive the storage path from the public URL:
    // .../storage/v1/object/public/company-media/<path>
    const marker = "/company-media/";
    const urlIndex = media.image_url.indexOf(marker);

    if (urlIndex !== -1) {
      const storagePath = media.image_url.slice(urlIndex + marker.length);

      const { error: storageError } = await supabase.storage
        .from("company-media")
        .remove([storagePath]);

      if (storageError) {
        console.error("STORAGE DELETE ERROR:", storageError);
        // Continue — the database row is still removed so the image
        // disappears from the site even if the file is already gone.
      }
    }

    const { error: deleteError } = await supabase
      .from("company_media")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete the image record.", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("COMPANY MEDIA DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete company image.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
