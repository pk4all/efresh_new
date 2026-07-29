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
import { getPublicAssetUrl } from "@/utils/api";
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
        className="card group relative flex flex-col transition-all duration-300 hover:-translate-y-1"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Image */}
        <Link href={`/product/${product.slug}`} className="relative block overflow-hidden">
          <div className="relative w-full aspect-square bg-gray-50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-108"
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
              //product.description && product.description.trim().length > 0 && (
              <div>
                <button
                  data-tooltip-id={`prod-desc-${product.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer block"
                  aria-label="Product Description"
                >
                  <Info size={19} className="stroke-[2.2] text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              // )
            }

            {/* Other Actions (Wishlist & Quick View) - Show Only on Card Hover */}
            <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Wishlist Button */}
              <button
                onClick={handleWishlist}
                className="w-8 h-8 bg-white shadow-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
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
                className="w-8 h-8 bg-white shadow-xs flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
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
            href={`/product/${product.slug}`}
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

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-auto mb-2 flex-wrap">
            <span className="font-bold text-sm sm:text-base" style={{ color: "var(--color-primary)" }}>
              ${product.price.toFixed(2)}
              {product.product_type && (
                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 ml-0.5">
                  / {product.product_type}
                </span>
              )}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[11px] sm:text-xs line-through" style={{ color: "var(--color-muted)" }}>
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock < 10 && (
            <p className="text-[11px] sm:text-xs mb-1.5 font-medium" style={{ color: "var(--color-danger)" }}>
              Only {product.stock} left!
            </p>
          )}

          {/* Add to cart / Stepper */}
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200/60 rounded-md overflow-hidden w-full h-8 sm:h-9">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  updateQuantity(product.id, quantity - 1);
                  toast.success(`Updated ${product.name} quantity to ${quantity - 1}`);
                }}
                className="w-8 sm:w-10 h-full flex items-center justify-center bg-gray-100 hover:bg-[#4967a9]/10 hover:text-[#4967a9] text-gray-600 transition-all font-bold text-xs sm:text-sm cursor-pointer"
              >
                –
              </button>
              <span className="font-bold text-[#222] text-xs md:text-sm">{quantity}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  updateQuantity(product.id, quantity + 1);
                  toast.success(`Updated ${product.name} quantity to ${quantity + 1}`);
                }}
                className="w-8 sm:w-10 h-full flex items-center justify-center bg-gray-100 hover:bg-[#4967a9]/10 hover:text-[#4967a9] text-gray-600 transition-all font-bold text-xs sm:text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="btn-primary w-full text-[11px] sm:text-xs py-1.5 sm:py-2 gap-1 cursor-pointer"
              style={{
                backgroundColor: "var(--color-primary)",
                transition: "background-color 0.3s ease",
                color: "#fff",
              }}
            >
              <ShoppingCart size={13} />
              Add to Cart
            </button>
          )}
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
