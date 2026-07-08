"use client";
import Link from "next/link";
import Image from "next/image";

const promoItems = [
  {
    id: 1,
    discount: "5% OFF",
    title: "Hot Deals on New Items",
    subtitle: "Daily Essentials Eggs & Dairy",
    image: "/images/vegetable/banner/4.jpg",
    buttonBg: "#0da487",
    href: "/products?category=Dairy+%26+Breakfast",
  },
  {
    id: 2,
    discount: "5% OFF",
    title: "Buy More & Save More",
    subtitle: "Fresh Vegetables",
    image: "/images/vegetable/banner/5.jpg",
    buttonBg: "#ff5c5c",
    href: "/products?category=Vegetables+%26+Fruit",
  },
  {
    id: 3,
    discount: "5% OFF",
    title: "Organic Meat Prepared",
    subtitle: "Delivered to Your Home",
    image: "/images/vegetable/banner/6.jpg",
    buttonBg: "#ff7a45",
    href: "/products?category=Meats+%26+Seafood",
  },
  {
    id: 4,
    discount: "5% OFF",
    title: "Buy More & Save More",
    subtitle: "Nuts & Snacks",
    image: "/images/vegetable/banner/7.jpg",
    buttonBg: "#5cbbff",
    href: "/products?category=Biscuits+%26+Snacks",
  },
];

export default function PromoBanners() {
  return (
    <section className="my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {promoItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative block bg-[#f8f8f8] border border-gray-100 rounded-3xl overflow-hidden h-[180px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            {/* Background organic leaf watermark texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Product Image (Placed underneath the glassmorphic overlay for showing through the blur) */}
            <div className="absolute right-0 bottom-0 top-0 w-[55%] h-full z-0">
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority
                className="object-contain object-right-bottom p-2 transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Content Card (Glassmorphism) - Starts at left-0, top-0, bottom-0 with large rounded right curve */}
            <div className="absolute left-0 top-0 bottom-0 w-[58%] bg-white/60 backdrop-blur-md rounded-r-[90px] pl-6 pt-7 pr-6 pb-16 border-r border-white/40 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10 flex flex-col justify-start">
              <div>
                <span className="text-xs font-bold text-red-500 tracking-wider">
                  {item.discount}
                </span>
                <h3 className="text-base font-bold text-[#222] mt-1.5 leading-tight group-hover:text-black transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-snug font-normal line-clamp-1">
                  {item.subtitle}
                </p>
              </div>
            </div>

            {/* Shop Now button - Positioned at bottom-left corner with large rounded-tr-full curve */}
            <div
              className="absolute bottom-0 left-0 pl-6 pr-10 py-3.5 rounded-tr-full text-xs font-bold text-white transition-all duration-300 group-hover:pr-12 shadow-md flex items-center gap-1.5 z-20"
              style={{ backgroundColor: item.buttonBg }}
            >
              Shop Now <span className="inline-block transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
