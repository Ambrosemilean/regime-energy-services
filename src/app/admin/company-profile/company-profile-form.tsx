"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
type CompanyProfile = {
  id: string;
  company_name: string;
  tagline: string | null;
  short_description: string | null;
  full_description: string | null;
  mission: string | null;
  vision: string | null;
  core_values: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  logo_url: string | null;
  main_image_url: string | null;
  is_active: boolean;
};
export default function CompanyProfileForm({
  profile,
}: {
  profile: CompanyProfile | null;
}) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(
    profile?.company_name || ""
  );
  const [tagline, setTagline] = useState(profile?.tagline || "");
  const [shortDescription, setShortDescription] = useState(
    profile?.short_description || ""
  );
  const [fullDescription, setFullDescription] = useState(
    profile?.full_description || ""
  );
  const [mission, setMission] = useState(profile?.mission || "");
  const [vision, setVision] = useState(profile?.vision || "");
  const [coreValues, setCoreValues] = useState(
    profile?.core_values || ""
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(profile?.logo_url || "");

  const [mainImageUrl, setMainImageUrl] = useState(
    profile?.main_image_url || ""
  );
  const [isActive, setIsActive] = useState(
    profile?.is_active ?? true
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function uploadCompanyLogo(): Promise<string> {
    if (!logoFile) {
      return logoUrl;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(logoFile.type)) {
      throw new Error("Please select a PNG, JPG, or WebP image.");
    }

    if (logoFile.size > 2 * 1024 * 1024) {
      throw new Error("The logo must be 2 MB or smaller.");
    }

    const extension = logoFile.name.split(".").pop()?.toLowerCase();

    if (!extension || !["png", "jpg", "jpeg", "webp"].includes(extension)) {
      throw new Error("The logo file extension is not supported.");
    }

    const supabase = createClient();
    const filePath = `company-logo-${Date.now()}.${extension}`;

    const { data, error } = await supabase.storage
      .from("company-logo")
      .upload(filePath, logoFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: logoFile.type,
      });

    if (error) {
      throw new Error(`Logo upload failed: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from("company-logo")
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const savedLogoUrl = await uploadCompanyLogo();

      const response = await fetch(
        "/api/admin/company-profile",
        {
          method: profile ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: companyName,
            tagline,
            short_description: shortDescription,
            full_description: fullDescription,
            mission,
            vision,
            core_values: coreValues,
            phone,
            email,
            whatsapp,
            address,
            logo_url: savedLogoUrl,
            main_image_url: mainImageUrl,
            is_active: isActive,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save company profile."
        );
      }
      setLogoUrl(savedLogoUrl);
      setLogoFile(null);
      setSuccess("Company profile saved successfully.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Basic Information
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Main information about Regime Energy Services.
        </p>
        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="company_name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Company Name \*
            </label>
            <input
              id="company_name"
              type="text"
              value={companyName}
              onChange={(event) =>
                setCompanyName(event.target.value)
              }
              required
              placeholder="Regime Energy Services Limited"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="tagline"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Tagline
            </label>
            <input
              id="tagline"
              type="text"
              value={tagline}
              onChange={(event) =>
                setTagline(event.target.value)
              }
              placeholder="Your trusted LPG partner"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="short_description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Short Description
            </label>
            <textarea
              id="short_description"
              value={shortDescription}
              onChange={(event) =>
                setShortDescription(event.target.value)
              }
              rows={4}
              placeholder="A short description of Regime Energy Services..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="full_description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Full Company Description
            </label>
            <textarea
              id="full_description"
              value={fullDescription}
              onChange={(event) =>
                setFullDescription(event.target.value)
              }
              rows={7}
              placeholder="Write the complete company description..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
      {/* Mission, Vision & Values */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Mission, Vision & Core Values
        </h2>
        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="mission"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Mission
            </label>
            <textarea
              id="mission"
              value={mission}
              onChange={(event) =>
                setMission(event.target.value)
              }
              rows={5}
              placeholder="Enter the company's mission..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="vision"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Vision
            </label>
            <textarea
              id="vision"
              value={vision}
              onChange={(event) =>
                setVision(event.target.value)
              }
              rows={5}
              placeholder="Enter the company's vision..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="core_values"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Core Values
            </label>
            <textarea
              id="core_values"
              value={coreValues}
              onChange={(event) =>
                setCoreValues(event.target.value)
              }
              rows={6}
              placeholder="Enter the company's core values..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
      {/* Contact Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Contact Information
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone
            </label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="080..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="whatsapp"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              WhatsApp
            </label>
            <input
              id="whatsapp"
              type="text"
              value={whatsapp}
              onChange={(event) =>
                setWhatsapp(event.target.value)
              }
              placeholder="234..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="info@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              placeholder="Company address"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
      {/* Media */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Company Media
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          For now, these fields accept image URLs. We can connect them
          to Supabase Storage later.
        </p>
        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="logo_file"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Company Logo
            </label>

            {logoPreview && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">Logo preview</p>
                <div className="flex h-32 w-48 items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                  <img
                    src={logoPreview}
                    alt="Company logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            <input
              id="logo_file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                  setError("The logo must be 2 MB or smaller.");
                  event.target.value = "";
                  return;
                }

                setError("");
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
            />

            <p className="mt-2 text-xs text-gray-500">
              PNG, JPG, or WebP. Maximum file size: 2 MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="main_image_url"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Main Company Image URL
            </label>
            <input
              id="main_image_url"
              type="url"
              value={mainImageUrl}
              onChange={(event) =>
                setMainImageUrl(event.target.value)
              }
              placeholder="https\://..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>
      {/* Status */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Website Status
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Control whether this company profile is active on the
              website.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(event.target.checked)
              }
              className="h-5 w-5 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Active
            </span>
          </label>
        </div>
      </div>
      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}
      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Company Profile"}
        </button>
      </div>
    </form>
  );
}