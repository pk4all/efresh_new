"use client";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Minus, Plus, Trash2, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

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
      <div className={`flex items-center justify-between border-b border-[#eceff1] bg-white flex-shrink-0 ${compact ? 'px-5 py-3.5' : 'px-6 py-4.5'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0da487]/10 flex items-center justify-center text-[#0da487]">
            <ShoppingBag size={18} />
          </div>
          <div>
            <h6 className="font-bold text-sm text-gray-800 tracking-wider">
              Your Cart
            </h6>
            <p className="text-[10px] text-gray-400 font-medium">Manage items</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#0da487] text-white">
            {totalQuantity}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close Assistant"
            >
              <X size={20} />
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
              className={`flex gap-2.5 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm ${!compact ? 'hover:shadow-md hover:border-gray-200/60 transition-all duration-300 p-3.5 rounded-2xl gap-3' : ''}`}
            >
              <div className={`relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100 ${compact ? 'w-12 h-12' : 'w-14 h-14 rounded-xl'}`}>
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                <span className="text-xs font-bold text-gray-800 line-clamp-1">{item.product.name}</span>
                <div className="flex items-center justify-between gap-1.5 mt-1">
                  <span className="text-xs font-black text-[#0da487]">${(item.product.price * item.quantity).toFixed(2)}</span>
                  <div className={`flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm ${compact ? 'h-6' : 'h-7'}`}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-1.5 h-full text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Minus size={compact ? 9 : 10} className="stroke-[3]" />
                    </button>
                    <span className="px-1.5 text-[11px] font-bold text-gray-700 min-w-[16px] text-center select-none">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="px-1.5 h-full text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Plus size={compact ? 9 : 10} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.product.id)}
                className="self-center p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                title="Remove item"
              >
                <Trash2 size={compact ? 13 : 14} />
              </button>
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
              className="flex items-center justify-center gap-1 border border-[#0da487] text-[#0da487] bg-white font-bold text-xs py-1.5 px-3 rounded-lg text-center hover:bg-[#0da487] hover:text-white transition-all"
            >
              <ShoppingBag size={12} />
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="flex items-center justify-center gap-1 border border-[#0da487] text-[#0da487] bg-white font-bold text-xs py-1.5 px-3 rounded-lg text-center hover:bg-[#0da487] hover:text-white transition-all"
            >
              Checkout
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
