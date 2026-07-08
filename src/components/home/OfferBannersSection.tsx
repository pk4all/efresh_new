"use client";
import Link from "next/link";
import Image from "next/image";

export default function OfferBannersSection() {
  return (
    <section className="my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Banner 1: Fresh MEAT (Chicken Image) */}
        <Link
          href="/products?category=Meats+%26+Seafood"
          className="group relative block bg-[#f4f4ec] border border-gray-100 rounded-2xl overflow-hidden h-[180px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute left-6 top-0 bottom-0 w-[55%] flex flex-col justify-center z-10">
            <span className="text-xs md:text-sm font-semibold text-gray-600 mb-1">
              50% offer
            </span>
            <h3 className="text-lg md:text-xl lg:text-2xl font-extrabold text-[#0da487] mb-4 leading-tight group-hover:text-[#0c9076] transition-colors">
              Fresh MEAT
            </h3>
            <div className="bg-[#ff5c5c] text-white px-5 py-2.5 rounded-xl text-xs font-bold w-fit shadow-md group-hover:bg-[#e04f4f] transition-all flex items-center gap-1.5">
              Shop Now <span className="inline-block transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
          
          {/* Image (Chicken drumsticks) */}
          <div className="absolute right-0 bottom-0 top-0 w-[45%] h-full z-0">
            <Image
              src="/images/banner_chicken.png"
              alt="Fresh MEAT"
              fill
              priority
              className="object-contain object-right-bottom p-2 transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>

        {/* Banner 2: Testy Mushrooms (Mushrooms Image) */}
        <Link
          href="/products?category=Vegetables+%26+Fruit"
          className="group relative block bg-[#f0f6f2] border border-gray-100 rounded-2xl overflow-hidden h-[180px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute left-6 top-0 bottom-0 w-[55%] flex flex-col justify-center z-10">
            <span className="text-xs md:text-sm font-semibold text-gray-600 mb-1">
              50% offer
            </span>
            <h3 className="text-lg md:text-xl lg:text-2xl font-extrabold text-[#0da487] mb-4 leading-tight group-hover:text-[#0c9076] transition-colors">
              Testy Mushrooms
            </h3>
            <div className="bg-[#ff5c5c] text-white px-5 py-2.5 rounded-xl text-xs font-bold w-fit shadow-md group-hover:bg-[#e04f4f] transition-all flex items-center gap-1.5">
              Shop Now <span className="inline-block transform group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
          
          {/* Image (Mushrooms) */}
          <div className="absolute right-0 bottom-0 top-0 w-[45%] h-full z-0">
            <Image
              src="/images/banner_mushrooms.png"
              alt="Testy Mushrooms"
              fill
              priority
              className="object-contain object-right-bottom p-2 transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>

      </div>
    </section>
  );
}
