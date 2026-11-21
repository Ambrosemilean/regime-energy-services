import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteHeader, {
  getActiveCompanyProfile,
} from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import ContactForm from "@/components/contact-form";
import TrackedLink from "@/components/analytics/tracked-link";
import { getCompanyWhatsAppLink } from "@/components/whatsapp-actions";

export const metadata: Metadata = {
  title: "Contact Us | Regime Energy Services",
  description:
    "Reach Regime Energy Services for LPG supply, gas delivery, weighbridge services and enquiries. Call, WhatsApp or send us a message.",
};

/**
 * Contact page — company contact details plus the same inquiry form used in
 * the footer (stored in Supabase and emailed via /api/contact).
 */
export default async function ContactPage() {
  const cachedCompany = await getActiveCompanyProfile();
  const supabase = await createClient();

  const [{ data: branches }, whatsappHref] = await Promise.all([
    supabase
      .from("branches")
      .select("id, name, slug, address, phone, email, whatsapp")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    getCompanyWhatsAppLink(
      "Hello Regime Energy Services, I have an enquiry."
    ),
  ]);

  const branchList = branches ?? [];
  const phoneDisplay = cachedCompany?.phone || "08021295401";
  const callHref = cachedCompany?.phone ? `tel:${cachedCompany.phone}` : "tel:08021295401";

  // Alternating quick-contact card backgrounds (blue / sky / grey).
  const BRANCH_QUICK_ROTATION = [
    "bg-card-blue border-[#d4e4f7]",
    "bg-card-sky border-[#cfeaf3]",
    "bg-card-grey border-[#e4e9f0]",
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader currentPath="/contact" />

      <main className="flex-1">
        {/* Page heading */}
        <section className="bg-regime-blue-dark px-4 py-14 text-white sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <span className="regime-accent-chip bg-white/95">Contact Us</span>

            <h1 className="mt-5 text-3xl font-bold sm:text-5xl">
              Let&apos;s Talk About Your Energy Needs
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
              Whether it is an LPG refill, a bulk supply question, weighbridge
              services or a general enquiry, our team is ready to help. We
              reply fastest on WhatsApp.
            </p>
          </div>
        </section>

        {/* Contact details + form */}
        <section className="px-4 py-12 sm:px-6 md:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-2">
              {/* Details */}
              <div>
                <p className="regime-eyebrow">Get In Touch</p>

                <h2 className="regime-heading text-3xl sm:text-4xl">
                  Contact Details
                </h2>

                <p className="regime-lead mt-4">
                  Reach us directly by phone, WhatsApp or email, or visit any
                  of our branches in Owerri.
                </p>

                <dl className="mt-8 space-y-6">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      Phone
                    </dt>

                    <dd>
                      <a
                        href={callHref}
                        className="mt-1 block font-semibold text-regime-blue hover:underline"
                      >
                        {phoneDisplay}
                      </a>
                    </dd>
                  </div>

                  {cachedCompany?.email && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Email
                      </dt>

                      <dd>
                        <a
                          href={`mailto:${cachedCompany.email}`}
                          className="mt-1 block break-all font-semibold text-regime-blue hover:underline"
                        >
                          {cachedCompany.email}
                        </a>
                      </dd>
                    </div>
                  )}

                  {cachedCompany?.address && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Head Office
                      </dt>

                      <dd className="mt-1 font-semibold leading-6 text-gray-900">
                        {cachedCompany.address}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                  {whatsappHref && (
                    <TrackedLink
                      href={whatsappHref}
                      event="whatsapp_click"
                      label="contact_page_whatsapp"
                      className="regime-button-primary"
                    >
                      Chat on WhatsApp
                    </TrackedLink>
                  )}

                  <TrackedLink
                    href={callHref}
                    event="phone_click"
                    label="contact_page_call"
                    target=""
                    className="regime-button-secondary"
                  >
                    Call {phoneDisplay}
                  </TrackedLink>
                </div>

                {/* Branch quick contacts */}
                {branchList.length > 0 && (
                  <div className="mt-10">
                    <h3 className="font-bold text-gray-900">
                      Branch Contacts
                    </h3>

                    <div className="mt-4 space-y-4">
                      {branchList.map((branch, index) => (
                        <div
                          key={branch.id}
                          className={`${BRANCH_QUICK_ROTATION[index % BRANCH_QUICK_ROTATION.length]} rounded-xl border p-4`}
                        >
                          <p className="font-bold text-gray-900">
                            {branch.name}
                          </p>

                          {branch.address && (
                            <p className="mt-1 text-sm text-gray-600">
                              {branch.address}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap gap-4 text-sm">
                            {branch.phone && (
                              <a
                                href={`tel:${branch.phone}`}
                                className="font-semibold text-regime-blue hover:underline"
                              >
                                {branch.phone}
                              </a>
                            )}

                            {branch.email && (
                              <a
                                href={`mailto:${branch.email}`}
                                className="break-all font-semibold text-regime-blue hover:underline"
                              >
                                {branch.email}
                              </a>
                            )}

                            <Link
                              href={`/branches/${branch.slug}`}
                              className="font-semibold text-gray-500 hover:underline"
                            >
                              Branch details →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Inquiry form */}
              <div className="rounded-2xl bg-regime-blue-dark p-8 md:p-10">
                <ContactForm />

                <p className="mt-6 text-xs leading-6 text-blue-200">
                  By sending a message you agree that we may contact you about
                  your inquiry. We never share your details with third
                  parties.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
