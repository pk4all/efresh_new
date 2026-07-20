"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, CreditCard } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
];

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getTotalPrice());
  const clearCart = useCartStore((s) => s.clearCart);

  const [payment, setPayment] = useState("card");
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", zip: "", country: "Australia",
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: "Home",
    main_address: "",
    apartment: "",
    main_city: "",
    main_state: "",
    zip_code: "",
    country: "Australia",
    default_ship: false,
  });

  // Fetch profile, addresses and check Stripe status parameters
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("status") === "success") {
        setSuccess(true);
        clearCart();
        localStorage.removeItem("agent_session_id");
      } else if (params.get("status") === "cancel") {
        toast.error("Payment session was cancelled. Please try again.");
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setLoadingAddresses(false);
      setShowNewAddressForm(true);
      return;
    }

    const loadCheckoutData = async () => {
      try {
        setLoadingAddresses(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
        const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

        // Fetch Profile to prefill contact info
        const profileRes = await fetch(`${cleanBase}/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.data || profileData;
          const [first = "", last = ""] = (p.name || "").split(" ");
          setForm(prev => ({
            ...prev,
            firstName: prev.firstName || first,
            lastName: prev.lastName || last,
            email: prev.email || p.email || "",
            phone: prev.phone || p.contact || "",
          }));
        }

        // Fetch Saved Addresses
        const addrRes = await fetch(`${cleanBase}/addresses`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          const list = addrData.data || addrData || [];
          setAddresses(list);

          // Find default address
          const def = list.find((a: any) => a.default_ship === 1);
          if (def) {
            setSelectedAddressId(def.id);
            setForm(prev => ({
              ...prev,
              address: def.main_address || "",
              city: def.main_city || "",
              zip: def.zip_code || "",
              country: def.country || "Australia",
            }));
          } else if (list.length > 0) {
            setSelectedAddressId(list[0].id);
            setForm(prev => ({
              ...prev,
              address: list[0].main_address || "",
              city: list[0].main_city || "",
              zip: list[0].zip_code || "",
              country: list[0].country || "Australia",
            }));
          } else {
            setShowNewAddressForm(true);
            setSelectedAddressId("new");
          }
        }
      } catch (err) {
        console.error("Failed to load checkout data:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadCheckoutData();
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleAddNewAddressSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to save a new address");
      return;
    }

    if (!newAddressForm.main_address || !newAddressForm.main_city || !newAddressForm.main_state || !newAddressForm.zip_code) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const res = await fetch(`${cleanBase}/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          address: newAddressForm.label || "Other",
          main_address: newAddressForm.main_address,
          apartment: newAddressForm.apartment || null,
          main_city: newAddressForm.main_city,
          main_state: newAddressForm.main_state,
          zip_code: newAddressForm.zip_code,
          country: newAddressForm.country || "Australia",
          default_ship: newAddressForm.default_ship ? 1 : 0,
          billing_deliveryAddress: 3,
          notes: "",
          latitude: "0",
          longitude: "0",
        }),
      });

      if (res.ok) {
        const body = await res.json();
        const newAddr = body.data || body;
        
        // Add new address to address list
        setAddresses(prev => [...prev, newAddr]);
        
        // Auto select new address
        setSelectedAddressId(newAddr.id);
        setForm(prev => ({
          ...prev,
          address: newAddr.main_address || "",
          city: newAddr.main_city || "",
          zip: newAddr.zip_code || "",
          country: newAddr.country || "Australia",
        }));

        toast.success("New address saved and selected!");
        setShowNewAddressForm(false);

        // Reset form
        setNewAddressForm({
          label: "Home",
          main_address: "",
          apartment: "",
          main_city: "",
          main_state: "",
          zip_code: "",
          country: "Australia",
          default_ship: false,
        });
      } else {
        const errBody = await res.json().catch(() => ({}));
        const message = errBody.detail || errBody.message || "Failed to save address";
        toast.error(typeof message === "string" ? message : JSON.stringify(message));
      }
    } catch (err) {
      console.error("Failed to save new address:", err);
      toast.error("Failed to save address. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to proceed to checkout");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedAddressId || selectedAddressId === "new") {
      toast.error("Please select a shipping address first, or add a new one");
      return;
    }

    // Call storefront-checkout API
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

      const checkoutPayload = {
        address_id: Number(selectedAddressId),
        address: form.address,
        zip_code: form.zip,
        success_url: `${window.location.origin}/checkout?status=success`,
        cancel_url: `${window.location.origin}/checkout?status=cancel`,
        notes: "Deliver during shifts",
      };

      const checkoutRes = await fetch(`${cleanBase}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (checkoutRes.ok) {
        const body = await checkoutRes.json();
        const data = body.data || body;
        if (data.checkout_url) {
          toast.loading("Redirecting to payment gateway...");
          window.location.href = data.checkout_url;
        } else {
          toast.error("Checkout session created but no URL returned.");
        }
      } else {
        const errBody = await checkoutRes.json().catch(() => ({}));
        const message = errBody.detail || errBody.message || "Checkout validation failed";
        toast.error(typeof message === "string" ? message : JSON.stringify(message));
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to process checkout. Please try again.");
    }
  };

  const discount = useCartStore((s) => s.getDiscount());
  const delivery = subtotal > 50 ? 0 : 4.99;
  const total = subtotal - discount + delivery;

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-gray-500">
        Loading checkout details...
      </div>
    );
  }

  if (success || submitted) {
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
          Thank you! Your order has been confirmed and is being processed.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
          You will receive updates about your delivery status shortly.
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

              {/* Address List & Selection */}
              {loadingAddresses ? (
                <div className="py-4 text-center text-sm text-gray-400">Loading saved addresses...</div>
              ) : (
                <div className="mb-5">
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--color-dark)" }}>
                    Select Shipping Address *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setForm(prev => ({
                            ...prev,
                            address: addr.main_address || "",
                            city: addr.main_city || "",
                            zip: addr.zip_code || "",
                            country: addr.country || "Australia",
                          }));
                        }}
                        className="p-3.5 rounded-xl border-2 cursor-pointer transition-all hover:border-[#0da487]/50"
                        style={{
                          borderColor: selectedAddressId === addr.id ? "var(--color-primary)" : "var(--color-border)",
                          backgroundColor: selectedAddressId === addr.id ? "var(--color-primary-light)" : "white",
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm" style={{ color: "var(--color-dark)" }}>
                            {addr.address || "Address"}
                          </span>
                          {addr.default_ship === 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#0da487]/10 text-[#0da487] font-semibold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {addr.apartment ? `${addr.apartment}, ` : ""}{addr.main_address}, {addr.main_city}, {addr.main_state} {addr.zip_code}, {addr.country}
                        </p>
                      </div>
                    ))}

                    <div
                      onClick={() => {
                        setShowNewAddressForm(true);
                      }}
                      className="p-3.5 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:border-[#0da487]/50"
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "white",
                      }}
                    >
                      <span className="font-bold text-sm text-[#0da487]">+ Add New Address</span>
                      <span className="text-[10px] text-gray-400 mt-1">Ship to a different location</span>
                    </div>
                  </div>
                </div>
              )}
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
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="48px" unoptimized />
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
      {showNewAddressForm && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 transition-opacity">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setShowNewAddressForm(false)} />
          
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-dark)" }}>Add New Address</h3>
              <button
                type="button"
                onClick={() => setShowNewAddressForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold outline-none"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                  Address Label (e.g. Home, Work) *
                </label>
                <input
                  type="text" required placeholder="e.g. Home, Work"
                  value={newAddressForm.label}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                  Street Address *
                </label>
                <input
                  type="text" required placeholder="123 Main St"
                  value={newAddressForm.main_address}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, main_address: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                  Apartment, Suite, etc. (Optional)
                </label>
                <input
                  type="text" placeholder="Apt 4B"
                  value={newAddressForm.apartment}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, apartment: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                    City *
                  </label>
                  <input
                    type="text" required placeholder="New York"
                    value={newAddressForm.main_city}
                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, main_city: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                    State *
                  </label>
                  <input
                    type="text" required placeholder="NY"
                    value={newAddressForm.main_state}
                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, main_state: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                    ZIP / Postal Code *
                  </label>
                  <input
                    type="text" required placeholder="10001"
                    value={newAddressForm.zip_code}
                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, zip_code: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-dark)" }}>
                    Country *
                  </label>
                  <select
                    required value={newAddressForm.country}
                    onChange={(e) => setNewAddressForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {["Australia", "United States", "United Kingdom", "Canada", "India"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox" id="save-addr"
                  checked={newAddressForm.default_ship}
                  onChange={(e) => setNewAddressForm(prev => ({ ...prev, default_ship: e.target.checked }))}
                  className="rounded accent-[#0da487] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="save-addr" className="text-xs text-gray-600 font-medium cursor-pointer select-none">
                  Set as default shipping address
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3 bg-gray-50" style={{ borderColor: "var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setShowNewAddressForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddNewAddressSubmit()}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors bg-[#0da487] hover:bg-[#0bc29e]"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
