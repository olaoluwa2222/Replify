"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // STEP A: Call backend API to create auth user + seller record
      const apiResponse = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          business_name: businessName,
          whatsapp_number: whatsappNumber,
        }),
      });

      const apiData = await apiResponse.json();

      if (!apiResponse.ok || apiData.error) {
        throw new Error(apiData.error || "Registration failed");
      }

      // STEP B: Sign in user using browser client
      // Create browser client with anon key
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // STEP C: Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{ background: "#080808" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        input {
          transition: all 0.2s ease;
        }

        input:focus {
          outline: none;
          border-color: #E8A045 !important;
          box-shadow: 0 0 0 1px rgba(232, 160, 69, 0.15);
        }
      `}</style>

      <div
        className="w-full max-w-sm rounded-lg border p-8"
        style={{
          background: "#111111",
          borderColor: "#1a1a1a",
        }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <p
            className="text-3xl font-bold"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "#E8A045",
            }}
          >
            Replify
          </p>
        </div>

        {/* Heading */}
        <h1
          className="mb-6 text-center text-2xl font-bold"
          style={{
            fontFamily: "'Sora', sans-serif",
            color: "#F5F5F5",
          }}
        >
          Create your account
        </h1>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Business Name Input */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "#888888" }}
            >
              Business Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
              className="w-full rounded border px-4 py-2.5 text-sm"
              style={{
                background: "#1a1a1a",
                borderColor: "#1a1a1a",
                color: "#F5F5F5",
              }}
            />
          </div>

          {/* Email Input */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "#888888" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border px-4 py-2.5 text-sm"
              style={{
                background: "#1a1a1a",
                borderColor: "#1a1a1a",
                color: "#F5F5F5",
              }}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "#888888" }}
            >
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded border px-4 py-2.5 text-sm"
              style={{
                background: "#1a1a1a",
                borderColor: "#1a1a1a",
                color: "#F5F5F5",
              }}
            />
          </div>

          {/* WhatsApp Number Input */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "#888888" }}
            >
              WhatsApp Number
            </label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="2348012345678 (include country code)"
              className="w-full rounded border px-4 py-2.5 text-sm"
              style={{
                background: "#1a1a1a",
                borderColor: "#1a1a1a",
                color: "#F5F5F5",
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="rounded border p-3 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                borderColor: "#EF4444",
                color: "#EF4444",
              }}
            >
              {error}
            </div>
          )}

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 font-semibold transition-all"
            style={{
              background: "#E8A045",
              color: "#080808",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm" style={{ color: "#888888" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold transition-colors hover:text-white"
            style={{ color: "#E8A045" }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
