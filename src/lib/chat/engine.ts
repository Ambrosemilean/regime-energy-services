import type { SupabaseClient } from "@supabase/supabase-js";

// ------------------------------------------------------------------
// Critical (safety) matter detection — triggers WhatsApp escalation.
// ------------------------------------------------------------------

const CRITICAL_KEYWORDS = [
  "leak",
  "leaking",
  "smell gas",
  "smells gas",
  "gas leak",
  "fire",
  "burning",
  "explosion",
  "blast",
  "emergency",
  "danger",
  "suffocat",
  "unconscious",
  "help me",
  "hurt",
  "injur",
];

export function detectCritical(message: string): string | null {
  const text = message.toLowerCase();

  for (const keyword of CRITICAL_KEYWORDS) {
    if (text.includes(keyword)) {
      return keyword;
    }
  }

  return null;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "i",
  "you",
  "we",
  "my",
  "your",
  "do",
  "does",
  "did",
  "can",
  "could",
  "will",
  "would",
  "to",
  "of",
  "in",
  "on",
  "for",
  "at",
  "and",
  "or",
  "it",
  "this",
  "that",
  "please",
  "how",
  "what",
  "when",
  "where",
  "hi",
  "hello",
  "hey",
  "me",
  "with",
  "have",
  "has",
  "want",
  "need",
  "get",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length > 1 &&
        !STOP_WORDS.has(token),
    );
}

function scoreEntry(
  message: string,
  entry: {
    question: string;
    keywords: string[] | null;
  },
): number {
  const text = message.toLowerCase();

  let score = 0;

  // Keyword hits
  for (const keyword of entry.keywords || []) {
    const kw = keyword.toLowerCase().trim();

    if (kw && text.includes(kw)) {
      score += 5;
    }
  }

  // Question token overlap
  const msgTokens = new Set(tokenize(message));
  const questionTokens = tokenize(entry.question);

  for (const token of questionTokens) {
    if (msgTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type KnowledgeEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[] | null;
  times_asked?: number;
};

export type CompanyContext = {
  company_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  products: string[];
  services: string[];
  branches: string[];
};

export type ChatReply = {
  reply: string;
  escalated: boolean;
  escalationReason: string | null;
  learned: boolean;
};

// ------------------------------------------------------------------
// Greeting / small-talk fallbacks
// ------------------------------------------------------------------

function greetingReply(
  text: string,
  ctx: CompanyContext,
): string | null {
  const t = text.toLowerCase().trim();

  if (
    /^(hi|hello|hey|good\s?(morning|afternoon|evening)|how far|greetings)\b/.test(
      t,
    )
  ) {
    return `Hello! 👋 I'm Regi, the ${
      ctx.company_name || "Regime Energy Services"
    } assistant. I can help you with gas orders, prices, delivery, cylinder sizes, branches and gas safety. What do you need today?`;
  }

  if (
    /\b(thank|thanks|thx|god bless)\b/.test(t)
  ) {
    return "You're welcome! 🙏 If you need anything else — orders, delivery or safety advice — just ask. Stay safe!";
  }

  if (
    /\b(bye|goodbye|good night|see you)\b/.test(t)
  ) {
    return "Goodbye! Stay safe with your gas usage. 🔥 You can always come back here if you need help.";
  }

  if (
    /\b(who are you|your name|what are you)\b/.test(
      t,
    )
  ) {
    return `I'm Regi, the automated assistant for ${
      ctx.company_name || "Regime Energy Services"
    }. I keep learning from customer conversations so I can serve you better every day.`;
  }

  return null;
}

// ------------------------------------------------------------------
// Live company-data answers
// ------------------------------------------------------------------

function companyDataReply(
  text: string,
  ctx: CompanyContext,
): string | null {
  const t = text.toLowerCase();

  if (
    ctx.products.length &&
    /\b(product|cylinder|what.*(sell|have|stock))\b/.test(
      t,
    )
  ) {
    return `Here's what we currently have: ${ctx.products
      .slice(0, 8)
      .join(
        ", ",
      )}. Visit the Products page on this site for full details, or ask me about a specific item.`;
  }

  if (
    ctx.services.length &&
    /\b(service|offer|what.*do)\b/.test(t)
  ) {
    return `Our services include: ${ctx.services
      .slice(0, 8)
      .join(
        ", ",
      )}. See the Services page for more information on any of them.`;
  }

  if (
    ctx.branches.length &&
    /\b(branch|office|where.*located|locations?)\b/.test(
      t,
    )
  ) {
    return `Our branches: ${ctx.branches
      .slice(0, 6)
      .join(
        ", ",
      )}. The Branches page has full addresses, phone numbers and Google Maps directions.`;
  }

  if (
    /\b(contact|phone number|email|reach)\b/.test(t)
  ) {
    const parts: string[] = [];

    if (ctx.phone) {
      parts.push(`Phone: ${ctx.phone}`);
    }

    if (ctx.whatsapp) {
      parts.push(`WhatsApp: ${ctx.whatsapp}`);
    }

    if (ctx.email) {
      parts.push(`Email: ${ctx.email}`);
    }

    if (ctx.address) {
      parts.push(`Address: ${ctx.address}`);
    }

    if (parts.length) {
      return `You can reach us here: ${parts.join(" · ")}`;
    }
  }

  return null;
}

// ------------------------------------------------------------------
// Main chatbot engine
// ------------------------------------------------------------------

export async function generateReply(
  supabase: SupabaseClient,
  message: string,
  conversationId: string,
  ctx: CompanyContext,
): Promise<ChatReply> {
  const critical = detectCritical(message);

  // --------------------------------------------------------------
  // 1. Load active knowledge
  // --------------------------------------------------------------

  const { data: knowledge, error: knowledgeError } =
    await supabase
      .from("chatbot_knowledge")
      .select(
        "id, question, answer, keywords, times_asked",
      )
      .eq("is_active", true)
      .eq("pending_answer", false);

  if (knowledgeError) {
    console.error(
      "Chatbot knowledge load error:",
      knowledgeError,
    );
  }

  const entries =
    (knowledge || []) as KnowledgeEntry[];

  // --------------------------------------------------------------
  // 2. Critical safety matter
  // --------------------------------------------------------------

  if (critical) {
    const safetyEntry = entries.find((entry) =>
      (entry.keywords || []).some((keyword) => {
        const kw = keyword.toLowerCase();

        return (
          critical.includes(kw) ||
          kw.includes(critical)
        );
      }),
    );

    const answer =
      safetyEntry?.answer ||
      "This sounds urgent. For your safety: shut the cylinder valve, avoid any sparks or flames, ventilate the area and move away. Our customer service team is being contacted for you now — please share your location.";

    return {
      reply: `⚠️ ${answer}`,
      escalated: true,
      escalationReason: `Safety-critical keyword detected: "${critical}"`,
      learned: false,
    };
  }

  // --------------------------------------------------------------
  // 3. Greetings / small talk
  // --------------------------------------------------------------

  const greeting = greetingReply(
    message,
    ctx,
  );

  if (greeting) {
    return {
      reply: greeting,
      escalated: false,
      escalationReason: null,
      learned: false,
    };
  }

  // --------------------------------------------------------------
  // 4. Knowledge-base matching
  // --------------------------------------------------------------

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of entries) {
    const score = scoreEntry(
      message,
      entry,
    );

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= 5) {
    const { error } = await supabase.rpc(
      "chatbot_increment_knowledge",
      {
        p_knowledge_id: best.id,
      },
    );

    if (error) {
      console.error(
        "Could not increment chatbot knowledge:",
        error,
      );
    }

    return {
      reply: best.answer,
      escalated: false,
      escalationReason: null,
      learned: false,
    };
  }

  // --------------------------------------------------------------
  // 5. Live company data
  // --------------------------------------------------------------

  const dataReply = companyDataReply(
    message,
    ctx,
  );

  if (dataReply) {
    return {
      reply: dataReply,
      escalated: false,
      escalationReason: null,
      learned: false,
    };
  }

  // --------------------------------------------------------------
  // 6. Unknown question
  //
  // Create a learned/pending knowledge question.
  // The actual chatbot_unanswered record is created by
  // /api/chat/route.ts because it needs the visitor message ID.
  // --------------------------------------------------------------

  const normalized = message
    .trim()
    .slice(0, 300);

  const tokens = tokenize(normalized)
    .slice(0, 10);

  const { error: learnedError } =
    await supabase.rpc(
      "chatbot_create_learned_question",
      {
        p_question: normalized,
        p_keywords: tokens,
      },
    );

  if (learnedError) {
    console.error(
      "Could not record learned chatbot question:",
      learnedError,
    );
  }

  // --------------------------------------------------------------
  // 7. Exact unanswered response
  // --------------------------------------------------------------

  return {
    reply:
      `I don't have a confident answer for that yet, but I've noted it so our team can train me on it. ` +
      `Meanwhile, our customer service team is happy to help — use the "Escalate to WhatsApp" button or call 08021295401.`,
    escalated: false,
    escalationReason: null,
    learned: true,
  };
}