import { createClient } from "@/lib/supabase/server";
import TrackedLink, { TrackedPageLink } from "@/components/analytics/tracked-link";

/**
 * Normalizes a Nigerian phone number to the international digits-only
 * format required by wa.me (e.g. "0803 123 4567" -> "2348031234567",
 * "+2348031234567" -> "2348031234567").
 *
 * Returns null for empty values or numbers that do not look like a valid
 * Nigerian MSISDN (11 local digits starting 0, or 13 international digits
 * starting 234). Numbers in other country formats are passed through only
 * if they are 7-15 digits long, which is the E.164 digit range.
 */
export function normalizeNigerianWhatsAppNumber(
  raw: string | null | undefined
): string | null {
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Local format: 08031234567 / 0803 123 4567 -> 234 + local (drop leading 0)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }

  // International format: 2348031234567
  if (digits.length === 13 && digits.startsWith("234")) {
    return digits;
  }

  // Fallback for non-Nigerian entries already stored internationally
  // (wa.me requires 7-15 digits, E.164 length range).
  if (digits.length >= 7 && digits.length <= 15) {
    return digits;
  }

  return null;
}

/**
 * Fetches the active company WhatsApp number, normalized for wa.me.
 * Performs exactly one company_profile lookup; callers that need several
 * links (order + delivery, etc.) should reuse the returned number via
 * buildWhatsAppLink instead of calling getCompanyWhatsAppLink repeatedly.
 *
 * Returns null when the company has no valid WhatsApp number configured.
 */
async function getCompanyWhatsAppNumber(): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data: company } = await supabase
      .from("company_profile")
      .select("whatsapp")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    return normalizeNigerianWhatsAppNumber(company?.whatsapp ?? null);
  } catch {
    return null;
  }
}

/**
 * Builds a wa.me URL from an already-normalized number, with an optional
 * pre-filled customer enquiry.
 */
function buildWhatsAppLink(
  normalizedNumber: string,
  preFilledMessage?: string
): string {
  return preFilledMessage
    ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(preFilledMessage)}`
    : `https://wa.me/${normalizedNumber}`;
}

/**
 * Builds a wa.me link with a pre-filled customer enquiry.
 * Returns null when the company has no valid WhatsApp number configured.
 */
export async function getCompanyWhatsAppLink(
  preFilledMessage?: string
): Promise<string | null> {
  const normalized = await getCompanyWhatsAppNumber();
  if (!normalized) return null;

  return buildWhatsAppLink(normalized, preFilledMessage);
}

/**
 * Floating WhatsApp action available on every public page.
 * Pre-fills a gas order enquiry so a customer can act immediately
 * without searching around.
 */
export async function FloatingWhatsAppButton() {
  const href = await getCompanyWhatsAppLink(
    "Hello Regime Energy Services, I would like to order gas."
  );

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order gas on WhatsApp"
      className="fixed bottom-[4.75rem] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl shadow-green-900/30 ring-1 ring-white/20 transition-all duration-200 hover:scale-110 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300/50 sm:bottom-[5.25rem] sm:right-5"
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.014-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    </a>
  );
}

const WHATSAPP_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.298.347-.497.116-.198.058-.371-.014-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

/**
 * Quick-action conversion bar: lets a visitor Order Gas, Request Delivery,
 * browse Products, find a Branch or contact support from any page.
 *
 * `current` highlights the action matching the page it is rendered on.
 */
export default async function QuickActions({
  current,
}: {
  current?: "order" | "delivery" | "products" | "branches" | "support";
}) {
  // Single company_profile lookup; the normalized number is reused for
  // both the order and delivery links below.
  const whatsappNumber = await getCompanyWhatsAppNumber();
  if (!whatsappNumber) return null;

  const orderHref = buildWhatsAppLink(
    whatsappNumber,
    "Hello Regime Energy Services, I would like to order gas."
  );

  const deliveryHref = buildWhatsAppLink(
    whatsappNumber,
    "Hello Regime Energy Services, I would like to request a gas delivery.\n\nMy location:\nCylinder size:"
  );

  const base =
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition";
  const active = "ring-2 ring-offset-2";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {orderHref && (
        <TrackedLink
          href={orderHref}
          event="whatsapp_click"
          label="order_gas_quick_action"
          className={`${base} bg-green-600 text-white hover:bg-green-700 ${current === "order" ? active : ""
            }`}
        >
          {WHATSAPP_ICON}
          Order Gas
        </TrackedLink>
      )}

      {deliveryHref && (
        <TrackedLink
          href={deliveryHref}
          event="whatsapp_click"
          label="request_delivery_quick_action"
          className={`${base} bg-blue-700 text-white hover:bg-blue-800 ${current === "delivery" ? active : ""
            }`}
        >
          {WHATSAPP_ICON}
          Request Delivery
        </TrackedLink>
      )}

      <TrackedPageLink
        href="/products"
        event="nav_click"
        label="view_products_quick_action"
        className={`${base} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 ${current === "products" ? active : ""
          }`}
      >
        View Products
      </TrackedPageLink>

      <TrackedPageLink
        href="/branches"
        event="nav_click"
        label="find_branch_quick_action"
        className={`${base} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 ${current === "branches" ? active : ""
          }`}
      >
        Find a Branch
      </TrackedPageLink>

      <TrackedPageLink
        href="/chat"
        event="chatbot_open"
        label="contact_support_quick_action"
        className={`${base} border border-red-600 bg-white text-red-600 hover:bg-red-50 ${current === "support" ? active : ""
          }`}
      >
        Contact Support
      </TrackedPageLink>
    </div>
  );
}
