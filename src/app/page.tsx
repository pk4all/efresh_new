"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import PromoBanners from "@/components/home/PromoBanners";
import TodayDealsSection from "@/components/home/TodayDealsSection";
import OfferBannersSection from "@/components/home/OfferBannersSection";
import ProductSection from "@/components/home/ProductSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import Sidebar from "@/components/home/Sidebar";
import ProductCard from "@/components/product/ProductCard";
import { products, getFeaturedProducts, getBestSellers, getNewArrivals } from "@/data/products";
import { Product } from "@/types";

const TABS = ["All", "Vegetables", "Fruits", "Protein", "Snacks"] as const;
type Tab = (typeof TABS)[number];

const tabFilter: Record<Tab, (p: Product) => boolean> = {
  All: () => true,
  Vegetables: (p) => p.category === "Vegetables & Fruit",
  Fruits: (p) => p.category === "Vegetables & Fruit" && ["vf-2", "vf-5", "vf-6", "vf-3"].includes(p.id),
  Protein: (p) => ["bs-4", "db-1", "db-2", "db-5"].includes(p.id),
  Snacks: (p) => p.category === "Biscuits & Snacks",
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const featured = getFeaturedProducts();
  const bestSellers = getBestSellers();
  const newArrivals = getNewArrivals();

  const tabProducts =
    activeTab === "All"
      ? bestSellers.slice(0, 8)
      : products.filter(tabFilter[activeTab]).slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <HeroBannerSlider />

      {/* Promo Banners */}
      <PromoBanners />

      {/* Two Column Layout matching Fastkart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 my-8 items-start">
        {/* Left Column (Sticky Sidebar on Desktop) */}
        <div className="lg:col-span-1 hidden lg:block lg:sticky lg:top-24">
          <Sidebar />
        </div>

        {/* Right Column (Main Product Feed) */}
        <div className="lg:col-span-3 flex flex-col gap-10">
          {/* Today's Deals (Top Save Today) */}
          <TodayDealsSection />

          {/* Promotional Offer Banners Grid */}
          <OfferBannersSection />

          {/* Featured Products */}
          <ProductSection
            title="Featured Products"
            viewAllHref="/products"
            products={featured}
            columns={4}
          />

          {/* Best Sellers with tabs */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="section-title">Best Sellers</h2>
              <div className="flex gap-1 flex-wrap">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      backgroundColor: activeTab === tab ? "var(--color-primary)" : "var(--color-light-bg)",
                      color: activeTab === tab ? "white" : "var(--color-muted)",
                      border: `1.5px solid ${activeTab === tab ? "var(--color-primary)" : "var(--color-border)"}`,
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tabProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Special Offer Banner */}
          <section
            className="rounded-2xl overflow-hidden flex flex-col md:flex-row items-center"
            style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)", minHeight: "200px" }}
          >
            <div className="flex-1 p-8 md:p-10">
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 text-white bg-white/10">
                🔥 Limited Time
              </span>
              <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#ffffff" }}>
                Special Offer: Buy 2 Get 1 Free
              </h2>
              <p className="mb-5 text-sm" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                On all organic produce this week. Use code{" "}
                <span className="font-bold text-yellow-400">ORGANIC3</span> at checkout.
              </p>
              <Link
                href="/products?filter=organic"
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm"
                style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              >
                Shop Offer <ArrowRight size={16} />
              </Link>
            </div>
            <div className="p-8 text-[100px] select-none">🥑</div>
          </section>

          {/* New Arrivals */}
          <ProductSection
            title="New Arrivals"
            viewAllHref="/products?filter=new"
            products={newArrivals}
            columns={4}
          />
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
