"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";
import QuickViewModal from "./QuickViewModal";
import StarRating from "./StarRating";

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
    openCart();
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
            />
          </div>

          {/* Badge */}
          {product.badge && (
            <span className={`${badgeClass[product.badge]} absolute top-2 left-2`}>
              {product.badge}
              {product.badge === "Sale" && ` -${discount}%`}
            </span>
          )}

          {/* Hover actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleWishlist}
              className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform"
              title="Wishlist"
            >
              <Heart
                size={15}
                fill={isWishlisted ? "#ef4444" : "none"}
                stroke={isWishlisted ? "#ef4444" : "currentColor"}
                className="text-gray-600"
              />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setQuickView(true); }}
              className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform"
              title="Quick View"
            >
              <Eye size={15} className="text-gray-600" />
            </button>
          </div>
        </Link>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs mb-1" style={{ color: "var(--color-muted)" }}>
            {product.category}
          </p>
          <Link
            href={`/product/${product.slug}`}
            className="text-sm font-semibold line-clamp-2 mb-1.5 hover:text-primary transition-colors"
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
          <div className="flex items-baseline gap-2 mt-auto mb-2">
            <span className="font-bold text-base" style={{ color: "var(--color-primary)" }}>
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs line-through" style={{ color: "var(--color-muted)" }}>
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock < 10 && (
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--color-danger)" }}>
              Only {product.stock} left!
            </p>
          )}

          {/* Add to cart / Stepper */}
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200/60 rounded-md overflow-hidden w-full h-9">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  updateQuantity(product.id, quantity - 1);
                  toast.success(`Updated ${product.name} quantity to ${quantity - 1}`);
                }}
                className="w-10 h-full flex items-center justify-center bg-gray-100 hover:bg-[#0da487]/10 hover:text-[#0da487] text-gray-600 transition-all font-bold text-sm cursor-pointer"
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
                className="w-10 h-full flex items-center justify-center bg-gray-100 hover:bg-[#0da487]/10 hover:text-[#0da487] text-gray-600 transition-all font-bold text-sm cursor-pointer"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="btn-primary w-full text-xs py-2 gap-1.5 cursor-pointer"
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

      {quickView && <QuickViewModal product={product} onClose={() => setQuickView(false)} />}
    </>
  );
}
