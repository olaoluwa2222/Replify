"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --bg-base: #080808;
          --bg-surface: #0F0F0F;
          --bg-elevated: #111111;
          --border: #1a1a1a;
          --gold: #E8A045;
          --gold-bright: #F5B84C;
          --gold-muted: #C4863A;
          --text-primary: #F5F5F5;
          --text-secondary: #888888;
          --red: #EF4444;
        }

        input {
          transition: all 0.2s ease;
        }

        input:focus {
          outline: none;
          border-color: var(--gold) !important;
          box-shadow: 0 0 0 1px rgba(232, 160, 69, 0.15);
        }
      `}</style>

      <div
        className="w-full max-w-sm rounded-lg border p-8"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <p
            className="text-3xl font-bold"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "var(--gold)",
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
            color: "var(--text-primary)",
          }}
        >
          Welcome back
        </h1>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
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
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
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
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="rounded border p-3 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                borderColor: "var(--red)",
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2.5 font-semibold transition-all"
            style={{
              background: "var(--gold)",
              color: "#080808",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Sign Up Link */}
        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-semibold transition-colors hover:text-white"
            style={{ color: "var(--gold)" }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
