"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { looksLikePhone } from "@/lib/phone";
export default function AdminLoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setLoading(true);

    const supabase = createClient();

    // The login field accepts an email address or a phone number.
    // Phone numbers are resolved to the admin's auth email server-side
    // (only for active admins), then signed in with the password.
    let email = identifier.trim().toLowerCase();

    if (looksLikePhone(identifier)) {
      try {
        const lookupResponse = await fetch("/api/admin/login/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });

        const lookupResult = await lookupResponse.json().catch(() => ({}));

        if (!lookupResponse.ok || !lookupResult.email) {
          setErrorMessage(
            lookupResult.error || "Invalid login credentials."
          );
          setLoading(false);
          return;
        }

        email = lookupResult.email;
      } catch {
        setErrorMessage("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage("Invalid email or password.");
      setLoading(false);
      return;
    }

    // The account may be authenticated but deactivated — check the
    // profile's is_active flag and reject the session immediately.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.is_active) {
        await supabase.auth.signOut();
        setErrorMessage("This account has been deactivated.");
        setLoading(false);
        return;
      }
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Regime Energy Services
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Administrator Login
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email or Phone
            </label>

            <input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Enter your email or phone number"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Enter your password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}