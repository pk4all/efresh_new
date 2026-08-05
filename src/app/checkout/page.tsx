"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, CreditCard, User, Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, Sparkles, Calendar, Truck, Clock, MapPin, XCircle } from "lucide-react";
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
  const [cancelled, setCancelled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const wasLoggedInRef = useRef(false);

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
        setCancelled(true);
        // Optional: you can remove the toast if the full page is clearer
      }
    }

    const checkAuthAndLoad = () => {
      const token = localStorage.getItem("token");
      if (token) {
        wasLoggedInRef.current = true;
        setIsLoggedIn(true);
        loadCheckoutData();
      } else {
        if (wasLoggedInRef.current) {
          window.location.href = "/products";
          return;
        }
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
        success_url: `${window.location.origin}/demo/checkout?status=success`,
        cancel_url: `${window.location.origin}/demo/checkout?status=cancel`,
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

  if (cancelled) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-red-50">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-dark)" }}>
          Payment Cancelled
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
          Your payment session was cancelled or interrupted.
        </p>
        <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
          No charges were made to your account.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/products" className="btn-primary inline-flex">Back to Products</Link>
          {/* <button onClick={() => setCancelled(false)} className="btn-primary">Try Checkout Again</button> */}
        </div>
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
        <Link href="/products" className="btn-primary inline-flex">Back to Products</Link>
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
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-[#0da487] mb-4">
                    <User size={28} />
                  </div>
                  <h2 className="font-bold text-xl text-gray-900 mb-2">
                    Account Required to Checkout
                  </h2>
                  <p className="text-sm text-gray-500 mb-8 max-w-sm">
                    Please sign in or create a free account to choose your shipping address and complete your order.
                  </p>
                  <button
                    type="button"
                    onClick={openLoginPopup}
                    className="btn-primary text-sm px-6 py-3.5 font-bold flex items-center justify-center gap-2 shadow-sm w-full max-w-xs"
                  >
                    <LogIn size={18} /> Open Login Popup
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Shipping Information */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <h2 className="font-bold text-base text-gray-900">
                      {showNewAddressForm ? "Add New Address" : "Shipping Information"}
                    </h2>
                    {showNewAddressForm && addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="text-xs font-semibold text-[#0da487] hover:underline"
                      >
                        ← Select Saved Address
                      </button>
                    )}
                  </div>

                  {showNewAddressForm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                          Address Label (e.g. Home, Work) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Home"
                          value={newAddressForm.label}
                          onChange={(e) => setNewAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                          Street Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="123 Main St"
                          value={newAddressForm.main_address}
                          onChange={(e) => setNewAddressForm((prev) => ({ ...prev, main_address: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                          Apartment, Suite, etc. (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Apt 4B"
                          value={newAddressForm.apartment}
                          onChange={(e) => setNewAddressForm((prev) => ({ ...prev, apartment: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1.5">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="New York"
                            value={newAddressForm.main_city}
                            onChange={(e) => setNewAddressForm((prev) => ({ ...prev, main_city: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1.5">
                            State <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="NY"
                            value={newAddressForm.main_state}
                            onChange={(e) => setNewAddressForm((prev) => ({ ...prev, main_state: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1.5">
                            ZIP / Postal Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="10001"
                            value={newAddressForm.zip_code}
                            onChange={(e) => setNewAddressForm((prev) => ({ ...prev, zip_code: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1.5">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newAddressForm.country || "Australia"}
                            onChange={(e) => setNewAddressForm((prev) => ({ ...prev, country: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487] transition-all bg-white text-gray-800 cursor-pointer"
                          >
                            <option value="Australia">Australia</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Canada">Canada</option>
                            <option value="New Zealand">New Zealand</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2">
                        <input
                          type="checkbox"
                          id="save-addr-checkout"
                          checked={newAddressForm.default_ship}
                          onChange={(e) => setNewAddressForm((prev) => ({ ...prev, default_ship: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-[#0da487] focus:ring-[#0da487] cursor-pointer"
                        />
                        <label htmlFor="save-addr-checkout" className="text-xs font-medium text-gray-700 cursor-pointer select-none">
                          Set as default shipping address
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddNewAddressSubmit()}
                          className="px-6 py-2.5 text-sm font-bold text-white bg-[#0da487] hover:bg-[#0b9378] rounded-md cursor-pointer transition-colors shadow-sm"
                        >
                          Save Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Address List & Selection */
                    loadingAddresses ? (
                      <div className="py-4 text-center text-sm text-gray-400">Loading saved addresses...</div>
                    ) : (
                      <div className="mb-2">
                        <label className="block text-xs font-semibold mb-2" style={{ color: "var(--color-dark)" }}>
                          Select Shipping Address *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          {addresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                setForm((prev) => ({
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
                                {addr.apartment ? `${addr.apartment}, ` : ""}
                                {addr.main_address}, {addr.main_city}, {addr.main_state} {addr.zip_code}, {addr.country}
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
                    )
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
              <div className="max-h-52 overflow-y-auto category-sidebar-scrollbar pr-3 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between gap-4 pt-4 pb-1 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-14 h-14 flex-shrink-0 bg-white">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain"
                          sizes="56px"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
                          }}
                        />
                        <span className="absolute -top-2 -right-2 w-5 h-5 text-white text-[11px] flex items-center justify-center font-bold z-10 shadow-sm"
                          style={{ backgroundColor: "var(--color-primary)" }}>
                          {item.quantity}
                        </span>
                      </div>
                      <p className="text-sm font-bold line-clamp-2" style={{ color: "var(--color-dark)" }}>{item.product.name}</p>
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
    </div>
  );
}
