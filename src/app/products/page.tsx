"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SlidersHorizontal, Grid, List, ChevronDown, X } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { products } from "@/data/products";
import { fetchCategories } from "@/utils/api";

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "rating", label: "Highest Rated" },
];

interface CategoryApiItem {
  id: number;
  name: string;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const searchQuery = searchParams.get("q") || "";

  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetchCategories({ limit: 200, offset: 0, vendor_id: "vendor_test2" });
        setCategories(res?.items || []);
      } catch (err) {
        console.error("Failed to load categories on shop page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter((p) => {
        const prodLower = p.category.toLowerCase();
        return selectedCategories.some((selCat) => {
          const selLower = selCat.toLowerCase();
          return prodLower.includes(selLower) || selLower.includes(prodLower);
        });
      });
    }
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    result = result.filter((p) => p.rating >= minRating);

    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (sort === "newest") result.sort((a, b) => (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0));
    else result.sort((a, b) => b.reviewCount - a.reviewCount);

    return result;
  }, [selectedCategories, priceRange, minRating, sort, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);


  const Sidebar = () => (
    <aside className="w-full space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ color: "var(--color-dark)" }}>
          Categories
        </h3>
        <div className="space-y-2">
          {loading ? (
            <span className="text-xs text-gray-400 font-medium">Loading categories...</span>
          ) : categories.length === 0 ? (
            <span className="text-xs text-gray-400 font-medium">No categories</span>
          ) : (
            categories.map((cat) => {
              const count = products.filter((p) => {
                const prodLower = p.category.toLowerCase();
                const catLower = cat.name.toLowerCase();
                return prodLower.includes(catLower) || catLower.includes(prodLower);
              }).length;
              
              return (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.name)}
                    onChange={() => toggleCategory(cat.name)}
                    className="w-4 h-4 accent-primary rounded"
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  <span className="text-sm group-hover:text-primary transition-colors" style={{ color: "var(--color-dark)" }}>
                    {cat.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    ({count})
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ color: "var(--color-dark)" }}>
          Price Range
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>${priceRange[0]}</span>
          <span className="flex-1 text-center">—</span>
          <span>${priceRange[1]}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full"
          style={{ accentColor: "var(--color-primary)" }}
        />
      </div>

      {/* Rating filter */}
      <div>
        <h3 className="font-bold text-sm mb-3" style={{ color: "var(--color-dark)" }}>
          Minimum Rating
        </h3>
        <div className="space-y-1.5">
          {[4, 3, 2, 0].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={minRating === r}
                onChange={() => setMinRating(r)}
                style={{ accentColor: "var(--color-primary)" }}
              />
              <span className="text-sm" style={{ color: "var(--color-dark)" }}>
                {r > 0 ? `${r}★ & up` : "All ratings"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear */}
      {(selectedCategories.length > 0 || minRating > 0) && (
        <button
          onClick={() => { setSelectedCategories([]); setMinRating(0); setPriceRange([0, 100]); }}
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: "var(--color-danger)" }}
        >
          <X size={12} /> Clear all filters
        </button>
      )}
    </aside>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">
        {searchQuery ? `Search Results for "${searchQuery}"` : "Shop All Products"}
      </h1>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="card p-5 sticky top-24">
            <Sidebar />
          </div>
        </div>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {filtered.length} products found
            </p>
            <div className="flex items-center gap-2">
              {/* Mobile filter toggle */}
              <button
                className="lg:hidden flex items-center gap-1.5 text-sm font-medium border px-3 py-2 rounded-sm"
                style={{ borderColor: "var(--color-border)" }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border rounded-sm px-3 py-2 text-sm outline-none appearance-none pr-8"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-dark)" }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="flex border rounded-sm overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  className="p-2 transition-colors"
                  style={{ backgroundColor: view === "grid" ? "var(--color-primary)" : "white" }}
                  onClick={() => setView("grid")}
                >
                  <Grid size={14} className={view === "grid" ? "text-white" : "text-gray-400"} />
                </button>
                <button
                  className="p-2 transition-colors"
                  style={{ backgroundColor: view === "list" ? "var(--color-primary)" : "white" }}
                  onClick={() => setView("list")}
                >
                  <List size={14} className={view === "list" ? "text-white" : "text-gray-400"} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile sidebar */}
          {sidebarOpen && (
            <div className="lg:hidden card p-5 mb-5">
              <Sidebar />
            </div>
          )}

          {/* Product grid */}
          {paginated.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-semibold text-gray-500">No products match your filters.</p>
              <button
                onClick={() => { setSelectedCategories([]); setMinRating(0); }}
                className="mt-3 btn-outline text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map((product) => (
                <div key={product.id} className="card flex gap-4 p-4">
                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">{product.category}</p>
                    <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--color-dark)" }}>{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="font-bold" style={{ color: "var(--color-primary)" }}>${product.price.toFixed(2)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs line-through text-gray-400">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className="w-9 h-9 rounded-sm text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: page === i + 1 ? "var(--color-primary)" : "white",
                    color: page === i + 1 ? "white" : "var(--color-dark)",
                    border: `1.5px solid ${page === i + 1 ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
