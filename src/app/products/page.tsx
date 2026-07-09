"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SlidersHorizontal, Grid, List, ChevronDown, X } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { fetchCategories, fetchProducts, mapApiProductToProduct } from "@/utils/api";
import { Product } from "@/types";

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
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetchCategories({ limit: 200, offset: 0, vendor_id: "vendor_test3" });
        setCategories(res?.data || []);
      } catch (err) {
        console.error("Failed to load categories on shop page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Reset page to 1 and clear product list when search or category filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, searchQuery]);

  useEffect(() => {
    async function loadProducts() {
      try {
        if (page === 1) {
          setProductsLoading(true);
        } else {
          setLoadingMore(true);
        }

        const catObj = selectedCategories.length > 0
          ? categories.find((c) => c.name === selectedCategories[0])
          : null;
        const catId = catObj ? String(catObj.id) : undefined;

        const res = await fetchProducts({
          limit: 15,
          page: page,
          category_id: catId,
          search: searchQuery || undefined,
          vendor_id: "vendor_test3",
        });

        const items = res?.data || [];
        const mapped = items.map(mapApiProductToProduct);

        setDbProducts((prev) => (page === 1 ? mapped : [...prev, ...mapped]));

        const totalPages = res?.pagination?.totalPages || 0;
        setTotalProducts(res?.pagination?.total || 0);
        setHasMore(page < totalPages);
      } catch (err) {
        console.error("Failed to load products on shop page:", err);
      } finally {
        setProductsLoading(false);
        setLoadingMore(false);
      }
    }

    if (categories.length > 0 || !loading) {
      loadProducts();
    }
  }, [page, selectedCategories, searchQuery, categories, loading]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  const filtered = useMemo(() => {
    let result = [...dbProducts];
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

    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (sort === "newest") result.sort((a, b) => (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0));
    else result.sort((a, b) => b.reviewCount - a.reviewCount);

    return result;
  }, [dbProducts, selectedCategories, priceRange, sort, searchQuery]);

  const paginated = filtered;


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
              const count = dbProducts.filter((p) => {
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
          max={1000}
          step={1}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full"
          style={{ accentColor: "var(--color-primary)" }}
        />
      </div>

      {/* Clear */}
      {(selectedCategories.length > 0) && (
        <button
          onClick={() => { setSelectedCategories([]); setPriceRange([0, 1000]); }}
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
              {totalProducts} products found
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
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-[280px]" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🛒</p>
              <p className="font-semibold text-gray-500">No products match your filters.</p>
              <button
                onClick={() => { setSelectedCategories([]); }}
                className="mt-3 btn-outline text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {paginated.map((p, idx) => <ProductCard key={`${p.id}-${idx}`} product={p} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {paginated.map((product, idx) => (
                <div key={`${product.id}-${idx}`} className="card flex gap-4 p-4">
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

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={productsLoading || loadingMore}
                className="btn-primary px-8 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)", color: "white" }}
              >
                {productsLoading || loadingMore ? "Loading..." : "Load More"}
              </button>
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
