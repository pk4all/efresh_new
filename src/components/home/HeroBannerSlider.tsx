"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: 1,
    tag: "Exclusive offer",
    badge: "30% Off",
    headlineLine1: "STAY HOME &",
    headlineLine2: "DELIVERED YOUR",
    headlineGreen: "DAILY NEEDS",
    sub: "Vegetables contain many vitamins and minerals that are good for your health.",
    cta: "Shop Now",
    href: "/products",
    image: "/images/vegetable/banner/1.jpg",
  },
  {
    id: 2,
    tag: "Special Deal",
    badge: "20% Off",
    headlineLine1: "FRESH TROPICAL &",
    headlineLine2: "ORGANIC FARM",
    headlineGreen: "FRUITS SELECTION",
    sub: "Rich in vitamins, direct from certified local farms to your kitchen.",
    cta: "View Deals",
    href: "/products?category=Vegetables+%26+Fruit",
    image: "/images/hero_fresh_fruits.png",
  },
];

export default function HeroBannerSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = slides[current];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* Left: Slider (2/3 width) */}
      <section
        className="relative overflow-hidden rounded-lg bg-white border border-gray-100 lg:col-span-2 min-h-[300px] md:min-h-[460px] flex flex-col justify-between"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Slide Content */}
        <div
          key={current}
          className="relative flex items-center h-full w-full select-none min-h-[300px] md:min-h-[460px]"
          style={{
            animation: "slideIn 0.5s ease",
          }}
        >
          {/* Background Image (Full Bleed) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Image
              src={slide.image}
              alt="Slide background"
              fill
              priority
              className="object-cover object-right md:object-right-bottom"
            />
          </div>

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[60%] bg-gradient-to-r from-white/95 via-white/80 to-transparent z-10 pointer-events-none" />

          {/* Text Left */}
          <div className="relative flex flex-col items-start justify-center p-6 md:p-12 lg:p-16 z-20 max-w-[70%] md:max-w-[50%]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {slide.tag}
              </span>
              <span className="bg-[#fde8e8] text-[#ff5c5c] text-[10px] md:text-xs px-2.5 py-0.5 rounded-full font-bold">
                {slide.badge}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-[40px] xl:text-[46px] font-extrabold text-[#222] tracking-tight leading-[1.15] mb-4">
              {slide.headlineLine1}
              <br />
              {slide.headlineLine2}
              <br />
              <span className="text-[#0da487]">{slide.headlineGreen}</span>
            </h1>
            <p className="text-gray-500 text-xs md:text-sm max-w-sm mb-6 leading-relaxed">
              {slide.sub}
            </p>
            <Link
              href={slide.href}
              className="inline-flex items-center justify-center gap-2 bg-[#ff5c5c] hover:bg-[#e04f4f] text-white font-bold px-6 py-3 rounded-md transition-all text-xs md:text-sm shadow-sm hover:gap-3"
            >
              {slide.cta} →
            </Link>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-105 z-20"
        >
          <ChevronLeft size={18} className="text-gray-700" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all hover:scale-105 z-20"
        >
          <ChevronRight size={18} className="text-gray-700" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? "20px" : "6px",
                height: "6px",
                backgroundColor: i === current ? "#0da487" : "rgba(13, 164, 135, 0.3)",
              }}
            />
          ))}
        </div>
      </section>

      {/* Right: Side Banners (1/3 width, stacked) */}
      <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-col gap-6 lg:col-span-1">
        {/* Banner 1: Nut Collection */}
        <div className="bg-white border border-gray-100 rounded-lg flex items-center justify-between relative overflow-hidden h-[218px]">
          {/* Background Image (Full Bleed) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Image
              src="/images/vegetable/banner/2.jpg"
              alt="Nut Collection"
              fill
              className="object-cover object-right-bottom"
            />
          </div>

          <div className="flex flex-col z-10 max-w-[55%] items-start p-6 relative">
            <span className="text-red-500 font-bold text-base md:text-lg mb-1">
              45% OFF
            </span>
            <h3 className="text-lg md:text-xl font-extrabold text-[#0da487] mb-2 leading-tight">
              Nut Collection
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-normal">
              We deliver organic vegetables & fruits
            </p>
            <Link
              href="/products"
              className="text-xs md:text-sm font-bold text-[#222] hover:text-[#0da487] inline-flex items-center gap-1 transition-all"
            >
              Shop Now <span className="text-base">→</span>
            </Link>
          </div>
        </div>

        {/* Banner 2: Healthy Food / Organic Market */}
        <div className="bg-white border border-gray-100 rounded-lg flex items-center justify-between relative overflow-hidden h-[218px]">
          {/* Background Image (Full Bleed) */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Image
              src="/images/vegetable/banner/3.jpg"
              alt="Healthy Food"
              fill
              className="object-cover object-right-bottom"
            />
          </div>

          <div className="flex flex-col z-10 max-w-[55%] items-start p-6 relative">
            <h3 className="text-lg md:text-xl font-extrabold text-[#0da487] mb-1 leading-tight">
              Healthy Food
            </h3>
            <span className="text-red-500 font-bold text-xs mb-2 uppercase tracking-wider">
              Organic Market
            </span>
            <p className="text-xs text-gray-500 mb-4 leading-normal">
              Start your daily shopping with some Organic food
            </p>
            <Link
              href="/products"
              className="text-xs md:text-sm font-bold text-[#222] hover:text-[#0da487] inline-flex items-center gap-1 transition-all"
            >
              Shop Now <span className="text-base">→</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
