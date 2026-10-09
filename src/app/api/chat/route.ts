import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateReply,
  detectCritical,
  type CompanyContext,
} from "@/lib/chat/engine";

const FALLBACK_PHONE = "08021295401";

// POST /api/chat
//
// body:
// {
//   sessionId: string,
//   message: string,
//   conversationId?: string,
//   customerName?: string,
//   customerPhone?: string
// }

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId = (body.sessionId || "")
      .toString()
      .trim();

    const message = (body.message || "")
      .toString()
      .trim();

    const requestedConversationId = (
      body.conversationId || ""
    )
      .toString()
      .trim();

    const customerName = (
      body.customerName || ""
    )
      .toString()
      .trim();

    const customerPhone = (
      body.customerPhone || ""
    )
      .toString()
      .trim();

    if (!sessionId || !message) {
      return NextResponse.json(
        {
          error:
            "sessionId and message are required.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // ------------------------------------------------------------
    // 1. Load live company information
    // ------------------------------------------------------------

    const [
      profileRes,
      productsRes,
      servicesRes,
      branchesRes,
    ] = await Promise.all([
      supabase
        .from("company_profile")
        .select(
          "company_name, phone, whatsapp, email, address",
        )
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),

      supabase
        .from("products")
        .select("name")
        .eq("is_active", true)
        .order("display_order", {
          ascending: true,
        })
        .limit(12),

      supabase
        .from("services")
        .select("name")
        .eq("is_active", true)
        .order("display_order", {
          ascending: true,
        })
        .limit(12),

      supabase
        .from("branches")
        .select("name")
        .eq("is_active", true)
        .limit(12),
    ]);

    const profile = profileRes.data;

    const ctx: CompanyContext = {
      company_name:
        profile?.company_name ?? null,

      phone: profile?.phone ?? null,

      whatsapp:
        profile?.whatsapp ?? null,

      email:
        profile?.email ?? null,

      address:
        profile?.address ?? null,

      products:
        (productsRes.data || []).map(
          (product) => product.name,
        ),

      services:
        (servicesRes.data || []).map(
          (service) => service.name,
        ),

      branches:
        (branchesRes.data || []).map(
          (branch) => branch.name,
        ),
    };

    // ------------------------------------------------------------
    // 2. Get or create the chatbot conversation
    // ------------------------------------------------------------

    let conversationId = "";

    if (requestedConversationId) {
      const { data: existingConversation } =
        await supabase
          .from("chatbot_conversations")
          .select("id, session_id, status")
          .eq("id", requestedConversationId)
          .eq("session_id", sessionId)
          .maybeSingle();

      if (existingConversation) {
        conversationId =
          existingConversation.id;
      }
    }

    if (!conversationId) {
      const { data: conversationIdData, error } =
        await supabase.rpc(
          "chatbot_get_or_create_conversation",
          {
            p_session_id: sessionId,
            p_visitor_name:
              customerName || null,
            p_visitor_phone:
              customerPhone || null,
          },
        );

      if (error || !conversationIdData) {
        console.error(
          "Could not create chatbot conversation:",
          error,
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "Could not start conversation.",
          },
          { status: 500 },
        );
      }

      conversationId =
        conversationIdData as string;
    }

    // ------------------------------------------------------------
    // 3. Save the visitor's message
    // ------------------------------------------------------------

    const { data: visitorMessageId, error: visitorError } =
      await supabase.rpc(
        "chatbot_save_message",
        {
          p_conversation_id:
            conversationId,

          p_sender: "visitor",

          p_message: message,

          p_knowledge_id: null,

          p_was_answered: true,
        },
      );

    if (visitorError || !visitorMessageId) {
      console.error(
        "Could not save visitor message:",
        visitorError,
      );

      return NextResponse.json(
        {
          error:
            visitorError?.message ||
            "Could not save your message.",
        },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------
    // 4. Generate Regi's response
    // ------------------------------------------------------------

    const result = await generateReply(
      supabase,
      message,
      conversationId,
      ctx,
    );

    // ------------------------------------------------------------
    // 5. Save Regi's response
    // ------------------------------------------------------------

    const { data: assistantMessageId, error: assistantError } =
      await supabase.rpc(
        "chatbot_save_message",
        {
          p_conversation_id:
            conversationId,

          p_sender: "assistant",

          p_message: result.reply,

          p_knowledge_id: null,

          p_was_answered:
            !result.learned,
        },
      );

    if (assistantError || !assistantMessageId) {
      console.error(
        "Could not save assistant message:",
        assistantError,
      );

      return NextResponse.json(
        {
          error:
            assistantError?.message ||
            "Could not save assistant response.",
        },
        { status: 500 },
      );
    }

    // ------------------------------------------------------------
    // 6. Unknown question → add to pending queue
    // ------------------------------------------------------------

    if (result.learned) {
      const { error: unansweredError } =
        await supabase.rpc(
          "chatbot_record_unanswered",
          {
            p_conversation_id:
              conversationId,

            p_message_id:
              visitorMessageId,

            p_question: message,

            p_category: "general",
          },
        );

      if (unansweredError) {
        console.error(
          "Could not record unanswered question:",
          unansweredError,
        );
      }
    }

    // ------------------------------------------------------------
    // 7. Critical safety question
    // ------------------------------------------------------------

    let whatsappLink: string | null = null;

    if (result.escalated) {
      await supabase
        .from("chatbot_conversations")
        .update({
          status: "escalated",
          escalation_reason:
            result.escalationReason,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", conversationId);

      const whatsappNumber =
        ctx.whatsapp ||
        FALLBACK_PHONE;

      const digits =
        whatsappNumber.replace(/\D/g, "");

      const escalationText =
        encodeURIComponent(
          `🚨 REGIME WEBSITE CHAT ESCALATION\n\n` +
            `Reason: ${
              result.escalationReason ||
              "Safety-critical question"
            }\n\n` +
            `Customer message: "${message.slice(
              0,
              300,
            )}"\n\n` +
            `Conversation ID: ${conversationId}\n\n` +
            `Please assist this customer urgently.`,
        );

      whatsappLink =
        `https://wa.me/${digits}?text=${escalationText}`;
    } else {
      await supabase
        .from("chatbot_conversations")
        .update({
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", conversationId);
    }

    // ------------------------------------------------------------
    // 8. WhatsApp button for unanswered questions
    // ------------------------------------------------------------

    let unansweredWhatsappLink:
      | string
      | null = null;

    if (result.learned) {
      const digits =
        FALLBACK_PHONE.replace(/\D/g, "");

      const text = encodeURIComponent(
        `Hello Regime Energy Services, I need assistance with a question I asked Regi on the website.\n\n` +
          `Question: "${message.slice(
            0,
            300,
          )}"\n\n` +
          `Conversation ID: ${conversationId}`,
      );

      unansweredWhatsappLink =
        `https://wa.me/${digits}?text=${text}`;
    }

    // ------------------------------------------------------------
    // 9. Return response to chatbot UI
    // ------------------------------------------------------------

    return NextResponse.json({
      conversationId,

      reply: result.reply,

      escalated:
        result.escalated,

      learned:
        result.learned,

      whatsappLink,

      unansweredWhatsappLink,

      companyWhatsapp:
        ctx.whatsapp
          ? `https://wa.me/${ctx.whatsapp.replace(
              /\D/g,
              "",
            )}`
          : `https://wa.me/${FALLBACK_PHONE}`,
    });
  } catch (error) {
    console.error(
      "Chat POST error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Chat assistant is temporarily unavailable.",
      },
      { status: 500 },
    );
  }
}


// ================================================================
// GET /api/chat?sessionId=...
//
// Loads the latest conversation and its complete history.
// ================================================================

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const sessionId =
      searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "sessionId is required.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: conversation, error: conversationError } =
      await supabase
        .from("chatbot_conversations")
        .select(
          "id, status, created_at, updated_at",
        )
        .eq("session_id", sessionId)
        .order("updated_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (conversationError) {
      console.error(
        "Chat conversation load error:",
        conversationError,
      );
    }

    if (!conversation) {
      return NextResponse.json({
        conversationId: null,
        status: null,
        messages: [],
      });
    }

    const { data: messages, error: messagesError } =
      await supabase
        .from("chatbot_messages")
        .select(
          "id, conversation_id, sender, message, knowledge_id, was_answered, created_at",
        )
        .eq(
          "conversation_id",
          conversation.id,
        )
        .order("created_at", {
          ascending: true,
        });

    if (messagesError) {
      console.error(
        "Chat messages load error:",
        messagesError,
      );
    }

    return NextResponse.json({
      conversationId:
        conversation.id,

      status:
        conversation.status,

      messages:
        messages || [],
    });
  } catch (error) {
    console.error(
      "Chat GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Could not load chat history.",
      },
      { status: 500 },
    );
  }
}

export { detectCritical };