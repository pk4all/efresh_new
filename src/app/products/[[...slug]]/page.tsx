"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Suspense } from "react";
import { Heading4, X, Loader2 } from "lucide-react";
import Image from "next/image";
import ProductCard from "@/components/product/ProductCard";
import { fetchCategories, fetchProducts, fetchSubCategories, mapApiProductToProduct, getPublicAssetUrl } from "@/utils/api";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

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

function categoryToSlug(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ShopContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params?.slug as string[] | undefined;

  const categorySlug = slug?.[0];
  const subcategorySlug = slug?.[1];

  const initialCategory = searchParams.get("category");
  const initialSubcategory = searchParams.get("subcategory");
  const searchQuery = searchParams.get("q") || "";

  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const setStoreProducts = useCartStore((s) => s.setProducts);
  const products = useCartStore((state) => state.products);
  useEffect(() => {
    setStoreProducts(dbProducts);
  }, [dbProducts, setStoreProducts]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const [vendorVersion, setVendorVersion] = useState(0);

  useEffect(() => {
    const handleVendorChange = () => {
      setPage(1);
      setVendorVersion((v) => v + 1);
    };
    window.addEventListener("pincode-updated", handleVendorChange);
    window.addEventListener("vendor-changed", handleVendorChange);
    return () => {
      window.removeEventListener("pincode-updated", handleVendorChange);
      window.removeEventListener("vendor-changed", handleVendorChange);
    };
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetchCategories({ limit: 200, offset: 0 });
        setCategories(res?.data || []);
      } catch (err) {
        console.error("Failed to load categories on shop page:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [vendorVersion]);

  // Resolve category and subcategory from URL slug or searchParams
  useEffect(() => {
    if (categorySlug) {
      const decodedCatSlug = decodeURIComponent(categorySlug).toLowerCase();
      const matchedCat = categories.find(
        (c) =>
          categoryToSlug(c.name) === decodedCatSlug ||
          c.name.toLowerCase() === decodedCatSlug
      );
      if (matchedCat) {
        setSelectedCategories([matchedCat.name]);
      } else {
        // Fallback formatting for slug if categories list is still loading
        const formatted = decodedCatSlug
          .replace(/-/g, " ")
          .replace(/\band\b/g, "&");
        const cap = formatted
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        setSelectedCategories([cap]);
      }
    } else if (initialCategory) {
      setSelectedCategories([initialCategory]);
    } else {
      setSelectedCategories([]);
    }

    if (subcategorySlug) {
      setActiveSubcategory(decodeURIComponent(subcategorySlug));
    } else if (initialSubcategory) {
      setActiveSubcategory(initialSubcategory);
    } else {
      setActiveSubcategory("");
    }
  }, [categorySlug, subcategorySlug, initialCategory, initialSubcategory, categories]);

  // Reset page to 1 and clear product list when search or category filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, activeSubcategory, searchQuery]);

  useEffect(() => {
    async function loadProducts() {
      const requestedCategory = selectedCategories.length > 0
        ? selectedCategories[0]
        : categorySlug
          ? decodeURIComponent(categorySlug)
          : initialCategory;

      if (requestedCategory) {
        const catObj = categories.find(
          (c) =>
            c.name.toLowerCase() === requestedCategory.toLowerCase() ||
            categoryToSlug(c.name) === categoryToSlug(requestedCategory)
        );

        // If category was requested but not found in backend categories list, do NOT call products API
        if (!catObj) {
          setDbProducts([]);
          setTotalProducts(0);
          setHasMore(false);
          setProductsLoading(false);
          setLoadingMore(false);
          return;
        }

        const catId = String(catObj.id);
        let subId: string | undefined = undefined;

        if (activeSubcategory) {
          try {
            const subRes = await fetchSubCategories({ category_id: catId, limit: 100 });
            const subs = subRes?.data || subRes?.subcategories || (Array.isArray(subRes) ? subRes : []);
            const activeSubSlug = categoryToSlug(activeSubcategory);
            const matchedSub = subs.find(
              (s: any) =>
                categoryToSlug(s.name || s.subcat_name || "") === activeSubSlug ||
                (s.name || s.subcat_name || "").toLowerCase() === activeSubcategory.toLowerCase()
            );

            if (matchedSub) {
              subId = String(matchedSub.id || matchedSub.subcategory_id);
            } else {
              // Subcategory requested but not found in backend, do NOT call products API
              setDbProducts([]);
              setTotalProducts(0);
              setHasMore(false);
              setProductsLoading(false);
              setLoadingMore(false);
              return;
            }
          } catch (e) {
            console.error("Failed to fetch subcategories for product filter:", e);
          }
        }

        await fetchApiProducts(catId, subId);
        return;
      }

      await fetchApiProducts(undefined, undefined);
    }

    async function fetchApiProducts(catId?: string, subId?: string) {
      try {
        if (page === 1) {
          setProductsLoading(true);
        } else {
          setLoadingMore(true);
        }

        const res = await fetchProducts({
          limit: 30,
          page: page,
          category_id: catId,
          subcategory_id: subId,
          search: searchQuery || undefined,
        });

        const items = res?.data || [];
        const mapped = items.map(mapApiProductToProduct);

        setDbProducts((prev) => (page === 1 ? mapped : [...prev, ...mapped]));

        const totalPages = res?.pagination?.totalPages || 0;
        setTotalProducts(res?.pagination?.total || 0);
        setHasMore(page < totalPages && mapped.length > 0);
      } catch (err) {
        console.error("Failed to load products on shop page:", err);
        setDbProducts([]);
        setTotalProducts(0);
        setHasMore(false);
      } finally {
        setProductsLoading(false);
        setLoadingMore(false);
      }
    }

    if (categories.length > 0 || !loading) {
      loadProducts();
    }
  }, [page, selectedCategories, activeSubcategory, searchQuery, categories, loading, categorySlug, initialCategory, vendorVersion]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter((p) => {
        const prodLower = (p.category || "").toLowerCase();
        return selectedCategories.some((selCat) => {
          const selLower = (selCat || "").toLowerCase();
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
  }, [products, selectedCategories, priceRange, sort, searchQuery]);

  const paginated = filtered;

  const currentCategoryName = selectedCategories[0] || (categorySlug ? categorySlug.replace(/-/g, " ") : "");
  const pageTitle = searchQuery
    ? `Search Results for "${searchQuery}"`
    : currentCategoryName
      ? `${currentCategoryName}${activeSubcategory ? ` - ${activeSubcategory.replace(/-/g, " ")}` : ""}`
      : "Shop All Products";

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <h4 className="section-title mb-6 capitalize">
        {pageTitle}
      </h4>
      {/* Main Content Area (Full Width) */}
      <div className="w-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <p className="text-sm font-semibold" style={{ color: "var(--color-muted)" }}>
            {totalProducts} products found
          </p>
        </div>

        {/* Product grid */}
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-[280px]" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <Image
              src={getPublicAssetUrl("/images/notfound.svg")}
              alt="No products match your filters"
              width={140}
              height={140}
              className="mb-4 object-contain"
            />
            <p className="font-semibold text-gray-500">No products match your filters.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
        {hasMore && !productsLoading && paginated.length > 0 && (
          <div className="flex justify-center mt-8 min-h-[50px] items-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={loadingMore}
              className="btn-primary px-8 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            >
              {loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Loading...</span>
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
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
