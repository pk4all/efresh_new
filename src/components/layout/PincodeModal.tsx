"use client";

import { useState, useEffect } from "react";
import { Drawer } from "rsuite";
import { Truck, Package, ShoppingBag, ChevronDown, X, Loader2, MapPin, CheckCircle2, Store, AlertTriangle } from "lucide-react";
import { getVendorByPincode } from "@/utils/api";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import "rsuite/dist/rsuite-no-reset.min.css";

interface PincodeModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function PincodeModal({ forceOpen = false, onClose }: PincodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopType, setShopType] = useState<"express" | "collect" | null>(null);
  const [selectedStore, setSelectedStore] = useState("");
  const [stores, setStores] = useState<any[]>([]);

  // Vendor change confirmation state
  const [showCartWarningModal, setShowCartWarningModal] = useState(false);
  const [hasConfirmedVendorChange, setHasConfirmedVendorChange] = useState(false);
  const [pendingVendorData, setPendingVendorData] = useState<{
    pincode: string;
    vendorId: string;
    vendorData?: any;
    shopType?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pincode");
      if (stored) {
        setPincode(stored);
      }

      if (forceOpen) {
        setIsOpen(true);
      } else if (!stored) {
        // Auto open if no pincode set yet
        setIsOpen(true);
      }

      const handleOpen = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          localStorage.setItem("pending_cart_item", JSON.stringify(customEvent.detail));
        }
        setIsOpen(true);
      };

      window.addEventListener("open-pincode-modal", handleOpen);
      return () => {
        window.removeEventListener("open-pincode-modal", handleOpen);
      };
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setShowCartWarningModal(false);
    setPendingVendorData(null);
    setHasConfirmedVendorChange(false);
    if (onClose) onClose();
  };

  const handleSearchStores = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pincode.trim()) {
      setError("Please enter a valid postcode");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getVendorByPincode(pincode.trim());
      const vendorList = Array.isArray(res?.data) ? res.data : res ? [res] : [];
      const vendorData = vendorList[0] || res;
      const vendorId = vendorData?.slug || vendorData?.name || vendorData?.id;

      if (vendorId || vendorList.length > 0) {
        setStores(vendorList);
        setSelectedStore(String(vendorId));

        const newVendorId = String(vendorId);
        const currentVendorId = localStorage.getItem("vendor_id") || "";
        const cartItems = useCartStore.getState().items;
        const isChanging = currentVendorId && newVendorId !== currentVendorId;

        if (cartItems.length > 0 && isChanging && !hasConfirmedVendorChange) {
          setPendingVendorData({
            pincode: pincode.trim(),
            vendorId: newVendorId,
            vendorData,
            shopType: shopType || "express",
          });
          setShowCartWarningModal(true);
        }
      } else {
        setError("We don't deliver to this area yet. Please try another postcode.");
      }
    } catch (err: any) {
      console.error("Error setting pincode:", err);
      setError("Delivery unavailable for this postcode. Please try another area.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStore = () => {
    if (!pincode.trim()) {
      setError("Please enter a postcode first.");
      return;
    }

    const targetVendorId = selectedStore || pendingVendorData?.vendorId || "vendor_test6";
    const currentVendorId = localStorage.getItem("vendor_id") || "";
    const cartItems = useCartStore.getState().items;
    const isChanging = currentVendorId && targetVendorId !== currentVendorId;

    if (cartItems.length > 0 && isChanging && !hasConfirmedVendorChange) {
      setPendingVendorData({
        pincode: pincode.trim(),
        vendorId: targetVendorId,
        shopType: shopType || "express",
      });
      setShowCartWarningModal(true);
      return;
    }

    // Save location and vendor preferences
    localStorage.setItem("pincode", pincode.trim());
    localStorage.setItem("vendor_id", targetVendorId);
    if (pendingVendorData?.vendorData) {
      localStorage.setItem("vendor_data", JSON.stringify(pendingVendorData.vendorData));
    }
    localStorage.setItem("shop_type", shopType || "express");

    // Clear cart if vendor was changed & user accepted
    if (cartItems.length > 0 && (isChanging || hasConfirmedVendorChange)) {
      useCartStore.getState().clearCart();
      toast.info("Vendor updated. Your cart items have been cleared.");
    } else {
      toast.success("Location & fulfillment preferences saved!");
    }

    // Trigger product list re-fetch according to chosen vendor
    window.dispatchEvent(new Event("pincode-updated"));
    window.dispatchEvent(new Event("vendor-changed"));
    window.dispatchEvent(new Event("storage"));

    handleClose();
  };

  const handleRejectVendorChange = () => {
    // Revert pincode to currently stored value and close location drawer
    const storedPincode = localStorage.getItem("pincode") || "";
    setPincode(storedPincode);
    setShowCartWarningModal(false);
    setPendingVendorData(null);
    setHasConfirmedVendorChange(false);
    handleClose();
  };

  const handleAcceptVendorChange = () => {
    // Accept vendor change: close warning popup but keep location drawer open for vendor selection
    setHasConfirmedVendorChange(true);
    setShowCartWarningModal(false);
  };

  const isDismissible = !forceOpen && typeof window !== "undefined" && !!localStorage.getItem("pincode");

  return (
    <Drawer
      open={isOpen}
      onClose={isDismissible && !showCartWarningModal ? handleClose : () => { }}
      placement="right"
      size="xs"
      backdrop={isDismissible && !showCartWarningModal ? true : "static"}
      keyboard={isDismissible && !showCartWarningModal}
      closeButton={false}
      className="pincode-drawer"
    >
      <Drawer.Body className="p-0 bg-white flex flex-col justify-between h-full font-sans select-none overflow-y-auto custom-scrollbar relative">
        <div className="p-5 space-y-5">

          {/* Elegant Top Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h6 className="text-base font-black tracking-tight uppercase text-[var(--theme-color1)] m-0">
                SET YOUR LOCATION
              </h6>
              <p className="text-[11px] text-gray-500 font-medium m-0 mt-0.5">
                Check delivery &amp; store options for your area
              </p>
            </div>
            {isDismissible && (
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                aria-label="Close location drawer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Top Banners Wrapper (Preserves space via visibility) */}
          <div className={`space-y-5 ${selectedStore ? 'visible' : 'invisible'}`}>
            {/* Minimum Order Alert Banner */}
            <div className="p-3 border border-amber-200 bg-amber-50/70 text-center text-xs text-amber-900 font-medium">
              Minimum order value for delivery is <strong className="text-amber-950 font-black">$50</strong>
            </div>

            {/* Delivery Pass Offer Badge */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3 shadow-2xs">
              <div className="text-[var(--theme-color1)] p-1 bg-white border border-emerald-100 flex-shrink-0">
                <Truck size={18} strokeWidth={2} />
              </div>
              <div className="text-xs text-gray-800 leading-snug">
                <span className="font-bold text-emerald-800 block mb-0.5">Free Delivery Offer</span>
                <span>Free delivery on orders over $200 ($120 for delivery pass holders).</span>
              </div>
            </div>
          </div>

          {/* Postcode Search Input Form */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
              Enter Postcode / Suburb
            </label>
            <form onSubmit={handleSearchStores} className="flex border border-gray-200 bg-white shadow-2xs focus-within:border-[var(--theme-color1)] transition-all">
              <div className="flex items-center pl-3 text-gray-400">
                <MapPin size={16} className="text-[var(--theme-color1)]" />
              </div>
              <input
                type="text"
                placeholder="What's your postcode? (e.g. 20117)"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  setError("");
                }}
                className="flex-1 px-2.5 py-2.5 text-xs text-gray-800 outline-none font-semibold placeholder:text-gray-400 min-w-0"
              />
              <button
                type="submit"
                disabled={loading}
                className="hover:opacity-90 active:scale-98 text-white font-bold px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 whitespace-nowrap"
                style={{ background: "var(--theme-color2)", color: "#ffffff" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Find Stores"
                )}
              </button>
            </form>
            {error && (
              <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          {selectedStore && (
            <>
              {/* Fulfillment Option Cards */}
              <div className="space-y-2 pt-1">
                <h6 className="text-xs font-bold text-gray-900 uppercase tracking-wider m-0">
                  How would you like to shop?
                </h6>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Express Local Delivery */}
                  <button
                    type="button"
                    onClick={() => setShopType("express")}
                    className={`p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border text-center relative ${shopType === "express"
                      ? "bg-emerald-50/70 border-2 border-[var(--theme-color1)] text-gray-900 shadow-2xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    {shopType === "express" && (
                      <CheckCircle2 size={16} className="absolute top-2 right-2 text-[var(--theme-color1)]" />
                    )}
                    <div className={`p-2 ${shopType === "express" ? "text-white" : "bg-gray-100 text-gray-600"}`} style={shopType === "express" ? { background: "var(--theme-color2)", color: "#ffffff" } : {}}>
                      <Package size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="font-bold text-xs block leading-tight">Express Local</span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Doorstep Delivery</span>
                    </div>
                  </button>

                  {/* Click & Collect */}
                  <button
                    type="button"
                    onClick={() => setShopType("collect")}
                    className={`p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border text-center relative ${shopType === "collect"
                      ? "bg-emerald-50/70 border-2 border-[var(--theme-color1)] text-gray-900 shadow-2xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                  >
                    {shopType === "collect" && (
                      <CheckCircle2 size={16} className="absolute top-2 right-2 text-[var(--theme-color1)]" />
                    )}
                    <div className={`p-2 ${shopType === "collect" ? "text-white" : "bg-gray-100 text-gray-600"}`} style={shopType === "collect" ? { background: "var(--theme-color2)", color: "#ffffff" } : {}}>
                      <ShoppingBag size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="font-bold text-xs block leading-tight">Click &amp; Collect</span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Pickup in Store</span>
                    </div>
                  </button>
                </div>
              </div>

              {shopType && (
                <>
                  {/* Select Store Dropdown */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-gray-600 block">
                      Preferred Store
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Store size={15} className="text-[var(--theme-color1)]" />
                      </div>
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full appearance-none border border-gray-200 pl-9 pr-8 py-2.5 text-xs text-gray-800 bg-white font-semibold outline-none focus:border-[var(--theme-color1)] cursor-pointer shadow-2xs"
                      >
                        <option value="">Select store location</option>
                        {stores.length > 0 ? (
                          stores.map((s: any) => (
                            <option key={s.id || s.slug || s.name} value={s.slug || s.name}>
                              {s.name || s.title || `Store (${s.slug || s.pincode})`}
                            </option>
                          ))
                        ) : (
                          <option value="main-store">Main Local Store (Express Available)</option>
                        )}
                      </select>
                      <ChevronDown
                        size={15}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none stroke-[2.5]"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmStore}
                      className="w-full py-3 text-xs font-bold text-white active:scale-[0.99] text-center transition-all cursor-pointer shadow-sm hover:shadow-md hover:opacity-90 uppercase tracking-wider"
                      style={{ background: "var(--theme-color2)", color: "#ffffff" }}
                    >
                      {shopType === "collect" ? "Reserve Collection" : "Save Delivery Location"}
                    </button>

                    {isDismissible && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="w-full py-2.5 text-xs font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 text-center transition-colors cursor-pointer"
                      >
                        Decide Later
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}

        </div>

        {/* Custom Vendor Change Confirmation Modal (Inside Drawer Portal for 100% Clickability) */}
        {showCartWarningModal && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            style={{ zIndex: 200000, pointerEvents: "auto" }}
          >
            <div
              className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200"
              style={{ zIndex: 200001, pointerEvents: "auto" }}
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-1">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">Vendor Change Alert</h3>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  You have changed your vendor, you have lost your cart items.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full pt-2" style={{ pointerEvents: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRejectVendorChange();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 font-bold text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer text-sm shadow-2xs"
                  style={{ pointerEvents: "auto" }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAcceptVendorChange();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer text-sm shadow-md"
                  style={{ pointerEvents: "auto" }}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer.Body>
    </Drawer>
  );
}
