import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ChatRequest = {
  session_id?: string;
  message?: string;
  visitor_name?: string;
  visitor_phone?: string;
};

type KnowledgeEntry = {
  id: string;
  title: string;
  question: string | null;
  answer: string;
  category: string;
  keywords: string[];
  priority: number;
  is_active: boolean;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateScore(
  message: string,
  entry: KnowledgeEntry
) {
  const normalizedMessage = normalizeText(message);

  const messageWords = new Set(
    normalizedMessage.split(" ").filter(Boolean)
  );

  let score = 0;

  const titleWords = normalizeText(entry.title).split(" ");

  const questionWords = entry.question
    ? normalizeText(entry.question).split(" ")
    : [];

  const keywordWords = entry.keywords.flatMap((keyword) =>
    normalizeText(keyword).split(" ")
  );

  for (const word of titleWords) {
    if (word.length > 2 && messageWords.has(word)) {
      score += 3;
    }
  }

  for (const word of questionWords) {
    if (word.length > 2 && messageWords.has(word)) {
      score += 4;
    }
  }

  for (const word of keywordWords) {
    if (word.length > 2 && messageWords.has(word)) {
      score += 5;
    }
  }

  score += Math.min(entry.priority, 10);

  return score;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;

    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "Your message is too long.",
        },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    const sessionId =
      body.session_id?.trim() ||
      crypto.randomUUID();

    /*
     * 1. Find or create conversation
     */
    let conversationId: string | null = null;

    const { data: existingConversation, error: conversationLookupError } =
      await supabase
        .from("chatbot_conversations")
        .select("id")
        .eq("session_id", sessionId)
        .eq("status", "active")
        .maybeSingle();

    if (conversationLookupError) {
      console.error(
        "Conversation lookup error:",
        conversationLookupError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to start chat.",
        },
        { status: 500 }
      );
    }

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      const { data: newConversation, error: createConversationError } =
        await supabase
          .from("chatbot_conversations")
          .insert({
            session_id: sessionId,
            visitor_name: body.visitor_name?.trim() || null,
            visitor_phone: body.visitor_phone?.trim() || null,
          })
          .select("id")
          .single();

      if (createConversationError || !newConversation) {
        console.error(
          "Create conversation error:",
          createConversationError
        );

        return NextResponse.json(
          {
            success: false,
            error: "Unable to create chat conversation.",
          },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
    }

    /*
     * 2. Record visitor message
     */
    const { data: visitorMessage, error: visitorMessageError } =
      await supabase
        .from("chatbot_messages")
        .insert({
          conversation_id: conversationId,
          sender: "visitor",
          message,
        })
        .select("id")
        .single();

    if (visitorMessageError || !visitorMessage) {
      console.error(
        "Visitor message error:",
        visitorMessageError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to record your message.",
        },
        { status: 500 }
      );
    }

    /*
     * 3. Load active knowledge base
     */
    const { data: knowledge, error: knowledgeError } =
      await supabase
        .from("chatbot_knowledge")
        .select(
          "id, title, question, answer, category, keywords, priority, is_active"
        )
        .eq("is_active", true);

    if (knowledgeError) {
      console.error(
        "Knowledge base error:",
        knowledgeError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to access the knowledge base.",
        },
        { status: 500 }
      );
    }

    /*
     * 4. Find the best matching knowledge entry
     */
    const entries = (knowledge || []) as KnowledgeEntry[];

    let bestEntry: KnowledgeEntry | null = null;
    let bestScore = 0;

    for (const entry of entries) {
      const score = calculateScore(message, entry);

      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    /*
     * Minimum confidence threshold.
     *
     * We deliberately do not answer when
     * there isn't a reasonable knowledge match.
     */
    const MINIMUM_SCORE = 5;

    if (!bestEntry || bestScore < MINIMUM_SCORE) {
      await supabase
        .from("chatbot_messages")
        .update({
          was_answered: false,
        })
        .eq("id", visitorMessage.id);

      const { data: unansweredQuestion } =
        await supabase
          .from("chatbot_unanswered")
          .insert({
            conversation_id: conversationId,
            message_id: visitorMessage.id,
            question: message,
            status: "pending",
          })
          .select("id")
          .single();

      const fallbackMessage =
        "I'm sorry, I don't have enough information to answer that confidently. " +
        "Please contact Regime Energy Services support for assistance.";

      await supabase
        .from("chatbot_messages")
        .insert({
          conversation_id: conversationId,
          sender: "assistant",
          message: fallbackMessage,
          was_answered: false,
        });

      return NextResponse.json({
        success: true,
        answered: false,
        session_id: sessionId,
        conversation_id: conversationId,
        message: fallbackMessage,
        unanswered_id: unansweredQuestion?.id || null,
        support_available: true,
      });
    }

    /*
     * 5. Record assistant answer
     */
    await supabase
      .from("chatbot_messages")
      .insert({
        conversation_id: conversationId,
        sender: "assistant",
        message: bestEntry.answer,
        knowledge_id: bestEntry.id,
        was_answered: true,
      });

    /*
     * 6. Update conversation timestamp
     */
    await supabase
      .from("chatbot_conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return NextResponse.json({
      success: true,
      answered: true,
      session_id: sessionId,
      conversation_id: conversationId,
      message: bestEntry.answer,
      category: bestEntry.category,
      knowledge_id: bestEntry.id,
    });
  } catch (error) {
    console.error("Chatbot API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while processing your message.",
      },
      { status: 500 }
    );
  }
}