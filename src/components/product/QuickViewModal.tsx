"use client";
import Image from "next/image";
import { useState } from "react";
import { X, Heart, ShoppingCart, Star, Minus, Plus } from "lucide-react";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";

interface Props {
  product: Product;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const toggleItem = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${product.name} added to cart!`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto relative"
        style={{ animation: "scaleIn 0.2s ease" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-gray-50 rounded-l-2xl overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
              sizes="300px"
            />
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col">
            <span className="text-xs font-medium mb-1" style={{ color: "var(--color-primary)" }}>
              {product.category}
            </span>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-dark)" }}>
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.round(product.rating) ? "#f59e0b" : "none"}
                    stroke={i < Math.round(product.rating) ? "#f59e0b" : "#d1d5db"}
                  />
                ))}
              </div>
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-base line-through" style={{ color: "var(--color-muted)" }}>
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock */}
            <p className="text-sm mb-3">
              <span
                className="font-semibold"
                style={{ color: product.stock > 0 ? "var(--color-primary)" : "var(--color-danger)" }}
              >
                {product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock"}
              </span>
            </p>

            {/* Description */}
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-muted)" }}>
              {product.description}
            </p>

            {/* Qty selector */}
            <div className="flex items-center gap-3 mb-4">
              <button
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ borderColor: "var(--color-border)" }}
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button
                className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
                style={{ borderColor: "var(--color-border)" }}
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              <button onClick={handleAdd} className="btn-primary flex-1">
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <button
                onClick={() => toggleItem(product)}
                className="w-11 h-11 rounded-sm border flex items-center justify-center hover:bg-red-50 transition-colors"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Heart
                  size={18}
                  fill={isWishlisted ? "#ef4444" : "none"}
                  stroke={isWishlisted ? "#ef4444" : "currentColor"}
                  className="text-gray-500"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
