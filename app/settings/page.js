"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

let SELLER_ID = null;

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState(null);

  // Business Info
  const [businessName, setBusinessName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Bank Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Delivery Settings
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryZones, setDeliveryZones] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser(authUser);
      SELLER_ID = authUser.id;
    }

    checkUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function fetchSellerData() {
    if (!SELLER_ID) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", SELLER_ID)
        .single();

      if (error) throw error;

      if (data) {
        setBusinessName(data.business_name || "");
        setWhatsappNumber(data.whatsapp_number || "");
        setBankName(data.bank_name || "");
        setAccountNumber(data.bank_account_number || "");
        setAccountName(data.bank_account_name || "");
        setDeliveryFee(data.delivery_fee || "");
        setDeliveryZones(
          Array.isArray(data.delivery_zones)
            ? data.delivery_zones.join("\n")
            : data.delivery_zones || "",
        );
      }
    } catch (error) {
      console.error("Error fetching seller data:", error);
      setToast("Error loading settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);

    try {
      const zones = deliveryZones
        .split("\n")
        .map((zone) => zone.trim())
        .filter(Boolean);

      const { error } = await supabase.from("sellers").upsert(
        {
          id: SELLER_ID,
          business_name: businessName,
          whatsapp_number: whatsappNumber,
          bank_name: bankName,
          bank_account_number: accountNumber,
          bank_account_name: accountName,
          delivery_fee: deliveryFee ? parseFloat(deliveryFee) : null,
          delivery_zones: zones,
        },
        { onConflict: "id" },
      );

      if (error) throw error;

      setToast("Settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      setToast("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --bg-base: #080808;
          --bg-surface: #0F0F0F;
          --bg-elevated: #111111;
          --bg-hover: #1C1C1C;
          --border: #1a1a1a;
          --border-subtle: #1A1A1A;
          --gold: #E8A045;
          --gold-bright: #F5B84C;
          --gold-muted: #C4863A;
          --gold-glow: rgba(232, 160, 69, 0.15);
          --gold-subtle: rgba(232, 160, 69, 0.08);
          --text-primary: #F5F5F5;
          --text-secondary: #888888;
          --text-muted: #555555;
          --green: #22C55E;
          --amber: #F59E0B;
          --blue: #3B82F6;
          --purple: #A855F7;
          --red: #EF4444;
        }

        input, textarea {
          transition: all 0.2s ease;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: var(--gold) !important;
          box-shadow: 0 0 0 1px var(--gold-subtle);
        }

        @keyframes pulseAmber {
          0%,100% { opacity:1; transform: scale(1); }
          50% { opacity:0.5; transform: scale(0.85); }
        }

        .ai-active-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E;
          animation: pulseAmber 2s ease infinite;
          display: inline-block;
          margin-right: 8px;
        }
      `}</style>

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 hidden w-65 flex-col border-r lg:flex"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="px-5 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: "#080808",
                background:
                  "linear-gradient(135deg, var(--gold-bright), var(--gold-muted))",
              }}
            >
              R
            </div>
            <div>
              <p
                className="text-[19px] font-bold leading-none"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                Replify
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Order Manager
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-2 px-4 py-4">
          <Link
            href="/dashboard"
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-(--bg-elevated) hover:text-(--text-primary)"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>📦</span>
            <span>Orders</span>
          </Link>
          <Link
            href="/catalog"
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-(--bg-elevated) hover:text-(--text-primary)"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>🛍️</span>
            <span>Catalog</span>
          </Link>
          <Link
            href="/settings"
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium"
            style={{
              background: "var(--gold-subtle)",
              color: "var(--gold)",
              borderLeft: "2px solid var(--gold)",
            }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="mt-auto p-4">
          <div
            className="inline-flex items-center rounded-full px-3 py-1.5"
            style={{
              border: "1px solid #1F2F1F",
              background: "rgba(34,197,94,0.06)",
            }}
          >
            <span className="ai-active-dot" />
            <span
              className="text-[11px] font-medium"
              style={{ color: "var(--green)" }}
            >
              AI Active
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="px-4 pb-6 pt-5 lg:ml-65 lg:px-8 lg:pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "var(--text-primary)",
            }}
          >
            Settings
          </h1>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="mt-1 text-sm"
          >
            Manage your business information and preferences
          </p>
        </div>

        {/* Form Container */}
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSaveSettings}>
            {/* SECTION 1: Business Info */}
            <section
              className="mb-8 rounded-lg border p-6"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <h2
                className="mb-4 text-lg font-semibold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: "var(--gold)",
                }}
              >
                Business Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 2348012345678"
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: Bank Details */}
            <section
              className="mb-8 rounded-lg border p-6"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <h2
                className="mb-4 text-lg font-semibold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: "var(--gold)",
                }}
              >
                Bank Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. GTBank"
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Your account number"
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Name on bank account"
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: Delivery Settings */}
            <section
              className="mb-8 rounded-lg border p-6"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <h2
                className="mb-4 text-lg font-semibold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: "var(--gold)",
                }}
              >
                Delivery Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Delivery Fee (₦)
                  </label>
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Delivery Zones
                  </label>
                  <p
                    className="mb-2 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Enter one zone per line (e.g. Lekki, Ajah, VI)
                  </p>
                  <textarea
                    value={deliveryZones}
                    onChange={(e) => setDeliveryZones(e.target.value)}
                    placeholder="Lekki&#10;Ajah&#10;VI"
                    rows={5}
                    className="w-full rounded border px-4 py-2.5 text-sm"
                    style={{
                      background: "#1a1a1a",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || loading}
                className="flex-1 rounded-lg border px-6 py-3 font-medium transition-all"
                style={{
                  background: "var(--gold)",
                  color: "#080808",
                  borderColor: "var(--gold)",
                  opacity: saving || loading ? 0.6 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="w-full rounded-lg px-6 py-3 font-medium transition-all"
              style={{
                background: "#dc2626",
                color: "white",
                borderColor: "#dc2626",
              }}
            >
              Logout
            </button>
          </form>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-6 right-6 max-w-sm rounded-lg border px-4 py-3 text-sm font-medium"
          style={{
            background: "var(--bg-surface)",
            borderColor: toast.includes("Error")
              ? "var(--red)"
              : "var(--green)",
            color: toast.includes("Error") ? "var(--red)" : "var(--green)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
