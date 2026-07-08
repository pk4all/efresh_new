import Link from "next/link";

const categories = [
  { name: "Vegetables", emoji: "🥦", href: "/products?category=Vegetables+%26+Fruit", color: "#dcfce7" },
  { name: "Dairy", emoji: "🥛", href: "/products?category=Dairy+%26+Breakfast", color: "#dbeafe" },
  { name: "Beverages", emoji: "🥤", href: "/products?category=Beverages", color: "#fef9c3" },
  { name: "Snacks", emoji: "🍿", href: "/products?category=Biscuits+%26+Snacks", color: "#fce7f3" },
  { name: "Frozen", emoji: "❄️", href: "/products?category=Frozen+Foods", color: "#e0f2fe" },
  { name: "Bakery", emoji: "🍞", href: "/products?category=Grocery+%26+Staples", color: "#ffedd5" },
  { name: "Meat", emoji: "🥩", href: "/products?category=Meats+%26+Seafood", color: "#fee2e2" },
  { name: "Fruits", emoji: "🍓", href: "/products?category=Vegetables+%26+Fruit", color: "#fef3c7" },
];

export default function CategoryIconRow() {
  return (
    <section className="py-2">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
            style={{ minWidth: "72px" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
              style={{ backgroundColor: cat.color }}
            >
              {cat.emoji}
            </div>
            <span className="text-xs font-semibold text-center" style={{ color: "var(--color-dark)" }}>
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
