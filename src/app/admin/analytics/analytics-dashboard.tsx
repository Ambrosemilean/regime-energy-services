"use client";

import { useCallback, useEffect, useState } from "react";

type DailyPoint = { date: string; views: number; visitors: number };
type Bucket = { week?: string; month?: string; views: number };
type NamedCount = { path?: string; source?: string; topic?: string; label?: string; count?: number; views?: number };

type Analytics = {
  traffic: {
    viewsAllTime: number;
    viewsToday: number;
    viewsThisWeek: number;
    viewsThisMonth: number;
    uniqueAllTime: number;
    uniqueToday: number;
    uniqueWeek: number;
    uniqueMonth: number;
    newVisitors: number;
    returningVisitors: number;
    dailyTrend: DailyPoint[];
    weeklyTrend: Bucket[];
    monthlyTrend: Bucket[];
    topPages: NamedCount[];
    trafficSources: NamedCount[];
  };
  realtime: {
    activeVisitors: number;
    activeSessions: number;
    livePages: { path: string; count: number }[];
    recentActivity: {
      path: string;
      created_at: string;
      device: string;
      source: string;
    }[];
  };
  chatbot: {
    totalConversations: number;
    uniqueChatUsers: number;
    knowledgeEntries: number;
    pendingQuestions: { id: string; question: string; times_asked: number }[];
    escalatedConversations: number;
    userQuestions: number;
    assistantReplies: number;
    answerRate: number;
    topTopics: { topic: string; count: number }[];
    conversationTrend: { date: string; count: number }[];
  };
  content: {
    totalProducts: number;
    publishedProducts: number;
    inactiveProducts: number;
    totalServices: number;
    publishedServices: number;
    inactiveServices: number;
    topProducts: { label: string; count: number }[];
    topServices: { label: string; count: number }[];
    whatsappClicks: number;
    phoneClicks: number;
  };
  engagement: {
    totalBranches: number;
    branchPageViews: number;
    phoneClicks: number;
    whatsappClicks: number;
    mapsClicks: number;
    branchEngagement: { label: string; total: number }[];
  };
};

const TABS = [
  { id: "traffic", label: "Traffic" },
  { id: "realtime", label: "Real-Time" },
  { id: "chatbot", label: "Chatbot" },
  { id: "content", label: "Products & Services" },
  { id: "engagement", label: "Branch Engagement" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("traffic");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load analytics.");
      }

      setAnalytics(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    // Auto-refresh every 60s (keeps real-time numbers fresh).
    const interval = setInterval(load, 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="p-10 text-sm text-gray-500">Loading analytics…</div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-10">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error || "Analytics are unavailable right now."}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">
            REGIME ENERGY SERVICES
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Analytics
          </h1>

          <p className="mt-2 text-gray-600">
            Website traffic, live activity, chatbot performance and customer
            engagement — refreshed automatically every minute.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:text-blue-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "traffic" && <TrafficTab data={analytics.traffic} />}
        {tab === "realtime" && <RealtimeTab data={analytics.realtime} />}
        {tab === "chatbot" && <ChatbotTab data={analytics.chatbot} />}
        {tab === "content" && <ContentTab data={analytics.content} />}
        {tab === "engagement" && <EngagementTab data={analytics.engagement} />}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Pure-CSS bar chart (no external chart library needed). */
function BarChart({
  points,
  suffix = "",
}: {
  points: { label: string; value: number }[];
  suffix?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div className="flex h-48 items-end gap-1.5 overflow-x-auto">
      {points.map((point, index) => (
        <div key={`${point.label}-${index}`} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-blue-600/85 transition hover:bg-blue-800"
            style={{ height: `${Math.max((point.value / max) * 100, 2)}%` }}
            title={`${point.label}: ${point.value}${suffix}`}
          />
          {index % Math.ceil(points.length / 10) === 0 && (
            <span className="whitespace-nowrap text-[9px] text-gray-400">
              {point.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Simple SVG line/area chart. */
function LineChart({
  series,
  color = "#1d4ed8",
}: {
  series: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(...series.map((p) => p.value), 1);
  const width = 100;
  const height = 40;

  const path = series
    .map((point, i) => {
      const x = (i / Math.max(series.length - 1, 1)) * width;
      const y = height - (point.value / max) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" preserveAspectRatio="none">
      <path d={area} fill={color} opacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function RankedList({
  items,
  emptyText,
}: {
  items: { name: string; value: number }[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">{emptyText}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-gray-700" title={item.name}>
            {item.name}
          </span>

          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>

          <span className="w-12 shrink-0 text-right text-sm font-semibold text-gray-900">
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Traffic                                                          */
/* ------------------------------------------------------------------ */

function TrafficTab({ data }: { data: Analytics["traffic"] }) {
  const dailyPoints = data.dailyTrend.map((d) => ({
    label: d.date.slice(5),
    value: d.views,
  }));

  const visitorPoints = data.dailyTrend.map((d) => ({
    label: d.date.slice(5),
    value: d.visitors,
  }));

  const weeklyPoints = data.weeklyTrend.map((w) => ({
    label: w.week || "",
    value: w.views,
  }));

  const monthlyPoints = data.monthlyTrend.map((m) => ({
    label: m.month || "",
    value: m.views,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Page Views" value={data.viewsAllTime} hint="All time" />
        <StatCard label="Unique Visitors" value={data.uniqueAllTime} hint="All time" />
        <StatCard label="Views Today" value={data.viewsToday} hint={`${data.uniqueToday} unique visitors`} />
        <StatCard label="Views This Month" value={data.viewsThisMonth} hint={`${data.uniqueMonth} unique visitors`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Daily Page Views (30 days)">
          <BarChart points={dailyPoints} />
        </Panel>

        <Panel title="Daily Unique Visitors (30 days)">
          <LineChart series={visitorPoints} />
        </Panel>

        <Panel title="Weekly Views (12 weeks)">
          <BarChart points={weeklyPoints} />
        </Panel>

        <Panel title="Monthly Views (6 months)">
          <BarChart points={monthlyPoints} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="New vs Returning (30 days)">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New visitors</span>
              <span className="font-bold text-blue-700">{data.newVisitors}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-blue-600"
                style={{
                  width: `${
                    (data.newVisitors / Math.max(data.newVisitors + data.returningVisitors, 1)) * 100
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Returning visitors</span>
              <span className="font-bold text-emerald-600">
                {data.returningVisitors}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Most-Visited Pages">
          <RankedList
            items={data.topPages.map((p) => ({ name: p.path || "", value: p.views ?? 0 }))}
            emptyText="No page data yet."
          />
        </Panel>

        <Panel title="Traffic Sources">
          <RankedList
            items={data.trafficSources.map((s) => ({
              name: (s.source || "direct").replace(/^./, (c) => c.toUpperCase()),
              value: s.count ?? 0,
            }))}
            emptyText="No source data yet."
          />
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Real-time                                                        */
/* ------------------------------------------------------------------ */

function RealtimeTab({ data }: { data: Analytics["realtime"] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Visitors"
          value={data.activeVisitors}
          hint="Seen in the last 5 minutes"
        />
        <StatCard label="Active Sessions" value={data.activeSessions} />
        <StatCard
          label="Pages Being Viewed"
          value={data.livePages.length}
          hint="Distinct pages right now"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pages Being Viewed Right Now">
          <RankedList
            items={data.livePages.map((p) => ({ name: p.path, value: p.count }))}
            emptyText="No one is browsing right now."
          />
        </Panel>

        <Panel title="Recent Visitor Activity (last 24h)">
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recentActivity.map((item, index) => (
                <li key={index} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate font-medium text-gray-800">{item.path}</span>
                  <span className="ml-3 shrink-0 text-xs text-gray-400">
                    {item.device} · {item.source} ·{" "}
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Chatbot                                                          */
/* ------------------------------------------------------------------ */

function ChatbotTab({ data }: { data: Analytics["chatbot"] }) {
  const trendPoints = data.conversationTrend.map((d) => ({
    label: d.date.slice(5),
    value: d.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Conversations" value={data.totalConversations} hint="All time" />
        <StatCard label="Visitors Using Chatbot" value={data.uniqueChatUsers} hint="Distinct sessions" />
        <StatCard label="Answer Success Rate" value={`${data.answerRate}%`} hint={`${data.assistantReplies} answers given`} />
        <StatCard
          label="Escalated to Support"
          value={data.escalatedConversations}
          hint="WhatsApp / customer service"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Conversation Trend (30 days)">
          <LineChart series={trendPoints} color="#0f766e" />
        </Panel>

        <Panel title="Most Frequent Topics">
          <RankedList
            items={data.topTopics.map((t) => ({ name: t.topic, value: t.count }))}
            emptyText="No questions asked yet."
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Unanswered Questions Awaiting Review (${data.pendingQuestions.length})`}>
          {data.pendingQuestions.length === 0 ? (
            <p className="text-sm text-gray-400">
              No pending questions — everything asked so far has an answer.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.pendingQuestions.map((q) => (
                <li key={q.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate text-gray-800">{q.question}</span>
                  <span className="ml-3 shrink-0 text-xs font-semibold text-amber-600">
                    ×{q.times_asked}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Knowledge Base">
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <span className="font-bold text-gray-900">{data.knowledgeEntries}</span> entries
              in the assistant&apos;s knowledge base.
            </p>
            <p>
              <span className="font-bold text-gray-900">{data.userQuestions}</span> visitor
              questions received.
            </p>
            <p>
              Manage answers in{" "}
              <a href="/admin/chat" className="font-medium text-blue-600 hover:text-blue-800">
                Chat Assistant →
              </a>
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Products & Services                                              */
/* ------------------------------------------------------------------ */

function ContentTab({ data }: { data: Analytics["content"] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={data.totalProducts}
          hint={`${data.publishedProducts} published · ${data.inactiveProducts} inactive`}
        />
        <StatCard
          label="Total Services"
          value={data.totalServices}
          hint={`${data.publishedServices} published · ${data.inactiveServices} inactive`}
        />
        <StatCard label="WhatsApp Clicks (30d)" value={data.whatsappClicks} />
        <StatCard label="Phone Clicks (30d)" value={data.phoneClicks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Most-Viewed Products (30 days)">
          <RankedList
            items={data.topProducts.map((p) => ({ name: p.label, value: p.count }))}
            emptyText="No product view data yet."
          />
        </Panel>

        <Panel title="Most-Viewed Services (30 days)">
          <RankedList
            items={data.topServices.map((s) => ({ name: s.label, value: s.count }))}
            emptyText="No service view data yet."
          />
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Branch & customer engagement                                     */
/* ------------------------------------------------------------------ */

function EngagementTab({ data }: { data: Analytics["engagement"] }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Branches Listed" value={data.totalBranches} />
        <StatCard label="Branch Page Views (30d)" value={data.branchPageViews} />
        <StatCard label="Phone Clicks (30d)" value={data.phoneClicks} />
        <StatCard label="WhatsApp Clicks (30d)" value={data.whatsappClicks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Google Maps Direction Clicks (30 days): ${data.mapsClicks}`}>
          <RankedList
            items={data.branchEngagement.map((b) => ({ name: b.label, value: b.total }))}
            emptyText="No branch engagement data yet."
          />
        </Panel>

        <Panel title="How to Collect More Data">
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>
              Phone, WhatsApp and Maps clicks are recorded automatically when
              visitors tap those links.
            </li>
            <li>
              Track a click anywhere with{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                trackEvent(&quot;maps_click&quot;, &quot;Branch name&quot;)
              </code>
              .
            </li>
            <li>
              Contact-form submissions can be added as{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                contact_form
              </code>{" "}
              events.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
