"use client";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.getTotalPrice());

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
          style={{ animation: "fadeIn 0.2s ease" }}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-[90] bg-white shadow-2xl flex flex-col"
        style={{
          width: "min(420px, 100vw)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: "var(--color-primary)" }} />
            <h2 className="font-bold text-lg" style={{ color: "var(--color-dark)" }}>
              Your Cart
            </h2>
            <span
              className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={56} className="text-gray-200" />
              <p className="font-semibold text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add items to get started</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="btn-primary"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-xl bg-gray-50"
                >
                  <div className="relative w-16 h-16 rounded-sm overflow-hidden flex-shrink-0 bg-white">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-semibold line-clamp-2 hover:text-primary transition-colors"
                      style={{ color: "var(--color-dark)" }}
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm font-bold mt-1" style={{ color: "var(--color-primary)" }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        className="w-6 h-6 rounded-full border flex items-center justify-center text-xs hover:bg-gray-200 transition-colors"
                        style={{ borderColor: "var(--color-border)" }}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button
                        className="w-6 h-6 rounded-full border flex items-center justify-center text-xs hover:bg-gray-200 transition-colors"
                        style={{ borderColor: "var(--color-border)" }}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus size={10} />
                      </button>
                      <button
                        className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="font-bold text-lg" style={{ color: "var(--color-dark)" }}>
                ${total.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-center text-gray-400">
              Shipping calculated at checkout
            </p>
            <Link
              href="/cart"
              onClick={closeCart}
              className="btn-outline w-full justify-center"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full justify-center"
            >
              Checkout <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
