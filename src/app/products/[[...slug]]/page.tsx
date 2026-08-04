"use client";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import ProductCard from "@/components/product/ProductCard";
import CategorySidebar from "@/components/layout/CategorySidebar";
import SubcategoryBar from "@/components/layout/SubcategoryBar";
import { fetchCategories, fetchProducts, fetchSubCategories, mapApiProductToProduct, getPublicAssetUrl } from "@/utils/api";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface CategoryApiItem {
  id: number | string;
  name: string;
  image?: string;
  photo?: string;
  icon?: string;
  image_url?: string;
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

function getCategoryThumbnail(c: any): string {
  const raw = c?.image || c?.photo || c?.icon || c?.image_url;
  if (raw) {
    return getPublicAssetUrl(raw);
  }
  return getPublicAssetUrl("/images/placeholder.png");
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params?.slug as string[] | undefined;

  const categorySlug = slug?.[0];
  const subcategorySlug = slug?.[1];

  const initialCategory = searchParams.get("category");
  const initialSubcategory = searchParams.get("subcategory");
  const searchQuery = searchParams.get("q") || "";
  // The voice assistant already fetched and set store.products itself, from
  // the chat API's own response - this page shouldn't run its own default
  // category fetch on top of that and clobber it. Read directly from
  // searchParams (not captured into state) so it naturally "expires" the
  // moment you do anything real here (clicking a category navigates to a
  // path without this param, dropping back to normal fetching automatically).
  const isVoiceProducts = searchParams.get("voice") === "1";

  const [categories, setCategories] = useState<CategoryApiItem[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const setStoreProducts = useCartStore((s) => s.setProducts);
  const products = useCartStore((state) => state.products);
  useEffect(() => {
    // Don't stomp on the voice-provided list with this page's own (empty,
    // since we're skipping the fetch below) local product state.
    if (isVoiceProducts) return;
    setStoreProducts(dbProducts);
  }, [dbProducts, setStoreProducts, isVoiceProducts]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");

  const subCategoryScrollRef = useRef<HTMLDivElement>(null);
  const lastFetchKeyRef = useRef<string>("");

  const scrollSubCategories = (direction: "left" | "right") => {
    if (subCategoryScrollRef.current) {
      const amount = direction === "left" ? -260 : 260;
      subCategoryScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sort, setSort] = useState("popular");
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
    } else if (categories.length > 0 && !isVoiceProducts) {
      // Auto-picking a default category would filter the voice-provided
      // list down to just that category - leave it empty instead so every
      // product the assistant returned actually shows.
      setSelectedCategories([categories[0].name]);
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
  }, [categorySlug, subcategorySlug, initialCategory, initialSubcategory, categories, isVoiceProducts]);

  // Load subcategories for active category
  useEffect(() => {
    async function loadSubCategories() {
      const activeCatName = selectedCategories[0] || (categorySlug ? decodeURIComponent(categorySlug) : initialCategory);
      if (!activeCatName) {
        setSubCategories([]);
        return;
      }

      const catObj = categories.find(
        (c) =>
          c.name.toLowerCase() === activeCatName.toLowerCase() ||
          categoryToSlug(c.name) === categoryToSlug(activeCatName)
      );

      if (!catObj) {
        setSubCategories([]);
        return;
      }

      try {
        const res = await fetchSubCategories({ category_id: String(catObj.id), limit: 100 });
        const items = res?.data || res?.subcategories || (Array.isArray(res) ? res : []);
        setSubCategories(items);
      } catch (err) {
        console.error("Failed to load subcategories for top tag bar:", err);
        setSubCategories([]);
      }
    }

    if (categories.length > 0) {
      loadSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [selectedCategories, categorySlug, initialCategory, categories]);

  // Reset page to 1 and clear product list when search or category filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategories, activeSubcategory, searchQuery]);

  useEffect(() => {
    if (isVoiceProducts) {
      // Nothing to fetch - store.products already holds exactly what the
      // assistant returned; just reflect that state and skip the network call.
      setProductsLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      setTotalProducts(products.length);
      return;
    }

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
          const activeSubSlug = categoryToSlug(activeSubcategory);
          let matchedSub = subCategories.find(
            (s: any) =>
              categoryToSlug(s.name || s.subcat_name || "") === activeSubSlug ||
              (s.name || s.subcat_name || "").toLowerCase() === activeSubcategory.toLowerCase()
          );

          if (!matchedSub) {
            try {
              const subRes = await fetchSubCategories({ category_id: catId, limit: 100 });
              const subs = subRes?.data || subRes?.subcategories || (Array.isArray(subRes) ? subRes : []);
              matchedSub = subs.find(
                (s: any) =>
                  categoryToSlug(s.name || s.subcat_name || "") === activeSubSlug ||
                  (s.name || s.subcat_name || "").toLowerCase() === activeSubcategory.toLowerCase()
              );
            } catch (e) {
              console.error("Failed to fetch subcategories for product filter:", e);
            }
          }

          if (matchedSub) {
            subId = String(matchedSub.id || matchedSub.subcategory_id);
          } else {
            setDbProducts([]);
            setTotalProducts(0);
            setHasMore(false);
            setProductsLoading(false);
            setLoadingMore(false);
            return;
          }
        }

        await fetchApiProducts(catId, subId);
        return;
      }

      await fetchApiProducts(undefined, undefined);
    }

    async function fetchApiProducts(catId?: string, subId?: string) {
      const fetchKey = `${catId || ""}_${subId || ""}_${page}_${searchQuery || ""}_${vendorVersion}`;
      if (lastFetchKeyRef.current === fetchKey && page === 1) {
        return;
      }
      lastFetchKeyRef.current = fetchKey;

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
  }, [page, selectedCategories, activeSubcategory, searchQuery, categories, loading, categorySlug, initialCategory, vendorVersion, isVoiceProducts, products.length]);

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
  const pageTitle = isVoiceProducts
    ? "Search Results"
    : searchQuery
      ? `Search Results for "${searchQuery}"`
      : currentCategoryName
        ? `${currentCategoryName}${activeSubcategory ? ` - ${activeSubcategory.replace(/-/g, " ")}` : ""}`
        : "Shop All Products";

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-4 sm:py-6 font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Header Category Title */}
      <div className="pb-3 mb-4 border-b border-gray-100 flex items-center justify-between">
        <h4 className="!text-sm !sm:text-base font-bold text-gray-800 capitalize tracking-tight m-0">
          {pageTitle}
        </h4>
        <span className="!text-xs !sm:text-base font-semibold text-gray-500">
          {totalProducts} products found
        </span>
      </div>

      {/* Main Flex Layout: Left Side Fixed Categories + Right Product Grid Section */}
      <div className="flex gap-2 sm:gap-4 md:gap-5 items-start w-full max-w-full overflow-hidden pt-0">
        <CategorySidebar 
          categories={categories}
          selectedCategoryName={
            selectedCategories.length > 0
              ? selectedCategories[0]
              : (categorySlug ? categorySlug.replace(/-/g, " ") : initialCategory || undefined)
          }
          onSelectCategory={(cat) => {
            setSelectedCategories([cat.name]);
            setActiveSubcategory("");
            setPage(1);
            const catSlug = categoryToSlug(cat.name);
            if (catSlug) {
              window.history.pushState(null, "", `/products/${catSlug}`);
            }
          }}
        />

        {/* Right Content Area: Subcategory Tags + Product Grid */}
        <div className="flex-1 min-w-0 max-w-full !overflow-hidden pt-0">
          {/* Subcategories Multi-Row Tag Bar (Wraps cleanly without scrollbars) */}

          <SubcategoryBar 
            subCategories={subCategories}
            activeSubcategory={activeSubcategory}
            onSelectSubcategory={(subName) => {
              setActiveSubcategory(subName);
              setPage(1);
              const activeCat = selectedCategories[0] || (categorySlug ? decodeURIComponent(categorySlug) : "");
              if (activeCat) {
                const catSlug = categoryToSlug(activeCat);
                if (subName) {
                  const subSlug = categoryToSlug(subName);
                  window.history.pushState(null, "", `/products/${catSlug}/${subSlug}`);
                } else {
                  window.history.pushState(null, "", `/products/${catSlug}`);
                }
              }
            }}
          />

          {/* Product Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5 w-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-[240px]" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <Image
                src={getPublicAssetUrl("/images/notfound.svg")}
                alt="No products match your filters"
                width={130}
                height={130}
                className="mb-4 object-contain"
              // style={{ width: "auto", height: "auto" }}
              />
              <p className="font-semibold text-gray-500 text-sm">No products match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5 w-full min-w-0">
              {paginated.map((p, idx) => <ProductCard key={`${p.id}-${idx}`} product={p} />)}
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
