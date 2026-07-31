"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Plus, Minus, ArrowRight, Tag, ShoppingBag, ShoppingCart } from "lucide-react";
import { fetchProducts, mapApiProductToProduct, getPublicAssetUrl, getCategoryUrl } from "@/utils/api";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

interface SearchTypeaheadProps {
  placeholder?: string;
  className?: string;
  onSearchSubmit?: () => void;
}

export default function SearchTypeahead({
  placeholder = "I'm searching for...",
  className = "",
  onSearchSubmit,
}: SearchTypeaheadProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cart store actions & items
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems = useCartStore((s) => s.items);

  // Debounced API call for Typeahead
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchProducts({ search: trimmed, limit: 20 });
        const rawItems = res?.data || res?.products || (Array.isArray(res) ? res : []);
        const mapped = rawItems.map((item: any) => mapApiProductToProduct(item));
        setSuggestions(mapped);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Typeahead search error:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        navigateToSearch(query);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        selectProduct(suggestions[selectedIndex]);
      } else {
        navigateToSearch(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const navigateToSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsOpen(false);
    if (onSearchSubmit) onSearchSubmit();
    router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const selectProduct = (product: Product) => {
    setIsOpen(false);
    if (onSearchSubmit) onSearchSubmit();
    router.push(getCategoryUrl(product));
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const defaultPlaceholder = getPublicAssetUrl("/images/placeholder.png");

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div
        className="relative flex items-center border overflow-hidden bg-white shadow-2xs transition-all duration-200 focus-within:shadow-md focus-within:border-[var(--theme-color1)]"
        style={{ borderColor: "#e5e7eb" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && query.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 text-sm outline-none bg-white text-gray-800 placeholder-gray-400 font-medium"
        />

        {/* Clear Button */}
        {query ? (
          <button
            type="button"
            onClick={clearSearch}
            className="px-2.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}

        {/* Search Submit Button */}
        <button
          type="button"
          onClick={() => navigateToSearch(query)}
          className="px-5 py-2.5 flex items-center justify-center transition-all text-white hover:opacity-90 active:scale-95 cursor-pointer"
          style={{ background: "var(--theme-color2)" }}
          aria-label="Search button"
        >
          <Search size={18} className="stroke-[2.5]" />
        </button>

        {/* 3px Progressive Loading Bar (Left to Right animation) */}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-100/70 overflow-hidden z-20">
            <div
              className="h-full w-1/2 animate-progress-slide"
              style={{
                background: "var(--theme-color2)",
              }}
            />
          </div>
        )}
      </div>

      {/* Typeahead Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white shadow-2xl border border-gray-100 border-b-4 border-b-[var(--theme-color1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {/* Dropdown Header */}
              <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-gray-500">
                  <ShoppingBag size={13} className="text-[var(--theme-color1)]" /> Suggestions
                </span>
                <span className="bg-gray-200/60 text-gray-600 px-2 py-0.5 text-[10px] font-bold">
                  {suggestions.length} products
                </span>
              </div>

              {/* Suggestions List */}
              <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                {suggestions.map((prod, idx) => {
                  const isHighlighted = selectedIndex === idx;
                  const imgSrc = getPublicAssetUrl(prod.image);
                  const cartItem = cartItems.find((i) => String(i.product.id) === String(prod.id));
                  const quantity = cartItem ? cartItem.quantity : 0;

                  return (
                    <div
                      key={prod.id || idx}
                      onClick={() => selectProduct(prod)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 transition-all duration-150 cursor-pointer group ${isHighlighted
                          ? "bg-emerald-50/80 border-l-3 border-[var(--theme-color1)] text-[var(--theme-color1)]"
                          : "hover:bg-gray-50/90 text-gray-800"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Thumbnail */}
                        <div className="w-11 h-11 overflow-hidden relative flex-shrink-0 bg-white border border-gray-100 p-0.5 shadow-2xs">
                          <img
                            src={imgSrc}
                            alt={prod.name}
                            className="w-full h-full object-contain object-center"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = defaultPlaceholder;
                            }}
                          />
                        </div>

                        {/* Title & Details */}
                        <div className="min-w-0 flex-1">
                          <h6
                            className="!text-[0.9rem] font-semibold text-gray-800 tracking-tight leading-snug m-0 group-hover:text-[var(--theme-color1)] truncate transition-colors"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {prod.name}
                          </h6>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {prod.category && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5">
                                <Tag size={9} className="text-gray-400" />
                                {prod.category}
                              </span>
                            )}
                            {prod.product_type && (
                              <span className="text-[11px] text-gray-400 font-normal">
                                {prod.product_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price & Add / Stepper Button */}
                      <div className="flex items-center gap-3 pl-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-[var(--theme-color1)] transition-colors">
                            ${Number(prod.price).toFixed(2)}
                          </div>
                          {prod.originalPrice > prod.price && (
                            <div className="text-[10px] text-gray-400 line-through">
                              ₹{Number(prod.originalPrice).toFixed(2)}
                            </div>
                          )}
                        </div>

                        {quantity > 0 ? (
                          /* Quantity Stepper (+ / -) when item is in cart */
                          <div
                            className="flex items-center bg-gray-100/90 p-0.5 border border-gray-200/80 shadow-2xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(prod.id, quantity - 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs shadow-2xs cursor-pointer active:scale-90"
                              title="Decrease quantity"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="px-2 font-bold text-xs text-gray-900 min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(prod.id, quantity + 1);
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-bold text-xs shadow-2xs cursor-pointer active:scale-90"
                              title="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          /* Single Add (+) Button when not in cart */
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(e, prod)}
                            className="w-8 h-8 flex items-center justify-center text-white transition-all cursor-pointer shadow-2xs active:scale-95 hover:opacity-90 rounded-sm"
                            style={{ background: "var(--theme-color2)", color: "#ffffff" }}
                            title="Add to Cart"
                          >
                            <ShoppingCart
                              size={15}
                              strokeWidth={2.2}
                              className="text-white"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : !loading && query.trim().length >= 2 ? (
            /* Empty State */
            <div className="p-6 text-center">
              <div className="w-10 h-10 bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                <Search size={20} />
              </div>
              <p className="text-sm font-semibold text-gray-700 m-0">No products found</p>
              <p className="text-xs text-gray-400 mt-1 m-0">
                We couldn't find anything matching "<strong className="text-gray-600">{query}</strong>"
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
