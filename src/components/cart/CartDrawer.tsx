"use client";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getPublicAssetUrl, getCategoryUrl } from "@/utils/api";

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
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={closeCart}
          style={{ animation: "fadeIn 0.2s ease" }}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-[100006] bg-white shadow-2xl flex flex-col font-sans w-full sm:w-[360px] transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] flex-shrink-0">
              <ShoppingBag size={16} />
            </div>
            <h3
              className="font-bold text-base text-gray-800 tracking-tight"
              style={{ fontSize: "16px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}
            >
              Your Cart
            </h3>
            <span
              className="px-2 py-0.5 rounded-full text-white font-bold flex items-center justify-center min-w-[20px]"
              style={{ backgroundColor: "var(--color-primary)", fontSize: "11px", fontWeight: 700 }}
            >
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500 hover:text-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-6">
              <Image
                src={getPublicAssetUrl("/images/notfound.svg")}
                alt="Your cart is empty"
                width={85}
                height={85}
                className="object-contain mb-1"
              // style={{ width: "auto", height: "auto" }}
              />
              <p className="font-bold text-gray-700 text-xs">Your cart is empty</p>
              <p className="text-[11px] text-gray-400">Add items to get started</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="btn-primary text-xs py-2 px-4 mt-1"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-2.5 py-2.5 px-1 bg-white hover:bg-gray-50/50 transition-colors"
                >
                  <div className="relative w-11 h-11 rounded-xs overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      unoptimized
                      className="object-contain p-1"
                      sizes="44px"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <Link
                        href={getCategoryUrl(item.product)}
                        onClick={closeCart}
                        className="text-xs font-bold !text-[#0c2646] truncate leading-snug hover:!text-[var(--theme-color)] transition-colors block"
                        style={{ color: "#0c2646" }}
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 size={14} className="stroke-[1.75]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 mt-1">
                      <span className="text-xs font-bold text-[#0da487] flex items-baseline gap-0.5">
                        ${(item.product.price * item.quantity).toFixed(2)}
                        {(item.product.unit_type || item.product.product_type) && (
                          <span className="text-[10px] font-normal text-[#5282b8] ml-0.5">
                            / {item.product.unit_type || item.product.product_type}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center border border-gray-200 rounded-xs bg-white px-1.5 py-0.5 text-xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="text-gray-600 hover:text-black transition-colors px-1 cursor-pointer font-bold text-xs"
                        >
                          –
                        </button>
                        <span className="font-bold text-[#0c2646] px-1.5 min-w-[14px] text-center select-none text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="text-gray-600 hover:text-black transition-colors px-1 cursor-pointer font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t px-4 py-3 space-y-2.5 bg-white" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">Subtotal</span>
              <span className="font-extrabold text-base" style={{ color: "var(--color-dark)" }}>
                ${total.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-center text-gray-400">
              Shipping calculated at checkout
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <Link
                href="/cart"
                onClick={closeCart}
                className="btn-outline justify-center py-2 px-2 text-xs font-bold"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn-primary justify-center py-2 px-2 text-xs font-bold"
              >
                Checkout <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
