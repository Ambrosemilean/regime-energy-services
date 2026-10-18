import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ROLES = [
  "super_admin",
  "website_manager",
  "content_manager",
];

// Tables exist only after supabase/migrations/20261012_website_analytics.sql
// has been run — all analytics reads are wrapped defensively so the
// dashboard still renders (with zeros) if analytics is disabled.

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc("has_admin_role", {
      required_roles: ADMIN_ROLES,
    });

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 3600_000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400_000).toISOString();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400_000).toISOString();

    // ------------------------------------------------------------------
    // 1. Traffic
    // ------------------------------------------------------------------
    const [
      { count: viewsAllTime },
      { count: viewsToday },
      { count: viewsThisWeek },
      { count: viewsThisMonth },
      { data: recentViews, error: viewsError },
      { data: visitorRows, error: visitorError },
    ] = await Promise.all([
      supabase.from("site_page_views").select("id", { count: "exact", head: true }),
      supabase.from("site_page_views").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
      supabase.from("site_page_views").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("site_page_views").select("id", { count: "exact", head: true }).gte("created_at", monthAgo),
      supabase
        .from("site_page_views")
        .select("visitor_id, session_id, path, source, device, created_at")
        .gte("created_at", ninetyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("site_page_views")
        .select("visitor_id, created_at")
        .gte("created_at", monthAgo)
        .order("created_at", { ascending: false })
        .limit(20000),
    ]);

    const safeViews = viewsError ? [] : recentViews ?? [];
    const safeVisitors = visitorError ? [] : visitorRows ?? [];

    // Unique visitors
    const uniqueAllTime = new Set(safeViews.map((v) => v.visitor_id)).size;
    const uniqueToday = new Set(
      safeViews.filter((v) => v.created_at >= dayAgo).map((v) => v.visitor_id)
    ).size;
    const uniqueWeek = new Set(
      safeViews.filter((v) => v.created_at >= weekAgo).map((v) => v.visitor_id)
    ).size;
    const uniqueMonth = new Set(
      safeVisitors.map((v) => v.visitor_id)
    ).size;

    // New vs returning (in the last 30 days): a visitor is "returning"
    // if their earliest view is older than the window start.
    const firstSeen = new Map<string, string>();
    for (const row of [...safeVisitors].reverse()) {
      if (!firstSeen.has(row.visitor_id)) {
        firstSeen.set(row.visitor_id, row.created_at);
      }
    }
    let returningVisitors = 0;
    for (const first of firstSeen.values()) {
      if (first < monthAgo) {
        returningVisitors += 1;
      }
    }
    const newVisitors = Math.max(uniqueMonth - returningVisitors, 0);

    // Daily trend (last 30 days) + weekday-aware daily counts
    const dailyMap = new Map<string, { views: number; visitors: Set<string> }>();
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
      dailyMap.set(day, { views: 0, visitors: new Set() });
    }
    for (const row of safeVisitors) {
      const day = row.created_at.slice(0, 10);
      const entry = dailyMap.get(day);
      if (entry) {
        entry.views += 1;
        entry.visitors.add(row.visitor_id);
      }
    }
    const dailyTrend = Array.from(dailyMap.entries()).map(([date, value]) => ({
      date,
      views: value.views,
      visitors: value.visitors.size,
    }));

    // Weekly buckets (last 12 weeks)
    const weeklyTrend: { week: string; views: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const start = new Date(now.getTime() - (i + 1) * 7 * 86400_000);
      const end = new Date(now.getTime() - i * 7 * 86400_000);
      const views = safeViews.filter(
        (v) => v.created_at >= start.toISOString() && v.created_at < end.toISOString()
      ).length;
      weeklyTrend.push({ week: `W-${i}`, views });
    }

    // Monthly buckets (last 6 months)
    const monthlyTrend: { month: string; views: number }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const views = safeViews.filter((v) => v.created_at.slice(0, 7) === key).length;
      monthlyTrend.push({ month: key, views });
    }

    // Most-visited pages
    const pageMap = new Map<string, number>();
    for (const row of safeViews) {
      pageMap.set(row.path, (pageMap.get(row.path) || 0) + 1);
    }
    const topPages = Array.from(pageMap.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    // Traffic sources
    const sourceMap = new Map<string, number>();
    for (const row of safeViews) {
      const src = row.source || "direct";
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
    }
    const trafficSources = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    // ------------------------------------------------------------------
    // 2. Real-time
    // ------------------------------------------------------------------
    const { data: liveRows, error: liveError } = await supabase
      .from("live_sessions")
      .select("visitor_id, session_id, path, last_seen_at")
      .gte("last_seen_at", fiveMinAgo)
      .order("last_seen_at", { ascending: false })
      .limit(200);

    const safeLive = liveError ? [] : liveRows ?? [];
    const activeVisitors = new Set(safeLive.map((s) => s.visitor_id)).size;
    const activeSessions = new Set(safeLive.map((s) => s.session_id)).size;

    const livePageMap = new Map<string, number>();
    for (const row of safeLive) {
      livePageMap.set(row.path, (livePageMap.get(row.path) || 0) + 1);
    }
    const livePages = Array.from(livePageMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const { data: recentActivityRows, error: activityError } = await supabase
      .from("site_page_views")
      .select("path, created_at, device, source")
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false })
      .limit(15);

    const recentActivity = activityError ? [] : recentActivityRows ?? [];

    // ------------------------------------------------------------------
    // 3. Chatbot analytics
    // ------------------------------------------------------------------
    const [
      { count: totalConversations },
      { count: escalatedConversations },
      { data: chatUsers, error: chatUsersError },
      { data: chatMessages, error: chatMessagesError },
      { data: pendingKnowledge },
      { count: knowledgeCount },
      { data: conversationTrendRows, error: convTrendError },
    ] = await Promise.all([
      supabase.from("chatbot_conversations").select("id", { count: "exact", head: true }),
      supabase
        .from("chatbot_conversations")
        .select("id", { count: "exact", head: true })
        .eq("status", "escalated"),
      supabase
        .from("chatbot_conversations")
        .select("session_id, created_at")
        .gte("created_at", ninetyDaysAgo)
        .limit(10000),
      supabase
        .from("chatbot_messages")
        .select("sender, message, created_at")
        .gte("created_at", ninetyDaysAgo)
        .limit(20000),
      supabase
        .from("chatbot_unanswered")
        .select("id, question")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("chatbot_knowledge").select("id", { count: "exact", head: true }),
      supabase
        .from("chatbot_conversations")
        .select("created_at")
        .gte("created_at", ninetyDaysAgo)
        .limit(10000),
    ]);

    const uniqueChatUsers = chatUsersError
      ? 0
      : new Set((chatUsers ?? []).map((c) => c.session_id)).size;

    const safeMessages = chatMessagesError ? [] : chatMessages ?? [];
    const userMessages = safeMessages.filter((m) => m.sender === "visitor");
    const assistantMessages = safeMessages.filter((m) => m.sender === "assistant");

    // Most frequent topics: top keywords from user questions
    const STOP_WORDS = new Set([
      "the", "is", "at", "do", "you", "your", "can", "how", "what", "are",
      "i", "a", "to", "of", "and", "for", "in", "on", "it", "my", "we",
      "with", "have", "has", "if", "be", "me", "this", "that", "was", "or",
    ]);
    const wordMap = new Map<string, number>();
    for (const msg of userMessages) {
      const words: string[] = msg.message
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));
      for (const word of words) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
      }
    }
    const topTopics = Array.from(wordMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Answer success rate: share of user messages followed by an
    // assistant reply in the same conversation flow.
    const messagesByTime = safeMessages
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    let answered = 0;
    for (let i = 0; i < messagesByTime.length; i += 1) {
      if (messagesByTime[i].sender === "visitor") {
        const next = messagesByTime[i + 1];
        if (next && next.sender === "assistant") {
          answered += 1;
        }
      }
    }
    const answerRate =
      userMessages.length > 0
        ? Math.round((answered / userMessages.length) * 100)
        : 0;

    // Conversation trend (last 30 days)
    const convTrendMap = new Map<string, number>();
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(now.getTime() - i * 86400_000).toISOString().slice(0, 10);
      convTrendMap.set(day, 0);
    }
    if (!convTrendError) {
      for (const row of conversationTrendRows ?? []) {
        const day = row.created_at.slice(0, 10);
        if (convTrendMap.has(day)) {
          convTrendMap.set(day, (convTrendMap.get(day) || 0) + 1);
        }
      }
    }
    const conversationTrend = Array.from(convTrendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // ------------------------------------------------------------------
    // 4. Products & Services overview
    // ------------------------------------------------------------------
    const [
      { count: totalProducts },
      { count: publishedProducts },
      { count: inactiveProducts },
      { count: totalServices },
      { count: publishedServices },
      { count: inactiveServices },
      { data: productViewEvents },
      { data: serviceViewEvents },
    ] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", false),
      supabase.from("services").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("services").select("id", { count: "exact", head: true }).eq("is_active", false),
      supabase
        .from("site_events")
        .select("label")
        .eq("event_type", "product_view")
        .gte("created_at", monthAgo)
        .limit(5000),
      supabase
        .from("site_events")
        .select("label")
        .eq("event_type", "service_view")
        .gte("created_at", monthAgo)
        .limit(5000),
    ]);

    function countLabels(rows: { label: string | null }[] | null) {
      const map = new Map<string, number>();
      for (const row of rows ?? []) {
        if (!row.label) continue;
        map.set(row.label, (map.get(row.label) || 0) + 1);
      }
      return Array.from(map.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    const topProducts = countLabels(productViewEvents);
    const topServices = countLabels(serviceViewEvents);

    const { data: whatsappEvents, error: waError } = await supabase
      .from("site_events")
      .select("event_type")
      .in("event_type", ["whatsapp_click", "phone_click"])
      .gte("created_at", monthAgo)
      .limit(5000);

    const whatsappClicks = waError
      ? 0
      : (whatsappEvents ?? []).filter((e) => e.event_type === "whatsapp_click").length;
    const phoneClicks = waError
      ? 0
      : (whatsappEvents ?? []).filter((e) => e.event_type === "phone_click").length;

    // ------------------------------------------------------------------
    // 5. Branch & customer engagement
    // ------------------------------------------------------------------
    const [
      { count: totalBranches },
      { data: branchViews, error: branchViewsError },
      { data: mapsEvents, error: mapsError },
      { data: branchEvents },
    ] = await Promise.all([
      supabase.from("branches").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("site_page_views")
        .select("path")
        .like("path", "%branch%")
        .gte("created_at", monthAgo)
        .limit(5000),
      supabase
        .from("site_events")
        .select("label")
        .eq("event_type", "maps_click")
        .gte("created_at", monthAgo)
        .limit(5000),
      supabase
        .from("site_events")
        .select("event_type, label")
        .in("event_type", ["phone_click", "whatsapp_click", "maps_click"])
        .gte("created_at", monthAgo)
        .limit(5000),
    ]);

    const branchPageViews = branchViewsError ? 0 : (branchViews ?? []).length;
    const mapsClicks = mapsError ? 0 : (mapsEvents ?? []).length;

    const branchEngagementMap = new Map<string, { phone: number; whatsapp: number; maps: number }>();
    for (const row of branchEvents ?? []) {
      const key = row.label || "Unknown";
      const entry = branchEngagementMap.get(key) || { phone: 0, whatsapp: 0, maps: 0 };
      if (row.event_type === "phone_click") entry.phone += 1;
      else if (row.event_type === "whatsapp_click") entry.whatsapp += 1;
      else if (row.event_type === "maps_click") entry.maps += 1;
      branchEngagementMap.set(key, entry);
    }
    // Simplified per-branch counts are collected above; expose top 5 by total.
    const branchEngagement = Array.from(branchEngagementMap.entries())
      .map(([label, counts]) => ({
        label,
        total: counts.phone + counts.whatsapp + counts.maps,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return NextResponse.json({
      traffic: {
        viewsAllTime: viewsAllTime ?? 0,
        viewsToday: viewsToday ?? 0,
        viewsThisWeek: viewsThisWeek ?? 0,
        viewsThisMonth: viewsThisMonth ?? 0,
        uniqueAllTime,
        uniqueToday,
        uniqueWeek,
        uniqueMonth,
        newVisitors,
        returningVisitors,
        dailyTrend,
        weeklyTrend,
        monthlyTrend,
        topPages,
        trafficSources,
      },
      realtime: {
        activeVisitors,
        activeSessions,
        livePages,
        recentActivity,
      },
      chatbot: {
        totalConversations: totalConversations ?? 0,
        uniqueChatUsers,
        knowledgeEntries: knowledgeCount ?? 0,
        pendingQuestions: pendingKnowledge ?? [],
        escalatedConversations: escalatedConversations ?? 0,
        userQuestions: userMessages.length,
        assistantReplies: assistantMessages.length,
        answerRate,
        topTopics,
        conversationTrend,
      },
      content: {
        totalProducts: totalProducts ?? 0,
        publishedProducts: publishedProducts ?? 0,
        inactiveProducts: inactiveProducts ?? 0,
        totalServices: totalServices ?? 0,
        publishedServices: publishedServices ?? 0,
        inactiveServices: inactiveServices ?? 0,
        topProducts,
        topServices,
        whatsappClicks,
        phoneClicks,
      },
      engagement: {
        totalBranches: totalBranches ?? 0,
        branchPageViews,
        phoneClicks,
        whatsappClicks,
        mapsClicks,
        branchEngagement,
      },
    });
  } catch (error) {
    console.error("Analytics GET error:", error);

    return NextResponse.json(
      { error: "Failed to load analytics." },
      { status: 500 }
    );
  }
}
