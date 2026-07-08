"use client";
import { useState } from "react";
import Image from "next/image";
import { CheckCircle, CreditCard, Smartphone, DollarSign } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "cod", label: "Cash on Delivery", icon: DollarSign },
];

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getTotalPrice());
  const clearCart = useCartStore((s) => s.clearCart);

  const [payment, setPayment] = useState("card");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "United States",
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearCart();
  };

  const discount = useCartStore((s) => s.getDiscount());
  const delivery = subtotal > 50 ? 0 : 4.99;
  const total = subtotal - discount + delivery;

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: "var(--color-primary-light)" }}>
          <CheckCircle size={40} style={{ color: "var(--color-primary)" }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-dark)" }}>
          Order Placed! 🎉
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          Thank you, {form.firstName}! Your order has been confirmed and will be delivered soon.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
          Confirmation sent to <strong>{form.email}</strong>
        </p>
        <a href="/" className="btn-primary inline-flex">Back to Home</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="section-title mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5">
              <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-dark)" }}>
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "First Name", key: "firstName", placeholder: "John" },
                  { label: "Last Name", key: "lastName", placeholder: "Doe" },
                  { label: "Email", key: "email", placeholder: "john@example.com" },
                  { label: "Phone", key: "phone", placeholder: "+1 (555) 000-0000" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                      {label} *
                    </label>
                    <input
                      type="text" required placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={update(key as keyof typeof form)}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                    Address *
                  </label>
                  <input required placeholder="123 Main St, Apt 4B"
                    value={form.address} onChange={update("address")}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }} />
                </div>
                {[
                  { label: "City", key: "city", placeholder: "New York" },
                  { label: "ZIP Code", key: "zip", placeholder: "10001" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                      {label} *
                    </label>
                    <input required placeholder={placeholder}
                      value={form[key as keyof typeof form]}
                      onChange={update(key as keyof typeof form)}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ borderColor: "var(--color-border)" }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>Country *</label>
                  <select required value={form.country} onChange={update("country")}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }}>
                    {["United States", "United Kingdom", "Canada", "Australia", "India"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="card p-5">
              <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-dark)" }}>
                Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                  <label key={id}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: payment === id ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: payment === id ? "var(--color-primary-light)" : "white",
                    }}>
                    <input type="radio" name="payment" value={id}
                      checked={payment === id} onChange={() => setPayment(id)} className="sr-only" />
                    <div className="w-9 h-9 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: payment === id ? "var(--color-primary)" : "var(--color-light-bg)" }}>
                      <Icon size={18} className={payment === id ? "text-white" : "text-gray-400"} />
                    </div>
                    <span className="font-semibold text-sm" style={{ color: "var(--color-dark)" }}>{label}</span>
                    {payment === id && (
                      <CheckCircle size={16} className="ml-auto" style={{ color: "var(--color-primary)" }} />
                    )}
                  </label>
                ))}
              </div>

              {payment === "card" && (
                <div className="mt-4 space-y-3">
                  <input placeholder="Card number" className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }} />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="MM / YY" className="border rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ borderColor: "var(--color-border)" }} />
                    <input placeholder="CVV" className="border rounded-xl px-3 py-2.5 text-sm outline-none"
                      style={{ borderColor: "var(--color-border)" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="card p-5 sticky top-24">
              <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-dark)" }}>Order Summary</h2>
              <div className="space-y-3 max-h-52 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="48px" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold"
                        style={{ backgroundColor: "var(--color-primary)" }}>
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-2" style={{ color: "var(--color-dark)" }}>{item.product.name}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--color-primary)" }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                {[
                  { label: "Subtotal", value: `$${subtotal.toFixed(2)}` },
                  discount > 0 ? { label: "Coupon Discount", value: `-$${discount.toFixed(2)}`, green: true } : null,
                  { label: "Delivery", value: delivery === 0 ? "FREE" : `$${delivery.toFixed(2)}`, green: delivery === 0 },
                ].filter(Boolean).map((r) => r && (
                  <div key={r.label} className="flex justify-between">
                    <span style={{ color: "var(--color-muted)" }}>{r.label}</span>
                    <span className="font-semibold" style={{ color: r.green ? "var(--color-primary)" : "var(--color-dark)" }}>
                      {r.value}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between font-bold text-base"
                  style={{ borderColor: "var(--color-border)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--color-primary)" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-5 justify-center py-3">
                Place Order →
              </button>
              <p className="text-xs text-center mt-2" style={{ color: "var(--color-muted)" }}>
                🔒 Secured by SSL encryption
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
