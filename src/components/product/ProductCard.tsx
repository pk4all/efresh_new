"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Eye, Info } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";
import QuickViewModal from "./QuickViewModal";
import StarRating from "./StarRating";
import { getPublicAssetUrl, getCategoryUrl } from "@/utils/api";
interface Props {
  product: Product;
}

const badgeClass: Record<string, string> = {
  Sale: "badge badge-sale",
  New: "badge badge-new",
  Organic: "badge badge-organic",
  Hot: "badge badge-hot",
};

export default function ProductCard({ product }: Props) {
  const [added, setAdded] = useState(false);
  const [quickView, setQuickView] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItem = useCartStore((s) => s.items.find((i) => i.product.id === product.id));
  const quantity = cartItem ? cartItem.quantity : 0;
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    toast.success(`${product.name} added to cart!`, {
      description: `$${product.price.toFixed(2)} × 1`,
      duration: 2500,
    });
    setTimeout(() => setAdded(false), 1600);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
    toast(isWishlisted ? "Removed from wishlist" : "Added to wishlist!", {
      icon: isWishlisted ? "💔" : "❤️",
    });
  };

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <>
      <div
        className="card group relative flex flex-col border border-gray-200"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Image */}
        <Link href={getCategoryUrl(product)} className="relative block overflow-hidden">
          <div className="relative w-full aspect-square bg-gray-50/60 max-h-[140px] sm:max-h-[180px]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-contain p-2.5 sm:p-4"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
              }}
            />
          </div>

          {/* Badge */}
          {product.badge && (
            <span className={`${badgeClass[product.badge]} absolute top-2 left-2`}>
              {product.badge}
              {product.badge === "Sale" && ` -${discount}%`}
            </span>
          )}

          {/* Top-Right Action Buttons */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-center gap-1.5 z-30">
            {/* Info (Description Tooltip) Button - Only shown if description exists */}
            {
              <div>
                <button
                  data-tooltip-id={`prod-desc-${product.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="w-8 h-8 rounded-full shadow-xs flex items-center justify-center hover:scale-110 transition-all cursor-pointer block"
                  aria-label="Product Description"
                >
                  <Info size={16} className="stroke-[2.2] text-gray-500 hover:text-[var(--theme-color1)]" />
                </button>
              </div>
            }

            {/* Other Actions (Wishlist & Quick View) - Show Only on Card Hover */}
            <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Wishlist Button */}
              <button
                onClick={handleWishlist}
                className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
                title="Wishlist"
              >
                <Heart
                  size={15}
                  fill={isWishlisted ? "#ef4444" : "none"}
                  stroke={isWishlisted ? "#ef4444" : "currentColor"}
                  className="text-gray-600"
                />
              </button>

              {/* Quick View Button */}
              <button
                onClick={(e) => { e.preventDefault(); setQuickView(true); }}
                className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
                title="Quick View"
              >
                <Eye size={15} className="text-gray-600" />
              </button>
            </div>
          </div>
        </Link>

        {/* Info */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1">
          {/* <p className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>
            {product.category}
          </p> */}
          <Link
            href={getCategoryUrl(product)}
            className="text-xs sm:text-sm font-semibold line-clamp-2 mb-1 hover:text-primary transition-colors"
            style={{ color: "var(--color-dark)" }}
          >
            {product.name}
          </Link>

          {/* Rating */}
          {/* <StarRating
            rating={product.rating}
            reviewCount={product.reviewCount}
            size={11}
          /> */}

          {/* Price & Add to Cart / Stepper Row */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-100/60">
            {/* Price Column */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="font-bold text-sm xs:text-base" style={{ color: "var(--color-primary)" }}>
                  ${product.price.toFixed(2)}
                  {product.product_type && (
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 ml-0.5">
                      / {product.product_type}
                    </span>
                  )}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-[10px] sm:text-xs line-through" style={{ color: "var(--color-muted)" }}>
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {product.stock < 10 && (
                <p className="text-[10px] font-medium m-0 leading-none mt-0.5" style={{ color: "var(--color-danger)" }}>
                  Only {product.stock} left!
                </p>
              )}
            </div>

            {/* Cart Button or Stepper */}
            <div className="shrink-0">
              {quantity > 0 ? (
                <div className="flex items-center bg-gray-100/90 p-0.5 border border-gray-200/80 shadow-2xs">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateQuantity(product.id, quantity - 1);
                      toast.success(`Updated ${product.name} quantity to ${quantity - 1}`);
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs shadow-2xs cursor-pointer active:scale-90"
                    title="Decrease quantity"
                  >
                    –
                  </button>
                  <span className="px-1.5 font-bold text-xs text-gray-900 min-w-[18px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      updateQuantity(product.id, quantity + 1);
                      toast.success(`Updated ${product.name} quantity to ${quantity + 1}`);
                    }}
                    className="w-6 h-6 flex items-center justify-center bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-bold text-xs shadow-2xs cursor-pointer active:scale-90"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
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
        </div>
      </div>

      <Tooltip
        id={`prod-desc-${product.id}`}
        // place="top"
        style={{
          zIndex: 9999,
          maxWidth: "240px",
          whiteSpace: "normal",
          wordBreak: "break-word",
          fontSize: "12px",
          lineHeight: "1.4",
          padding: "6px 10px",
        }}
      >
        {product.description || product.name}
      </Tooltip>

      {quickView && <QuickViewModal product={product} onClose={() => setQuickView(false)} />}
    </>
  );
}
