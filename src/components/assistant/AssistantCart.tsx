"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Minus, Plus, Trash2, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { getPublicAssetUrl } from "@/utils/api";

interface AssistantCartProps {
  onClose?: () => void;
  compact?: boolean;
}

export default function AssistantCart({ onClose, compact = false }: AssistantCartProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.getTotalPrice());

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="h-1/2 flex flex-col border-b border-[#eceff1] overflow-hidden">
      {/* Cart Header */}
      <div className={`flex items-center justify-between border-b border-[#eceff1] bg-white flex-shrink-0 ${compact ? 'px-4 py-3' : 'px-5 py-3.5'}`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0da487]/10 flex items-center justify-center text-[#0da487]">
            <ShoppingBag size={16} />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-800 tracking-tight block" style={{ fontSize: "16px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
              Your Cart
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-white font-bold bg-[#0da487] min-w-[20px] flex items-center justify-center" style={{ fontSize: "11px", fontWeight: 700 }}>
            {totalQuantity}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close Assistant"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Cart items list */}
      <div className={`flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar ${compact ? 'px-4 py-3 space-y-2.5' : 'px-5 py-4 space-y-3'}`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1 text-gray-300">
              <ShoppingBag size={24} />
            </div>
            <p className="font-bold text-gray-700 text-xs">Your cart is empty</p>
            <p className="text-[11px] text-gray-400 max-w-[180px]">Add fresh items to your cart!</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 p-3 rounded-md bg-white border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all duration-200"
            >
              <div className="relative w-13 h-13 rounded-xs overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="52px"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0.5">
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-bold !text-[#0c2646] truncate leading-snug" style={{ color: "#0c2646" }}>{item.product.name}</span>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    title="Remove item"
                  >
                    <Trash2 size={15} className="stroke-[1.75]" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-1.5 mt-1.5">
                  <span className="text-xs font-bold text-[#0da487] flex items-baseline gap-0.5">
                    ${(item.product.price * item.quantity).toFixed(2)}
                    {(item.product.unit_type || item.product.product_type) && (
                      <span className="text-[10px] font-normal text-[#5282b8] ml-0.5">
                        / {item.product.unit_type || item.product.product_type}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center border border-gray-300 rounded-xs bg-white px-2 py-0.5 text-xs shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="text-gray-600 hover:text-black transition-colors px-1 cursor-pointer font-bold text-xs"
                    >
                      –
                    </button>
                    <span className="font-bold text-[#0c2646] px-2 min-w-[16px] text-center select-none">{item.quantity}</span>
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
          ))
        )}
      </div>

      {/* Cart Summary & Buttons */}
      {items.length > 0 && (
        <div className={`bg-white border-t border-[#eceff1] ${compact ? 'p-3 space-y-2' : 'p-5 space-y-4'}`}>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 font-bold">Total:</span>
            <span className={`${compact ? 'text-base' : 'text-lg'} font-black text-gray-800`}>
              ${total.toFixed(2)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/cart"
              onClick={onClose}
              className="btn-outline text-xs py-1.5 px-3 text-center"
            >
              <ShoppingBag size={12} />
              <span>View Cart</span>
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-primary text-xs py-1.5 px-3 text-center"
            >
              <span>Checkout</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
