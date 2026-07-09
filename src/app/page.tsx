"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroBannerSlider from "@/components/home/HeroBannerSlider";
import PromoBanners from "@/components/home/PromoBanners";
import TodayDealsSection from "@/components/home/TodayDealsSection";
import OfferBannersSection from "@/components/home/OfferBannersSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import BestSellersSection from "@/components/home/BestSellersSection";
import NewArrivalsSection from "@/components/home/NewArrivalsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import Sidebar from "@/components/home/Sidebar";

export default function HomePage() {
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
          <FeaturedProductsSection />

          {/* Best Sellers with tabs */}
          <BestSellersSection />

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
          <NewArrivalsSection />
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
