"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react";
import { getProductBySlug, products } from "@/data/products";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";
import ProductCard from "@/components/product/ProductCard";
import StarRating from "@/components/product/StarRating";
import { use } from "react";

const TABS = ["Description", "Additional Info", "Reviews"];

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("Description");
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${product.name} added to cart!`);
    openCart();
  };

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary transition-colors">Shop</Link>
        <span>/</span>
        <span style={{ color: "var(--color-primary)" }}>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {product.badge && (
              <span className={`badge badge-${product.badge.toLowerCase()} absolute top-4 left-4 text-sm px-3 py-1`}>
                {product.badge}
              </span>
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2">
            {[product.image, product.image, product.image].map((img, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border-2 cursor-pointer"
                style={{ borderColor: i === 0 ? "var(--color-primary)" : "var(--color-border)" }}>
                <Image src={img} alt="" width={80} height={80} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-primary)" }}>
            {product.category}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "var(--color-dark)" }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg line-through" style={{ color: "var(--color-muted)" }}>
                  ${product.originalPrice.toFixed(2)}
                </span>
                <span className="badge badge-sale">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: product.stock > 0 ? "var(--color-primary)" : "var(--color-danger)" }} />
            <span className="text-sm font-medium" style={{ color: product.stock > 0 ? "var(--color-primary)" : "var(--color-danger)" }}>
              {product.stock > 0 ? `In Stock — ${product.stock} available` : "Out of Stock"}
            </span>
          </div>

          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-muted)" }}>
            {product.description}
          </p>

          {/* Quantity + cart */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 py-3 hover:bg-gray-50 transition-colors border-r"
                style={{ borderColor: "var(--color-border)" }}>
                <Minus size={14} />
              </button>
              <span className="px-5 py-3 font-semibold w-14 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="px-4 py-3 hover:bg-gray-50 transition-colors border-l"
                style={{ borderColor: "var(--color-border)" }}>
                <Plus size={14} />
              </button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1">
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button
              onClick={() => { toggleItem(product); toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist!"); }}
              className="w-12 h-12 rounded-xl border flex items-center justify-center hover:bg-red-50 transition-colors"
              style={{ borderColor: "var(--color-border)" }}>
              <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"}
                stroke={isWishlisted ? "#ef4444" : "currentColor"} className="text-gray-500" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
            {[
              { icon: Truck, label: "Free Delivery", sub: "Over $50" },
              { icon: Shield, label: "Secure Payment", sub: "100% safe" },
              { icon: RotateCcw, label: "Easy Returns", sub: "7-day policy" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1">
                <Icon size={20} style={{ color: "var(--color-primary)" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--color-dark)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-10">
        <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors"
              style={{
                borderBottomColor: activeTab === tab ? "var(--color-primary)" : "transparent",
                color: activeTab === tab ? "var(--color-primary)" : "var(--color-muted)",
              }}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-5 text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
          {activeTab === "Description" && <p>{product.description} Carefully sourced and quality-checked before every delivery. Packed fresh and sealed to maintain optimal freshness.</p>}
          {activeTab === "Additional Info" && (
            <table className="w-full max-w-sm text-sm">
              <tbody>
                {[["Category", product.category], ["Stock", `${product.stock} units`], ["Rating", `${product.rating} / 5`], ["SKU", product.id.toUpperCase()]].map(([k, v]) => (
                  <tr key={k} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-2 font-semibold pr-4" style={{ color: "var(--color-dark)" }}>{k}</td>
                    <td className="py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === "Reviews" && (
            <div className="space-y-4">
              {[
                { name: "Sarah M.", rating: 5, text: "Absolutely fresh and delivered on time. Will order again!" },
                { name: "James K.", rating: 4, text: "Great quality. Packaging could be improved slightly." },
                { name: "Priya R.", rating: 5, text: "Best online grocery I've tried. Super fresh." },
              ].map((r) => (
                <div key={r.name} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "var(--color-dark)" }}>{r.name}</span>
                    <StarRating rating={r.rating} reviewCount={0} size={12} showCount={false} />
                  </div>
                  <p className="text-sm" style={{ color: "var(--color-muted)" }}>{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section>
          <h2 className="section-title mb-5">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
