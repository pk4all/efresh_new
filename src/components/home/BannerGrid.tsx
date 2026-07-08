import Link from "next/link";

const banners = [
  {
    title: "Organic\nVegetables",
    sub: "Fresh from the farm",
    emoji: "🥗",
    bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    color: "#16a34a",
    href: "/products?category=Vegetables+%26+Fruit",
  },
  {
    title: "Fresh\nFruits",
    sub: "Seasonal picks, just arrived",
    emoji: "🍉",
    bg: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)",
    color: "#ca8a04",
    href: "/products?category=Vegetables+%26+Fruit",
  },
  {
    title: "Special\nOffer",
    sub: "Up to 40% off today",
    emoji: "🎁",
    bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    color: "#dc2626",
    href: "/products?filter=deals",
  },
];

export default function BannerGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
      {banners.map((b) => (
        <Link
          key={b.title}
          href={b.href}
          className="group rounded-2xl overflow-hidden flex items-center justify-between px-5 py-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: b.bg, minHeight: "130px" }}
        >
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: b.color }}>
              eFresh Exclusive
            </p>
            <h3
              className="text-lg font-bold leading-tight whitespace-pre-line"
              style={{ color: b.color }}
            >
              {b.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: b.color, opacity: 0.75 }}>
              {b.sub}
            </p>
            <span
              className="inline-block mt-3 text-xs font-semibold px-3 py-1.5 rounded-sm text-white transition-all group-hover:scale-105"
              style={{ backgroundColor: b.color }}
            >
              Shop Now →
            </span>
          </div>
          <span className="text-6xl group-hover:scale-110 transition-transform duration-300 select-none">
            {b.emoji}
          </span>
        </Link>
      ))}
    </div>
  );
}
