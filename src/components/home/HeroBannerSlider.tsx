"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

const slides = [
  {
    id: 1,
    tag: "Exclusive Coupon Offer",
    badge: "SAVE $10",
    headlineLine1: "GET $10 OFF",
    headlineLine2: "YOUR FIRST FRESH",
    headlineAccent: "GROCERY ORDER",
    sub: "Use code FRESH10 at checkout on your first order over $50.",
    cta: "Claim $10 Discount",
    href: "/products",
    image: "/images/hero_crate_vegetables.png",
    bgGradient: "linear-gradient(90deg, rgba(224, 90, 43, 0.95) 0%, rgba(201, 74, 29, 0.85) 45%, rgba(0, 0, 0, 0.25) 100%)",
    accentColor: "#6BBE59",
  },
  {
    id: 2,
    tag: "100% Organic & Fresh",
    badge: "30% OFF",
    headlineLine1: "HEALTHY & FRESH",
    headlineLine2: "DELIVERED TO YOUR",
    headlineAccent: "DOORSTEP",
    sub: "Certified organic produce sourced straight from local growers daily.",
    cta: "Explore Fresh Range",
    href: "/products?category=Vegetables+%26+Fruit",
    image: "/images/hero_fresh_fruits.png",
    bgGradient: "linear-gradient(90deg, rgba(73, 103, 169, 0.95) 0%, rgba(53, 78, 133, 0.85) 45%, rgba(0, 0, 0, 0.25) 100%)",
    accentColor: "#6BBE59",
  },
  {
    id: 3,
    tag: "Weekly Value Bundle",
    badge: "BEST VALUE",
    headlineLine1: "SEASONAL FRUIT &",
    headlineLine2: "ORGANIC VEG",
    headlineAccent: "VALUE BOXES",
    sub: "Packed with hand-picked seasonal produce for healthy daily living.",
    cta: "Shop Value Boxes",
    href: "/products",
    image: "/images/hero_healthy_food.png",
    bgGradient: "linear-gradient(90deg, rgba(107, 190, 89, 0.95) 0%, rgba(84, 163, 67, 0.85) 45%, rgba(0, 0, 0, 0.25) 100%)",
    accentColor: "#4967a9",
  },
];

export default function HeroBannerSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = slides[current];

  return (
    <div className="w-full my-0 font-sans">
      {/* Full-width Edge-to-Edge Hero Slider */}
      <section
        className="relative overflow-hidden w-full h-[400px] sm:h-[480px] md:h-[540px] lg:h-[580px] flex flex-col justify-between select-none rounded-none shadow-none bg-gray-900"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Full Bleed Background Image */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Image
            src={slide.image}
            alt={slide.headlineLine1}
            fill
            priority
            className="object-cover object-center transition-all duration-700 scale-100"
          />
          {/* Faded Gradient Overlay for text readability on left side */}
          <div
            className="absolute inset-0 z-10 transition-all duration-700"
            style={{ background: slide.bgGradient }}
          />
        </div>

        {/* Dot matrix pattern overlay */}
        <div className="absolute inset-0 z-15 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:14px_14px]" />

        {/* Slide Content */}
        <div
          key={current}
          className="relative flex items-center h-full w-full z-20"
          style={{ animation: "heroFadeIn 0.4s ease-out" }}
        >
          <div className="relative w-full h-full flex items-center p-5 sm:p-10 md:p-16 text-white max-w-6xl mx-auto">
            {/* Text Left Section */}
            <div className="relative z-10 max-w-xl space-y-3 sm:space-y-5">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3.5 sm:py-1 rounded-sm font-extrabold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 border border-white/25 shadow-sm">
                  <Sparkles size={11} className="text-yellow-300 sm:w-3.5 sm:h-3.5" />
                  {slide.tag}
                </span>
                <span
                  className="text-white text-[10px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-sm font-black shadow-sm"
                  style={{ backgroundColor: slide.accentColor }}
                >
                  {slide.badge}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-lg">
                {slide.headlineLine1}
                <br />
                {slide.headlineLine2}
                <br />
                <span
                  className="font-black drop-shadow-md"
                  style={{ color: slide.accentColor }}
                >
                  {slide.headlineAccent}
                </span>
              </h1>

              <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-md leading-relaxed font-medium drop-shadow-sm line-clamp-2 sm:line-clamp-none">
                {slide.sub}
              </p>

              <div className="pt-1 sm:pt-2">
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2 text-white font-bold px-5 py-2.5 sm:px-8 sm:py-3.5 text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer rounded-sm hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: slide.accentColor }}
                >
                  {slide.cta}
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer z-30"
        >
          <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all cursor-pointer z-30"
        >
          <ChevronRight size={18} className="sm:w-6 sm:h-6" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-2.5 z-30">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="transition-all duration-300 cursor-pointer"
              style={{
                width: i === current ? "24px" : "8px",
                height: "5px",
                backgroundColor: i === current ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
              }}
            />
          ))}
        </div>
      </section>

      <style>{`
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
