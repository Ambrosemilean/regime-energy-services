import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import ChatWidget from "@/components/chat/chat-widget";
import AnalyticsTracker from "@/components/analytics/analytics-tracker";
import { FloatingWhatsAppButton } from "@/components/whatsapp-actions";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

// Mobile device optimization: safe-area aware on notched/rounded phones
// (iPhone notch, Android display cutouts, Samsung punch-hole cameras).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#174b83",
};

// Approved brand typography: Manrope for headings, Inter for body text.
const manrope = Manrope({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const base: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
      default: DEFAULT_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      type: "website",
      locale: "en_NG",
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
    },
  };

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
        ...base,
        title: {
          default: settings.meta_title || DEFAULT_TITLE,
          template: `%s | ${SITE_NAME}`,
        },
        description: settings.meta_description || DEFAULT_DESCRIPTION,
      };
    }
  } catch {
    // Fall back to default metadata when settings are unavailable.
  }

  return base;
}

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  // Organization structured data, built only from admin-managed fields.
  let jsonLd: object | null = null;

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

    const { data: company } = await supabase
      .from("company_profile")
      .select(
        "company_name, short_description, description, phone, email, address, logo_url"
      )
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (company) {
      jsonLd = organizationJsonLd(company);
    }

    if (settings && settings.show_chat_assistant === false) {
      showChatAssistant = false;
    }
  } catch {
    // Default to showing the widget when settings are unavailable.
  }

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pt-[104px]">
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        {children}
        <AnalyticsTracker />
        <FloatingWhatsAppButton />
        {showChatAssistant && <ChatWidget />}
      </body>
    </html>
  );
}
