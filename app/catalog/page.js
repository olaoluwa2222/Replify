"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

let SELLER_ID = null;

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function splitValues(text) {
  return (text || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function StockToggle({ isOn, onToggle, label }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="relative h-5 w-10 rounded-full border transition-all duration-200"
        style={{
          borderColor: isOn ? "rgba(34,197,94,0.35)" : "var(--border)",
          background: isOn ? "rgba(34,197,94,0.25)" : "var(--bg-hover)",
        }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200"
          style={{
            left: isOn ? "20px" : "2px",
            background: isOn
              ? "linear-gradient(135deg, var(--gold-bright), var(--gold-muted))"
              : "#8A8A8A",
          }}
        />
      </button>
      <span
        className="text-[11px]"
        style={{ color: isOn ? "var(--green)" : "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState("");
  const [variants, setVariants] = useState("");
  const [stockStatus, setStockStatus] = useState("in_stock");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function fetchProducts() {
    if (!SELLER_ID) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", SELLER_ID)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  function handleImageFile(file) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);
  }

  function resetForm() {
    setProductName("");
    setDescription("");
    setPrice("");
    setSizes("");
    setVariants("");
    setStockStatus("in_stock");
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleSaveProduct(event) {
    event.preventDefault();
    if (!productName.trim() || saving) return;

    setSaving(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Image upload failed");
        }

        imageUrl = uploadData.secure_url;
      }

      const { error } = await supabase.from("products").insert({
        seller_id: SELLER_ID,
        name: productName,
        description,
        price: parseFloat(price),
        sizes,
        variants,
        stock_status: stockStatus,
        image_url: imageUrl || null,
      });

      if (error) throw error;

      setShowDrawer(false);
      resetForm();
      await fetchProducts();
      setToast("Product saved!");
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleProductStock(product) {
    const nextStatus =
      product.stock_status === "in_stock" ? "out_of_stock" : "in_stock";
    const previous = products;

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, stock_status: nextStatus } : item,
      ),
    );

    const { error } = await supabase
      .from("products")
      .update({ stock_status: nextStatus })
      .eq("id", product.id);

    if (error) {
      console.error("Error updating stock status:", error);
      setProducts(previous);
    }
  }

  async function handleDeleteProduct(productId) {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    const previous = products;
    setProducts((prev) => prev.filter((product) => product.id !== productId));

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Error deleting product:", error);
      setProducts(previous);
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

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .drawer-enter { animation: slideIn 0.3s ease both; }

        .ai-active-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22C55E;
          animation: pulseAmber 2s ease infinite;
          display: inline-block;
          margin-right: 8px;
        }

        @keyframes pulseAmber {
          0%,100% { opacity:1; transform: scale(1); }
          50% { opacity:0.5; transform: scale(0.85); }
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
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-(--bg-elevated) hover:text-(--text-primary)"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>📦</span>
            <span>Orders</span>
          </Link>
          <Link
            href="/catalog"
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium"
            style={{
              background: "var(--gold-subtle)",
              color: "var(--gold)",
              borderLeft: "2px solid var(--gold)",
            }}
          >
            <span>🛍️</span>
            <span>Catalog</span>
          </Link>
          <Link
            href="/settings"
            className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-(--bg-elevated) hover:text-(--text-primary)"
            style={{ color: "var(--text-secondary)" }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="mt-auto space-y-3 p-4">
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

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: "#dc2626",
              color: "white",
              border: "1px solid #991b1b",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="px-4 pb-6 pt-5 lg:ml-65 lg:px-8 lg:pt-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              className="text-[28px] font-bold leading-tight"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: "var(--text-primary)",
              }}
            >
              Product Catalog
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Manage what your AI knows about your products
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:brightness-110"
            style={{
              fontFamily: "'Sora', sans-serif",
              background: "linear-gradient(135deg, #E8A045, #C4863A)",
              color: "#080808",
            }}
          >
            + Add Product
          </button>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="animate-pulse overflow-hidden rounded-xl border"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="h-40 w-full bg-[#1F1F1F]" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 rounded bg-[#252525]" />
                    <div className="h-4 w-1/3 rounded bg-[#2A2A2A]" />
                    <div className="h-7 w-full rounded bg-[#202020]" />
                    <div className="h-7 w-full rounded bg-[#202020]" />
                    <div className="h-6 w-1/2 rounded bg-[#232323]" />
                  </div>
                </div>
              ))
            : products.map((product) => {
                const productSizes = splitValues(product.sizes);
                const productVariants = splitValues(product.variants);
                const isInStock = product.stock_status === "in_stock";

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-xl border transition-all duration-200 hover:border-(--gold) hover:shadow-[0_0_20px_rgba(232,160,69,0.15)]"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div
                      className="flex h-40 items-center justify-center rounded-t-xl"
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl" style={{ opacity: 0.6 }}>
                          📷
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div>
                        <h3
                          className="text-base font-semibold"
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "'Sora', sans-serif",
                          }}
                        >
                          {product.name}
                        </h3>
                        <p
                          className="mt-1 text-lg font-bold"
                          style={{ color: "var(--gold)" }}
                        >
                          {formatNaira(product.price)}
                        </p>
                      </div>

                      <div>
                        <p
                          className="mb-1 text-[11px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Sizes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {productSizes.map((size) => (
                            <span
                              key={`${product.id}-size-${size}`}
                              className="rounded-full border px-3 py-1 text-[11px]"
                              style={{
                                background: "var(--bg-hover)",
                                color: "var(--text-secondary)",
                                borderColor: "var(--border)",
                              }}
                            >
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p
                          className="mb-1 text-[11px]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Variants
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {productVariants.map((variant) => (
                            <span
                              key={`${product.id}-variant-${variant}`}
                              className="rounded-full border px-3 py-1 text-[11px]"
                              style={{
                                background: "var(--bg-hover)",
                                color: "var(--text-secondary)",
                                borderColor: "var(--border)",
                              }}
                            >
                              {variant}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <StockToggle
                          isOn={isInStock}
                          onToggle={() => handleToggleProductStock(product)}
                          label={isInStock ? "In Stock" : "Out of Stock"}
                        />

                        <div className="flex items-center gap-3 text-sm">
                          <button
                            type="button"
                            className="text-(--text-muted) transition-colors hover:text-(--gold)"
                            aria-label={`Edit ${product.name}`}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="text-(--text-muted) transition-colors hover:text-(--red)"
                            onClick={() => handleDeleteProduct(product.id)}
                            aria-label={`Delete ${product.name}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
        </section>
      </main>

      {showDrawer ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setShowDrawer(false)}
            aria-label="Close add product drawer"
          />

          <aside
            className="drawer-enter fixed right-0 top-0 z-50 h-full w-105 overflow-y-auto p-5"
            style={{
              background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="text-xl font-bold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: "var(--text-primary)",
                }}
              >
                Add Product
              </h2>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="rounded-md px-2 py-1 text-sm transition-colors hover:bg-(--bg-elevated)"
                style={{ color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSaveProduct}>
              <div>
                <label
                  className="mb-1 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Black Bodycon Dress"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-(--gold)"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe your product"
                  className="w-full resize-none rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-(--gold)"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Price in ₦
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="15000"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-(--gold)"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Available Sizes
                </label>
                <input
                  type="text"
                  value={sizes}
                  onChange={(event) => setSizes(event.target.value)}
                  placeholder="S, M, L, XL"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-(--gold)"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Variants/Colors
                </label>
                <input
                  type="text"
                  value={variants}
                  onChange={(event) => setVariants(event.target.value)}
                  placeholder="Black, White, Red"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-(--gold)"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Product Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageFile(event.target.files?.[0])}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleImageFile(event.dataTransfer.files?.[0]);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors hover:border-(--gold)"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-elevated)",
                  }}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <>
                      <span className="text-3xl">📷</span>
                      <p
                        className="mt-2 text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Upload product image
                      </p>
                      <p
                        className="mt-1 text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Click to browse or drag and drop
                      </p>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label
                  className="mb-2 block text-[12px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Stock Status
                </label>
                <StockToggle
                  isOn={stockStatus === "in_stock"}
                  onToggle={() =>
                    setStockStatus((prev) =>
                      prev === "in_stock" ? "out_of_stock" : "in_stock",
                    )
                  }
                  label={
                    stockStatus === "in_stock" ? "In Stock" : "Out of Stock"
                  }
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:brightness-110 disabled:opacity-60"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  background: "linear-gradient(135deg, #E8A045, #C4863A)",
                  color: "#080808",
                }}
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </form>
          </aside>
        </>
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-5 right-5 z-60 rounded-lg border px-4 py-2 text-sm font-semibold"
          style={{
            borderColor: "var(--gold)",
            background: "var(--gold-subtle)",
            color: "var(--gold-bright)",
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
