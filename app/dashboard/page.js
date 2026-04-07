"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const SELLER_ID = "211147d4-04f7-4608-a1d4-415087dae4cc";

function getInitials(name) {
  if (!name) return "CU";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function timeAgo(dateString) {
  if (!dateString) return "just now";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (Number.isNaN(seconds) || seconds < 0) return "just now";
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function getPaymentConfig(status) {
  if (status === "confirmed") {
    return {
      label: "Confirmed",
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.25)",
      color: "#22C55E",
      dot: false,
    };
  }

  if (status === "payment_claimed") {
    return {
      label: "Payment Claimed",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)",
      color: "#F59E0B",
      dot: true,
    };
  }

  return {
    label: "Pending",
    bg: "transparent",
    border: "#333333",
    color: "var(--text-muted)",
    dot: false,
  };
}

function getStatusConfig(status) {
  const styles = {
    new: {
      bg: "rgba(59,130,246,0.12)",
      border: "rgba(59,130,246,0.25)",
      color: "#3B82F6",
    },
    processing: {
      bg: "rgba(168,85,247,0.12)",
      border: "rgba(168,85,247,0.25)",
      color: "#A855F7",
    },
    shipped: {
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)",
      color: "#F59E0B",
    },
    delivered: {
      bg: "rgba(34,197,94,0.1)",
      border: "rgba(34,197,94,0.25)",
      color: "#22C55E",
    },
  };

  return styles[status] || styles.new;
}

function StatCard({ title, value, tone = "default", className = "" }) {
  const valueStyle =
    tone === "amber"
      ? { color: "var(--amber)" }
      : tone === "green"
        ? { color: "var(--green)" }
        : tone === "gold"
          ? {
              backgroundImage:
                "linear-gradient(135deg, var(--gold-bright), var(--gold-muted))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }
          : { color: "var(--text-primary)" };

  return (
    <div
      className={`animate-fadeUp group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.015] ${className}`}
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-elevated)",
      }}
    >
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, rgba(232,160,69,0), var(--gold-bright), rgba(232,160,69,0))",
        }}
      />

      <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
        {title}
      </p>
      <p
        className="mt-2 text-[40px] font-bold leading-none"
        style={{
          fontFamily: "'Sora', sans-serif",
          ...valueStyle,
        }}
      >
        {value}
      </p>
      <p className="mt-3 text-xs font-medium" style={{ color: "var(--green)" }}>
        ▲ 12% vs yesterday
      </p>

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          boxShadow: "0 0 0 1px var(--gold-glow), 0 0 20px var(--gold-subtle)",
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", SELLER_ID)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const needsAttention = orders.filter(
      (order) => order.payment_status === "payment_claimed",
    ).length;
    const confirmedToday = orders.filter(
      (order) => order.payment_status === "confirmed",
    ).length;
    const revenue = orders
      .filter((order) => order.payment_status === "confirmed")
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return { totalOrders, needsAttention, confirmedToday, revenue };
  }, [orders]);

  async function handleConfirmPayment(order) {
    if (confirmingOrderId) return;

    const previousOrders = orders;
    setConfirmingOrderId(order.id);

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              payment_status: "confirmed",
              order_status: "processing",
            }
          : item,
      ),
    );

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "confirmed", order_status: "processing" })
      .eq("id", order.id);

    if (error) {
      console.error("Error confirming payment:", error);
      setOrders(previousOrders);
    }

    setConfirmingOrderId(null);
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
          --bg-elevated: #161616;
          --bg-hover: #1C1C1C;
          --border: #242424;
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

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseAmber {
          0%,100% { opacity:1; transform: scale(1); }
          50% { opacity:0.5; transform: scale(0.85); }
        }
        @keyframes goldGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(232,160,69,0); }
          50% { box-shadow: 0 0 12px 2px rgba(232,160,69,0.2); }
        }
        @keyframes shimmerSlide {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-enter { animation: modalIn 0.2s ease both; }

        .animate-fadeUp { animation: fadeUp 0.5s ease both; }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        .stagger-5 { animation-delay: 0.25s; }

        .pulse-amber {
          width: 6px; height: 6px; border-radius: 50%;
          background: #F59E0B;
          animation: pulseAmber 1.4s ease infinite;
          display: inline-block;
          margin-right: 6px;
        }

        .ai-active-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E;
          animation: pulseAmber 2s ease infinite;
          display: inline-block;
          margin-right: 8px;
        }
      `}</style>

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
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium"
            style={{
              background: "var(--gold-subtle)",
              color: "var(--gold)",
              borderLeft: "2px solid var(--gold)",
            }}
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
          <a
            href="#"
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-(--bg-elevated) hover:text-(--text-primary)"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </a>
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

      <main className="px-4 pb-6 pt-5 lg:ml-65 lg:px-8 lg:pt-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1
            className="text-[28px] font-bold leading-tight"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: "var(--text-primary)",
            }}
          >
            Good morning ☀️
          </h1>

          <div className="flex items-center gap-3">
            <div
              className="relative flex h-10 items-center rounded-lg border px-3"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
              }}
            >
              <span
                className="mr-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                🔎
              </span>
              <input
                placeholder="Search orders"
                className="w-44 bg-transparent text-sm outline-none placeholder:text-(--text-muted) sm:w-56"
              />
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border text-sm transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
              }}
            >
              🔔
            </button>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className={`animate-pulse rounded-2xl border p-5 ${index < 4 ? `stagger-${index + 1}` : ""}`}
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  <div className="h-3 w-24 rounded bg-[#262626]" />
                  <div className="mt-3 h-10 w-20 rounded bg-[#2E2E2E]" />
                  <div className="mt-4 h-3 w-28 rounded bg-[#232323]" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Orders"
                value={String(stats.totalOrders)}
                className="stagger-1"
              />
              <StatCard
                title="Needs Attention"
                value={String(stats.needsAttention)}
                tone="amber"
                className="stagger-2"
              />
              <StatCard
                title="Confirmed"
                value={String(stats.confirmedToday)}
                tone="green"
                className="stagger-3"
              />
              <StatCard
                title="Revenue"
                value={formatNaira(stats.revenue)}
                tone="gold"
                className="stagger-4"
              />
            </>
          )}
        </div>

        <section
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <h2
              className="text-lg font-semibold"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: "var(--text-primary)",
              }}
            >
              Recent Orders
            </h2>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
              }}
            >
              {orders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-270 w-full">
              <thead
                className="text-left text-[11px] uppercase"
                style={{
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                }}
              >
                <tr>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                  <th className="px-5 py-3 font-medium">Qty</th>
                  <th className="px-5 py-3 font-medium">Address</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <tr
                        key={`skeleton-${index}`}
                        className={`h-16 animate-pulse ${`stagger-${Math.min(index + 1, 5)}`}`}
                        style={{ borderTop: "1px solid var(--border-subtle)" }}
                      >
                        <td className="px-5 py-2" colSpan={9}>
                          <div className="h-6 w-full rounded bg-[#1f1f1f]" />
                        </td>
                      </tr>
                    ))
                  : orders.map((order, index) => {
                      const payment = getPaymentConfig(order.payment_status);
                      const status = getStatusConfig(order.order_status);
                      const staggerClass = `stagger-${Math.min(index + 1, 5)}`;

                      return (
                        <tr
                          key={order.id}
                          className={`animate-fadeUp h-16 cursor-pointer transition-colors hover:bg-(--bg-hover) ${staggerClass}`}
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                          }}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="px-5 py-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-8.5 w-8.5 items-center justify-center rounded-full text-[11px] font-bold"
                                style={{
                                  color: "#080808",
                                  background:
                                    "linear-gradient(135deg, var(--gold-bright), var(--gold-muted))",
                                }}
                              >
                                {getInitials(order.customer_name || "Customer")}
                              </div>
                              <div>
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {order.customer_name || "Customer"}
                                </p>
                                <p
                                  className="text-[10px]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {timeAgo(order.created_at)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td
                            className="px-5 py-2 text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {order.product_name || "—"}
                          </td>
                          <td
                            className="px-5 py-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {order.size || "—"}
                          </td>
                          <td
                            className="px-5 py-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {order.quantity || 1}
                          </td>
                          <td
                            className="max-w-55 truncate px-5 py-2 text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {order.delivery_address || "—"}
                          </td>
                          <td
                            className="px-5 py-2 text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatNaira(order.total_amount || 0)}
                          </td>

                          <td className="px-5 py-2">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                background: payment.bg,
                                color: payment.color,
                                border: `1px solid ${payment.border}`,
                              }}
                            >
                              {payment.dot ? (
                                <span className="pulse-amber" />
                              ) : null}
                              {payment.label}
                            </span>
                          </td>

                          <td className="px-5 py-2">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize"
                              style={{
                                background: status.bg,
                                color: status.color,
                                border: `1px solid ${status.border}`,
                              }}
                            >
                              {order.order_status || "new"}
                            </span>
                          </td>

                          <td className="px-5 py-2">
                            {order.payment_status === "payment_claimed" ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleConfirmPayment(order);
                                }}
                                disabled={confirmingOrderId === order.id}
                                className="rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_16px_rgba(232,160,69,0.4)] disabled:opacity-60"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #E8A045, #C4863A)",
                                  color: "#080808",
                                }}
                              >
                                {confirmingOrderId === order.id
                                  ? "Confirming..."
                                  : "Confirm Payment"}
                              </button>
                            ) : (
                              <span
                                className="text-[11px]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="modal-enter relative w-full max-w-120 rounded-2xl border p-8"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute right-4 top-4 rounded-md px-2 py-1 text-sm transition-colors hover:bg-(--bg-elevated)"
              style={{ color: "var(--text-secondary)" }}
            >
              ✕
            </button>

            <div className="mb-5">
              <h3
                className="text-2xl font-bold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                Order Details
              </h3>
              <p
                className="mt-1 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {timeAgo(selectedOrder.created_at)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Customer Name
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {selectedOrder.customer_name || "Customer"}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Phone Number
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {selectedOrder.customer_phone ||
                    selectedOrder.customer_whatsapp ||
                    "—"}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Product
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {selectedOrder.product_name || "—"}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Size
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {selectedOrder.size || "—"}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Quantity
                </p>
                <p style={{ color: "var(--text-primary)" }}>
                  {selectedOrder.quantity || 1}
                </p>
              </div>

              <div>
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Amount
                </p>
                <p className="font-semibold" style={{ color: "var(--gold)" }}>
                  {formatNaira(selectedOrder.total_amount || 0)}
                </p>
              </div>

              <div className="col-span-2">
                <p
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Delivery Address
                </p>
                <p
                  className="whitespace-normal wrap-break-word"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedOrder.delivery_address || "—"}
                </p>
              </div>

              <div>
                <p
                  className="mb-1 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Payment Status
                </p>
                {(() => {
                  const payment = getPaymentConfig(
                    selectedOrder.payment_status,
                  );
                  return (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        background: payment.bg,
                        color: payment.color,
                        border: `1px solid ${payment.border}`,
                      }}
                    >
                      {payment.dot ? <span className="pulse-amber" /> : null}
                      {payment.label}
                    </span>
                  );
                })()}
              </div>

              <div>
                <p
                  className="mb-1 text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Order Status
                </p>
                {(() => {
                  const status = getStatusConfig(
                    selectedOrder.order_status || "new",
                  );
                  return (
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize"
                      style={{
                        background: status.bg,
                        color: status.color,
                        border: `1px solid ${status.border}`,
                      }}
                    >
                      {selectedOrder.order_status || "new"}
                    </span>
                  );
                })()}
              </div>
            </div>

            {selectedOrder.payment_status === "payment_claimed" ? (
              <button
                onClick={() => handleConfirmPayment(selectedOrder)}
                disabled={confirmingOrderId === selectedOrder.id}
                className="mt-6 w-full rounded-lg px-3.5 py-2.5 text-sm font-bold transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_16px_rgba(232,160,69,0.4)] disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #E8A045, #C4863A)",
                  color: "#080808",
                }}
              >
                {confirmingOrderId === selectedOrder.id
                  ? "Confirming..."
                  : "Confirm Payment"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
