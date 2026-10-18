
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

async function getAuthorizedSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc(
    "has_admin_role",
    {
      required_roles: ADMIN_ROLES,
    }
  );

  if (roleError || !isAdmin) {
    return null;
  }

  return supabase;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validateMilestone(body: Record<string, unknown>) {
  const year = Number(body.year);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const displayOrder = Number(body.display_order ?? 1);
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (
    body.year === undefined ||
    body.year === null ||
    body.year === "" ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 2100
  ) {
    return { error: "Enter a valid year between 1900 and 2100." };
  }

  if (!title) {
    return { error: "Milestone title is required." };
  }

  if (title.length > 150) {
    return { error: "Title must not exceed 150 characters." };
  }

  if (description.length > 3000) {
    return { error: "Description must not exceed 3000 characters." };
  }

  if (
    !Number.isInteger(displayOrder) ||
    displayOrder < 1
  ) {
    return { error: "Display order must be a whole number of at least 1." };
  }

  if (
    body.is_active !== undefined &&
    typeof body.is_active !== "boolean"
  ) {
    return { error: "Publication status must be true or false." };
  }

  return {
    value: {
      // Keep year as a string to match the existing API's storage behavior.
      year: String(year),
      title,
      description: description || null,
      display_order: displayOrder,
      is_active: body.is_active ?? true,
    },
  };
}

// GET: Retrieve milestones for the admin manager.
export async function GET() {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return errorResponse("Unauthorized.", 401);
    }

    const { data, error } = await supabase
      .from("company_history")
      .select("*")
      .order("display_order", { ascending: true })
      .order("year", { ascending: true });

    if (error) {
      console.error("Company history GET error:", error);
      return errorResponse(error.message, 500);
    }

    return NextResponse.json({
      success: true,
      milestones: data ?? [],
    });
  } catch (error) {
    console.error("Company history GET error:", error);
    return errorResponse("Failed to load company history.", 500);
  }
}

// POST: Create a milestone.
export async function POST(request: Request) {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return errorResponse("Unauthorized.", 401);
    }

    const body = await request.json();
    const validated = validateMilestone(body);

    if (validated.error) {
      return errorResponse(validated.error, 400);
    }

    const { data, error } = await supabase
      .from("company_history")
      .insert(validated.value!)
      .select("*")
      .single();

    if (error) {
      console.error("Company history POST error:", error);
      return errorResponse(error.message, 500);
    }

    return NextResponse.json(
      { success: true, milestone: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Company history POST error:", error);
    return errorResponse("Failed to create history milestone.", 500);
  }
}

// PUT: Update an existing milestone.
export async function PUT(request: Request) {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return errorResponse("Unauthorized.", 401);
    }

    const body = await request.json();

    if (typeof body.id !== "string" || !body.id.trim()) {
      return errorResponse("Milestone ID is required.", 400);
    }

    const validated = validateMilestone(body);

    if (validated.error) {
      return errorResponse(validated.error, 400);
    }

    const { data, error } = await supabase
      .from("company_history")
      .update({
        ...validated.value!,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Company history PUT error:", error);
      return errorResponse(error.message, 500);
    }

    if (!data) {
      return errorResponse("Milestone not found.", 404);
    }

    return NextResponse.json({ success: true, milestone: data });
  } catch (error) {
    console.error("Company history PUT error:", error);
    return errorResponse("Failed to update history milestone.", 500);
  }
}

// DELETE: Accept either a JSON ID or the older ?id=... URL format.
export async function DELETE(request: Request) {
  try {
    const supabase = await getAuthorizedSupabase();

    if (!supabase) {
      return errorResponse("Unauthorized.", 401);
    }

    const url = new URL(request.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        if (typeof body.id === "string") {
          id = body.id;
        }
      } catch {
        // A request without a JSON body may still use ?id=...
      }
    }

    if (!id?.trim()) {
      return errorResponse("Milestone ID is required.", 400);
    }

    const { data, error } = await supabase
      .from("company_history")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Company history DELETE error:", error);
      return errorResponse(error.message, 500);
    }

    if (!data) {
      return errorResponse("Milestone not found.", 404);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company history DELETE error:", error);
    return errorResponse("Failed to delete history milestone.", 500);
  }
}