import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import ChatWidget from "@/components/chat/chat-widget";
import AnalyticsTracker from "@/components/analytics/analytics-tracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("meta_title, meta_description")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (settings?.meta_title || settings?.meta_description) {
      return {
        title: settings.meta_title || undefined,
        description: settings.meta_description || undefined,
      };
    }
  } catch {
    // Fall back to default metadata when settings are unavailable.
  }

  return {
    title: "Regime Energy Services — Reliable LPG Solutions",
    description:
      "Safe, reliable and efficient LPG supply, distribution, delivery and related energy services.",
  };
}

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  // The admin can hide the public chat assistant via Site Settings.
  let showChatAssistant = true;

  try {
    const supabase = await createClient();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("show_chat_assistant")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (settings && settings.show_chat_assistant === false) {
      showChatAssistant = false;
    }
  } catch {
    // Default to showing the widget when settings are unavailable.
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <AnalyticsTracker />
        {showChatAssistant && <ChatWidget />}
      </body>
    </html>
  );
}
