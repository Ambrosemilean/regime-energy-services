import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

// Bucket that holds company history milestone photos.
// Supports "history-images" (created in Supabase Storage) with automatic fallback.
const HISTORY_IMAGE_BUCKET = "history-images";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/admin/company-history/image
 *
 * Uploads one image to the `history-images` storage bucket and returns its
 * public URL. The caller then stores the URL on the milestone record via
 * POST/PUT /api/admin/company-history. Uploaded before the record save so a
 * failed milestone save simply leaves an unreferenced file rather than a
 * milestone pointing at a missing image.
 */
export async function POST(request: Request) {
  try {
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
        { error: "You do not have permission to upload images." },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const replaceUrl =
      formData.get("replace_url")?.toString().trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image was provided." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG and WEBP images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "The image must be 5MB or smaller." },
        { status: 400 }
      );
    }

    // Use admin client for storage operations once authorization is verified.
    // This prevents storage Row Level Security (RLS) policy blocks from stopping uploads.
    let storageClient = supabase;
    try {
      storageClient = createAdminClient() as unknown as typeof supabase;
    } catch {
      // Fallback to user supabase client if service key is unavailable
    }

    // When replacing an image, delete the old storage object first so the
    // bucket does not fill with orphaned files.
    if (replaceUrl) {
      const markers = ["/history-images/", "/company-history/"];
      let matchedMarker: string | null = null;
      let markerIndex = -1;

      for (const m of markers) {
        const idx = replaceUrl.indexOf(m);
        if (idx !== -1) {
          matchedMarker = m;
          markerIndex = idx;
          break;
        }
      }

      if (matchedMarker && markerIndex !== -1) {
        const bucketName = matchedMarker.replace(/\//g, "");
        const oldPath = replaceUrl
          .slice(markerIndex + matchedMarker.length)
          .split("?")[0];

        if (oldPath) {
          const { error: removeError } = await storageClient.storage
            .from(bucketName)
            .remove([oldPath]);

          if (removeError) {
            console.error(
              "HISTORY IMAGE OLD REMOVE ERROR:",
              removeError
            );
          }
        }
      }
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `milestones/${fileName}`;

    // Try primary bucket ("history-images"), fallback to "company-history" if needed
    let activeBucket = HISTORY_IMAGE_BUCKET;
    let { error: uploadError } = await storageClient.storage
      .from(activeBucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError && uploadError.message?.toLowerCase().includes("bucket not found")) {
      activeBucket = "company-history";
      const fallbackUpload = await storageClient.storage
        .from(activeBucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      uploadError = fallbackUpload.error;
    }

    if (uploadError) {
      console.error("HISTORY IMAGE UPLOAD ERROR:", uploadError);

      return NextResponse.json(
        {
          error: "Failed to upload the image.",
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = storageClient.storage
      .from(activeBucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      image_url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("HISTORY IMAGE POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to upload the history image.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
