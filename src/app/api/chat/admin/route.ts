import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
  "customer_support_manager",
];

async function getAdminSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: isAdmin, error } = await supabase.rpc(
    "has_admin_role",
    {
      required_roles: ADMIN_ROLES,
    },
  );

  if (error || !isAdmin) {
    return null;
  }

  return supabase;
}

// ================================================================
// GET /api/chat/admin
//
// ?mode=knowledge
// ?mode=unanswered
// ?mode=conversations
// ?mode=messages&conversationId=...
// ================================================================

export async function GET(request: Request) {
  const supabase = await getAdminSupabase();

  if (!supabase) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { searchParams } =
    new URL(request.url);

  const mode =
    searchParams.get("mode") || "knowledge";

  // --------------------------------------------------------------
  // Pending / unanswered questions
  // --------------------------------------------------------------

  if (mode === "unanswered") {
    const { data, error } = await supabase
      .from("chatbot_unanswered")
      .select("*")
      .order("status", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      questions: data || [],
    });
  }

  // --------------------------------------------------------------
  // Conversations
  // --------------------------------------------------------------

  if (mode === "conversations") {
    const { data, error } = await supabase
      .from("chatbot_conversations")
      .select("*")
      .order("updated_at", {
        ascending: false,
      })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      conversations: data || [],
    });
  }

  // --------------------------------------------------------------
  // Messages belonging to a conversation
  // --------------------------------------------------------------

  if (mode === "messages") {
    const conversationId =
      searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        {
          error:
            "conversationId required.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("chatbot_messages")
      .select("*")
      .eq(
        "conversation_id",
        conversationId,
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      messages: data || [],
    });
  }

  // --------------------------------------------------------------
  // Knowledge base
  // --------------------------------------------------------------

  const { data, error } = await supabase
    .from("chatbot_knowledge")
    .select("*")
    .order("pending_answer", {
      ascending: false,
    })
    .order("times_asked", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(300);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    knowledge: data || [],
  });
}


// ================================================================
// POST /api/chat/admin
//
// Normal knowledge operation:
//   question + answer
//
// Update existing knowledge:
//   id + question + answer
//
// Train from pending question:
//   action = "answer_unanswered"
//   unansweredId
//   answer
// ================================================================

export async function POST(request: Request) {
  const supabase = await getAdminSupabase();

  if (!supabase) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid JSON request.",
      },
      { status: 400 },
    );
  }

  const action =
    body.action?.toString().trim() || "";

  // ==============================================================
  // ANSWER PENDING QUESTION
  // ==============================================================

  if (action === "answer_unanswered") {
    const unansweredId =
      body.unansweredId
        ?.toString()
        .trim();

    const answer =
      body.answer
        ?.toString()
        .trim();

    if (!unansweredId || !answer) {
      return NextResponse.json(
        {
          error:
            "unansweredId and answer are required.",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------
    // Find the pending question
    // ------------------------------------------------------------

    const { data: unanswered, error: unansweredError } =
      await supabase
        .from("chatbot_unanswered")
        .select("*")
        .eq("id", unansweredId)
        .single();

    if (unansweredError || !unanswered) {
      return NextResponse.json(
        {
          error:
            unansweredError?.message ||
            "Pending question not found.",
        },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------
    // Find the learned knowledge entry created by the chatbot
    // ------------------------------------------------------------

    const { data: learnedEntry, error: learnedFindError } =
      await supabase
        .from("chatbot_knowledge")
        .select("*")
        .eq("question", unanswered.question)
        .eq("source", "learned")
        .limit(1)
        .maybeSingle();

    if (learnedFindError) {
      return NextResponse.json(
        {
          error:
            learnedFindError.message,
        },
        { status: 500 },
      );
    }

    let knowledgeEntry;

    // ------------------------------------------------------------
    // If learned entry exists, turn it into a real answer
    // ------------------------------------------------------------

    if (learnedEntry) {
      const { data, error } =
        await supabase
          .from("chatbot_knowledge")
          .update({
            title:
              learnedEntry.title ||
              unanswered.question.slice(
                0,
                120,
              ),

            answer,

            source: "admin",

            pending_answer: false,

            is_active: true,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            learnedEntry.id,
          )
          .select("*")
          .single();

      if (error || !data) {
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Could not train chatbot.",
          },
          { status: 500 },
        );
      }

      knowledgeEntry = data;
    } else {
      // ----------------------------------------------------------
      // Safety fallback:
      // create a new knowledge entry if the learned record
      // somehow no longer exists.
      // ----------------------------------------------------------

      const keywords =
        unanswered.question
          .toLowerCase()
          .replace(
            /[^a-z0-9\s]/g,
            " ",
          )
          .split(/\s+/)
          .filter(
            (word: string) =>
              word.length > 2,
          )
          .slice(0, 10);

      const { data, error } =
        await supabase
          .from("chatbot_knowledge")
          .insert({
            title:
              unanswered.question.slice(
                0,
                120,
              ),

            question:
              unanswered.question,

            answer,

            category:
              unanswered.category ||
              "general",

            keywords,

            priority: 0,

            is_active: true,

            pending_answer: false,

            times_asked: 0,

            source: "admin",
          })
          .select("*")
          .single();

      if (error || !data) {
        return NextResponse.json(
          {
            error:
              error?.message ||
              "Could not create chatbot knowledge.",
          },
          { status: 500 },
        );
      }

      knowledgeEntry = data;
    }

    // ------------------------------------------------------------
    // Mark pending question as answered
    // ------------------------------------------------------------

    const { data: answeredQuestion, error: answerUpdateError } =
      await supabase
        .from("chatbot_unanswered")
        .update({
          status: "answered",
          admin_answer: answer,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", unansweredId)
        .select("*")
        .single();

    if (answerUpdateError) {
      return NextResponse.json(
        {
          error:
            answerUpdateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Question answered and chatbot knowledge updated.",

      knowledge: knowledgeEntry,

      unanswered:
        answeredQuestion,
    });
  }

  // ==============================================================
  // NORMAL KNOWLEDGE CREATE / UPDATE
  // ==============================================================

  const question =
    body.question
      ?.toString()
      .trim() || "";

  const answer =
    body.answer
      ?.toString()
      .trim() || "";

  if (!question || !answer) {
    return NextResponse.json(
      {
        error:
          "question and answer are required.",
      },
      { status: 400 },
    );
  }

  const title =
    body.title
      ?.toString()
      .trim() ||
    question.slice(0, 120);

  const keywords =
    (body.keywords || "")
      .toString()
      .split(",")
      .map(
        (keyword: string) =>
          keyword
            .trim()
            .toLowerCase(),
      )
      .filter(Boolean);

  const finalKeywords =
    keywords.length > 0
      ? keywords
      : question
          .toLowerCase()
          .split(/\s+/)
          .filter(
            (word: string) =>
              word.length > 2,
          )
          .slice(0, 8);

  const values = {
    title,

    question,

    answer,

    keywords:
      finalKeywords,

    source: "admin" as const,

    pending_answer: false,

    is_active:
      body.isActive !== false,

    updated_at:
      new Date().toISOString(),
  };

  // --------------------------------------------------------------
  // Update existing knowledge
  // --------------------------------------------------------------

  if (body.id) {
    const { data, error } =
      await supabase
        .from("chatbot_knowledge")
        .update(values)
        .eq(
          "id",
          body.id,
        )
        .select("*")
        .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      entry: data,
    });
  }

  // --------------------------------------------------------------
  // Create new knowledge
  // --------------------------------------------------------------

  const { data, error } =
    await supabase
      .from("chatbot_knowledge")
      .insert(values)
      .select("*")
      .single();

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    entry: data,
  });
}


// ================================================================
// DELETE knowledge
// ================================================================

export async function DELETE(request: Request) {
  const supabase = await getAdminSupabase();

  if (!supabase) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  const { searchParams } =
    new URL(request.url);

  const id =
    searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        error: "id required.",
      },
      { status: 400 },
    );
  }

  const { error } =
    await supabase
      .from("chatbot_knowledge")
      .delete()
      .eq("id", id);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}