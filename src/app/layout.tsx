import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import ChatWidget from "@/components/chat/chat-widget";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
