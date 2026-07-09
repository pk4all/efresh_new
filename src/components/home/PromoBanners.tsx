"use client";
import Link from "next/link";
import Image from "next/image";

const promoItems = [
  {
    id: 1,
    discount: "5% OFF",
    title: "Hot Deals...",
    subtitle: "Daily Essentials, Egg...",
    image: "/images/vegetable/banner/4.jpg",
    buttonBg: "#0da487",
    circles: ["#0da487", "#0a8069"],
    href: "/products?category=Dairy+%26+Breakfast",
  },
  {
    id: 2,
    discount: "5% OFF",
    title: "Buy More ...",
    subtitle: "Fresh Vegetables...",
    image: "/images/vegetable/banner/5.jpg",
    buttonBg: "#ff5c5c",
    circles: ["#ff5c5c", "#e04d4d"],
    href: "/products?category=Vegetables+%26+Fruit",
  },
  {
    id: 3,
    discount: "5% OFF",
    title: "Organic Meat...",
    subtitle: "Delivered to Your...",
    image: "/images/vegetable/banner/6.jpg",
    buttonBg: "#ff7a45",
    circles: ["#ff7a45", "#e6622e"],
    href: "/products?category=Meats+%26+Seafood",
  },
  {
    id: 4,
    discount: "5% OFF",
    title: "Buy More ...",
    subtitle: "Nuts & Snacks...",
    image: "/images/vegetable/banner/7.jpg",
    buttonBg: "#5cbbff",
    circles: ["#5cbbff", "#4ca6e6"],
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
            className="group relative block bg-[#fafafa] border border-gray-100 rounded-3xl overflow-hidden h-[180px] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            {/* Dot pattern background */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]" />

            {/* Decorative colored circles/semi-circles in the bottom-right corner under the image */}
            <div 
              className="absolute -bottom-8 right-16 w-24 h-24 rounded-full opacity-40 blur-[1px] transition-transform duration-500 group-hover:scale-110" 
              style={{ backgroundColor: item.circles[1] }} 
            />
            <div 
              className="absolute -bottom-12 -right-4 w-32 h-32 rounded-full opacity-60 transition-transform duration-500 group-hover:scale-105" 
              style={{ backgroundColor: item.circles[0] }} 
            />

            {/* Product Image */}
            <div className="absolute right-3 bottom-2 w-[48%] h-[80%] z-10 flex items-end justify-end">
              <Image
                src={item.image}
                alt={item.title}
                width={130}
                height={110}
                priority
                className="object-contain object-right-bottom transform group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Left White Overlay containing text (rounded-r-[110px]) */}
            <div className="absolute left-0 top-0 bottom-0 w-[64%] bg-white rounded-r-[110px] pl-6 pt-6 pr-8 pb-16 z-10 flex flex-col justify-start shadow-[3px_0_15px_rgba(0,0,0,0.015)]">
              <span className="text-[11px] font-bold text-red-600 tracking-wider uppercase block">
                {item.discount}
              </span>
              <h3 className="text-[26px] font-extrabold text-[#2c2c2c] mt-2.5 leading-[1.1] tracking-tight line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium line-clamp-1 pr-2">
                {item.subtitle}
              </p>
            </div>

            {/* Shop Now Button at bottom-left */}
            <div
              className="absolute bottom-0 left-0 pl-6 pr-8 py-3 rounded-tr-3xl text-xs font-bold text-white flex items-center gap-1.5 z-20 shadow-sm transition-all duration-300 group-hover:pr-10"
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
