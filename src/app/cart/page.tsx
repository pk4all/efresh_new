"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.getTotalPrice());

  const couponCode = useCartStore((s) => s.couponCode);
  const storeApplyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const discount = useCartStore((s) => s.getDiscount());

  const [couponInput, setCouponInput] = useState(couponCode || "");

  const handleApplyCoupon = () => {
    const success = storeApplyCoupon(couponInput);
    if (success) {
      const discountPct = couponInput.toUpperCase() === "ORGANIC3" ? 15 : 10;
      toast.success(`Coupon applied! ${discountPct}% discount.`);
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  const delivery = subtotal > 50 ? 0 : 4.99;
  const total = subtotal - discount + delivery;

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={72} className="mx-auto mb-4 text-gray-200" />
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-dark)" }}>
          Your cart is empty
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/products" className="btn-primary inline-flex">
          Browse Products <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <div className="card overflow-hidden">
            {/* Header row */}
            <div
              className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:grid"
              style={{ backgroundColor: "var(--color-light-bg)", color: "var(--color-muted)" }}
            >
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {items.map((item) => (
              <div key={item.product.id}
                className="grid grid-cols-12 gap-3 items-center px-5 py-4 border-b last:border-0"
                style={{ borderColor: "var(--color-border)" }}>
                {/* Image + name */}
                <div className="col-span-12 sm:col-span-6 flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <Link href={`/product/${item.product.slug}`}
                      className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors"
                      style={{ color: "var(--color-dark)" }}>
                      {item.product.name}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{item.product.category}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-4 sm:col-span-2 text-sm font-medium text-center" style={{ color: "var(--color-dark)" }}>
                  ${item.product.price.toFixed(2)}
                </div>

                {/* Qty */}
                <div className="col-span-5 sm:col-span-2 flex items-center justify-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-sm border flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ borderColor: "var(--color-border)" }}>
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-sm border flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ borderColor: "var(--color-border)" }}>
                    <Plus size={12} />
                  </button>
                </div>

                {/* Total + remove */}
                <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                  <span className="font-bold text-sm" style={{ color: "var(--color-primary)" }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                  <button onClick={() => { removeItem(item.product.id); toast("Item removed"); }}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Link href="/products" className="btn-outline text-sm">
              ← Continue Shopping
            </Link>
            <button onClick={() => { clearCart(); toast("Cart cleared"); }}
              className="text-sm font-medium px-4 py-2 rounded-sm border hover:bg-red-50 hover:border-red-200 transition-colors"
              style={{ borderColor: "var(--color-border)", color: "var(--color-danger)" }}>
              Clear Cart
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--color-dark)" }}>
              <Tag size={15} style={{ color: "var(--color-primary)" }} /> Coupon Code
            </h3>
            {couponCode ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-sm p-2.5 animate-in fade-in duration-200">
                <div>
                  <p className="text-xs font-semibold text-emerald-800">Coupon "{couponCode}" Active</p>
                  <p className="text-[10px] text-emerald-600">
                    {couponCode === "ORGANIC3" ? "15%" : "10%"} discount applied
                  </p>
                </div>
                <button
                  onClick={() => {
                    removeCoupon();
                    setCouponInput("");
                    toast.info("Coupon removed");
                  }}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="e.g. FAST024"
                  className="flex-1 border rounded-sm px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                />
                <button onClick={handleApplyCoupon} className="btn-primary text-sm px-4 py-2">
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-4" style={{ color: "var(--color-dark)" }}>Order Summary</h3>
            <div className="space-y-2.5 text-sm">
              {[
                { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
                discount > 0 ? { label: "Coupon Discount", value: `-$${discount.toFixed(2)}`, green: true } : null,
                { label: "Delivery", value: delivery === 0 ? "FREE" : `$${delivery.toFixed(2)}`, green: delivery === 0 },
              ].filter(Boolean).map((row) => row && (
                <div key={row.label} className="flex justify-between">
                  <span style={{ color: "var(--color-muted)" }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: row.green ? "var(--color-primary)" : "var(--color-dark)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3 flex justify-between font-bold text-base"
                style={{ borderColor: "var(--color-border)" }}>
                <span style={{ color: "var(--color-dark)" }}>Total</span>
                <span style={{ color: "var(--color-primary)" }}>${total.toFixed(2)}</span>
              </div>
            </div>
            {subtotal < 50 && (
              <p className="text-xs mt-3 text-center" style={{ color: "var(--color-muted)" }}>
                Add ${(50 - subtotal).toFixed(2)} more for free delivery!
              </p>
            )}
            <Link href="/checkout" className="btn-primary w-full mt-4 justify-center">
              Proceed to Checkout <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
