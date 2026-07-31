"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, CreditCard, User, Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, Sparkles, Calendar, Truck, Clock, MapPin } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import {
  fetchUserProfile,
  fetchUserAddresses,
  addUserAddress,
  checkoutStorefront,
  loginUser,
  registerUser,
  getVendorByPincode,
  getPublicAssetUrl
} from "@/utils/api";

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

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [showAuthPw, setShowAuthPw] = useState(false);

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

  // Delivery Day & Zone state
  const [zones, setZones] = useState<any[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [selectedZoneDay, setSelectedZoneDay] = useState<{ id: number | string; zone_name: string; day_name: string; delivery_charges?: number } | null>(null);

  const loadCheckoutData = async () => {
    try {
      setLoadingAddresses(true);

      // Fetch Profile via utils/api
      try {
        const profileData = await fetchUserProfile();
        const p = profileData.data || profileData;
        const [first = "", last = ""] = (p.name || "").split(" ");
        setForm(prev => ({
          ...prev,
          firstName: prev.firstName || first,
          lastName: prev.lastName || last,
          email: prev.email || p.email || "",
          phone: prev.phone || p.contact || "",
        }));
      } catch (e) {
        console.error("Profile fetch error:", e);
      }

      // Fetch Saved Addresses via utils/api
      const addrData = await fetchUserAddresses();
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
    } catch (err) {
      console.error("Failed to load checkout data:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

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

    const checkAuthAndLoad = () => {
      const token = localStorage.getItem("token");
      if (token) {
        setIsLoggedIn(true);
        loadCheckoutData();
      } else {
        setIsLoggedIn(false);
        setLoadingAddresses(false);
        setShowNewAddressForm(false);
        setTimeout(() => {
          window.dispatchEvent(new Event("open-login-modal"));
        }, 150);
      }
    };

    checkAuthAndLoad();
    window.addEventListener("storage", checkAuthAndLoad);
    return () => window.removeEventListener("storage", checkAuthAndLoad);
  }, []);

  // Fetch Delivery Days and Zones strictly via /vendors/by-pincode API using user entered / stored pincode or shipping zip
  const fetchDeliveryZones = async () => {
    // Priority: 1. Pincode saved in localStorage (from pincode popup/user entry) 2. form.zip from selected shipping address 3. fallback "3000"
    const storedPincode = typeof window !== "undefined" ? localStorage.getItem("pincode") : null;
    const activeZip = storedPincode || form.zip || "110078";
    if (!activeZip) return;

    setLoadingZones(true);
    try {
      const res = await getVendorByPincode(activeZip);
      let fetchedZones: any[] = [];
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        fetchedZones = res.data[0]?.zones || [];
      } else if (res?.zones && Array.isArray(res.zones)) {
        fetchedZones = res.zones;
      }

      setZones(fetchedZones);

      if (fetchedZones.length > 0) {
        setSelectedZoneDay({
          id: fetchedZones[0].id,
          zone_name: fetchedZones[0].zone_name,
          day_name: fetchedZones[0].day_name,
          delivery_charges: fetchedZones[0].delivery_charges,
        });
      } else {
        setSelectedZoneDay(null);
      }
    } catch (err) {
      console.error("Error fetching delivery zones from API:", err);
      setZones([]);
      setSelectedZoneDay(null);
    } finally {
      setLoadingZones(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchDeliveryZones();
    }

    const handlePincodeChange = () => fetchDeliveryZones();
    window.addEventListener("pincode-updated", handlePincodeChange);
    window.addEventListener("storage", handlePincodeChange);
    return () => {
      window.removeEventListener("pincode-updated", handlePincodeChange);
      window.removeEventListener("storage", handlePincodeChange);
    };
  }, [form.zip, isLoggedIn, selectedAddressId]);

  const openPincodePopup = () => {
    window.dispatchEvent(new Event("open-pincode-modal"));
  };

  const openLoginPopup = () => {
    window.dispatchEvent(new Event("open-login-modal"));
  };

  const handleInlineAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      let data: any;
      if (authTab === "login") {
        data = await loginUser({
          email: authForm.email,
          password: authForm.password,
        });
      } else {
        data = await registerUser({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
        });
      }

      const token = data.data?.access_token || data.access_token;
      const customerId = data.data?.customer_id || data.customer_id;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("customer_id", String(customerId));

        try {
          const profileData = await fetchUserProfile();
          const pData = profileData.data || profileData;
          if (pData.name) {
            localStorage.setItem("name", pData.name);
          }
        } catch (_) {
          if (authForm.name) {
            localStorage.setItem("name", authForm.name);
          }
        }
      }

      toast.success(authTab === "login" ? "Successfully signed in!" : "Account created successfully!");
      window.dispatchEvent(new Event("storage"));
      setIsLoggedIn(true);
      await loadCheckoutData();
    } catch (err: any) {
      toast.error(err.message || "Authentication error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddNewAddressSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to save a new address");
      openLoginPopup();
      return;
    }

    if (!newAddressForm.main_address || !newAddressForm.main_city || !newAddressForm.main_state || !newAddressForm.zip_code) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const body = await addUserAddress({
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
      });

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
    } catch (err: any) {
      console.error("Failed to save new address:", err);
      toast.error(err.message || "Failed to save address. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login or create an account to proceed to checkout");
      openLoginPopup();
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

    if (!selectedZoneDay) {
      toast.error("Please select a delivery day & zone before proceeding");
      return;
    }

    // Call storefront-checkout API via utils/api
    try {
      const checkoutPayload = {
        address_id: Number(selectedAddressId),
        address: form.address,
        zip_code: form.zip,
        success_url: `${window.location.origin}/checkout?status=success`,
        cancel_url: `${window.location.origin}/checkout?status=cancel`,
        notes: `Delivery Day: ${selectedZoneDay.day_name} (Zone: ${selectedZoneDay.zone_name})`,
      };

      const body = await checkoutStorefront(checkoutPayload);
      const data = body.data || body;
      if (data.checkout_url) {
        toast.loading("Redirecting to payment gateway...");
        window.location.href = data.checkout_url;
      } else {
        toast.error("Checkout session created but no URL returned.");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to process checkout. Please try again.");
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
          {/* Shipping form or Auth Prompt */}
          <div className="lg:col-span-2 space-y-5">
            {!isLoggedIn ? (
              <div className="card p-6 border-2 border-emerald-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#0da487]">
                    <User size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-base text-gray-900">
                      Account Required to Complete Checkout
                    </h2>
                    <p className="text-xs text-gray-500">
                      Sign in or create a free account to choose shipping address and complete order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openLoginPopup}
                    className="btn-primary text-xs px-3.5 py-2 font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <LogIn size={14} /> Open Login Popup
                  </button>
                </div>

                {/* Auth Tab switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => setAuthTab("login")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authTab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab("register")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${authTab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Create Account
                  </button>
                </div>

                <div className="space-y-4">
                  {authTab === "register" && (
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700">Full Name *</label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text" required placeholder="John Doe"
                          value={authForm.name}
                          onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0da487]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Email Address *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email" required placeholder="you@example.com"
                        value={authForm.email}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none transition-colors focus:border-[#0da487]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Password *</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showAuthPw ? "text" : "password"} required placeholder="••••••••"
                        value={authForm.password}
                        onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full border rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none transition-colors focus:border-[#0da487]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPw(!showAuthPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showAuthPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleInlineAuthSubmit}
                      disabled={authLoading}
                      className="btn-primary flex-1 py-3 justify-center text-sm font-semibold disabled:opacity-50"
                    >
                      {authLoading
                        ? (authTab === "login" ? "Signing In..." : "Creating Account...")
                        : (authTab === "login" ? "Sign In & Continue →" : "Create Account & Continue →")
                      }
                    </button>
                    <button
                      type="button"
                      onClick={openLoginPopup}
                      className="btn-outline flex-1 py-3 justify-center text-sm font-semibold border-emerald-600 text-[#0da487] hover:bg-emerald-50"
                    >
                      Use Login Popup
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Shipping Information */}
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

                {/* 2. Delivery Day & Zone (After Shipping Information) */}
                <div className="card p-5 border-2 border-emerald-50 bg-white">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-[#0da487]" />
                      <h2 className="font-bold text-base text-gray-900">
                        Select Delivery Day & Zone <span className="text-red-500">*</span>
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={openPincodePopup}
                      className="text-xs font-semibold text-[#0da487] hover:underline flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"
                    >
                      <MapPin size={13} />
                      {typeof window !== "undefined" && localStorage.getItem("pincode")
                        ? `Pincode: ${localStorage.getItem("pincode")}`
                        : "Enter Pincode"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Based on vendor service for area <span className="font-semibold text-gray-800">{typeof window !== "undefined" && localStorage.getItem("pincode") ? localStorage.getItem("pincode") : (form.zip || "selected address")}</span>. Please select a delivery day below.
                  </p>

                  {loadingZones ? (
                    <div className="py-6 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                      <Truck className="animate-bounce text-[#0da487]" size={20} />
                      Fetching delivery days from vendor API...
                    </div>
                  ) : zones.length === 0 ? (
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium">
                      No delivery zones or schedule returned from API for pincode <span className="font-bold">{form.zip || localStorage.getItem("pincode") || "selected address"}</span>.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {zones.map((zoneItem, idx) => {
                        const isSelected = selectedZoneDay?.id === zoneItem.id && selectedZoneDay?.day_name === zoneItem.day_name;
                        return (
                          <div
                            key={zoneItem.id || idx}
                            onClick={() => setSelectedZoneDay({
                              id: zoneItem.id,
                              zone_name: zoneItem.zone_name,
                              day_name: zoneItem.day_name,
                              delivery_charges: zoneItem.delivery_charges,
                            })}
                            className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-[#0da487]/50 relative"
                            style={{
                              borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                              backgroundColor: isSelected ? "var(--color-primary-light)" : "white",
                            }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                                <Calendar size={14} className="text-[#0da487]" />
                                {zoneItem.day_name}
                              </span>
                              {isSelected && (
                                <CheckCircle size={16} className="text-[#0da487]" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                              Zone: <span className="text-gray-700">{zoneItem.zone_name}</span>
                            </p>
                            <p className="text-[11px] text-[#0da487] font-semibold mt-1">
                              {zoneItem.delivery_charges && Number(zoneItem.delivery_charges) > 0
                                ? `$${Number(zoneItem.delivery_charges).toFixed(2)} delivery fee`
                                : "FREE Delivery"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!selectedZoneDay && zones.length > 0 && (
                    <p className="text-xs text-red-500 mt-3 font-medium">
                      ⚠️ Delivery day selection required to proceed with order.
                    </p>
                  )}
                </div>

                {/* 3. Payment Method */}
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
              </>
            )}
          </div>

          {/* Order summary */}
          <div>
            <div className="card p-5 sticky top-24">
              <h2 className="font-bold text-base mb-4" style={{ color: "var(--color-dark)" }}>Order Summary</h2>
              <div className="space-y-3 max-h-52 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-gray-50 flex-shrink-0">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
                        }}
                      />
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
                  selectedZoneDay ? { label: "Delivery Day", value: `${selectedZoneDay.day_name} (${selectedZoneDay.zone_name})` } : null,
                ].filter(Boolean).map((r) => r && (
                  <div key={r.label} className="flex justify-between">
                    <span style={{ color: "var(--color-muted)" }}>{r.label}</span>
                    <span className="font-semibold text-right" style={{ color: r.green ? "var(--color-primary)" : "var(--color-dark)" }}>
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

              {isLoggedIn ? (
                <button
                  type="submit"
                  className="btn-primary w-full mt-5 justify-center py-3"
                >
                  Place Order →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLoginPopup}
                  className="btn-primary w-full mt-5 justify-center py-3"
                >
                  Sign In to Place Order →
                </button>
              )}
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
