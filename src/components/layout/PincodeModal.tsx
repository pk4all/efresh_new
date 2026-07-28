"use client";

import { useState, useEffect } from "react";
import { Drawer } from "rsuite";
import { Truck, Package, ShoppingBag, ChevronDown, X, Loader2 } from "lucide-react";
import { getVendorByPincode } from "@/utils/api";
import { toast } from "sonner";

interface PincodeModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function PincodeModal({ forceOpen = false, onClose }: PincodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopType, setShopType] = useState<"express" | "collect">("express");
  const [selectedStore, setSelectedStore] = useState("");
  const [stores, setStores] = useState<any[]>([]);

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
        localStorage.setItem("pincode", pincode.trim());
        localStorage.setItem("vendor_id", String(vendorId));
        localStorage.setItem("vendor_data", JSON.stringify(vendorData));

        toast.success(`Postcode set to ${pincode.trim()}`);
        window.dispatchEvent(new Event("pincode-updated"));
        window.dispatchEvent(new Event("storage"));
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

    localStorage.setItem("pincode", pincode.trim());
    if (selectedStore) {
      localStorage.setItem("vendor_id", selectedStore);
    }
    localStorage.setItem("shop_type", shopType);

    toast.success("Location settings saved!");
    window.dispatchEvent(new Event("pincode-updated"));
    window.dispatchEvent(new Event("storage"));
    handleClose();
  };

  const isDismissible = !forceOpen && typeof window !== "undefined" && !!localStorage.getItem("pincode");

  return (
    <Drawer
      open={isOpen}
      onClose={isDismissible ? handleClose : () => { }}
      placement="right"
      size="xs"
      backdrop={isDismissible ? true : "static"}
      keyboard={isDismissible}
      closeButton={false}
      className="pincode-drawer"
    >
      <Drawer.Body className="p-4 bg-white flex flex-col justify-between h-full font-sans select-none text-xs">
        <div className="space-y-4">
          {/* Header with Primary Blue Theme Accent */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-base font-black tracking-tight uppercase font-sans text-[#4967a9]">
              SET MY LOCATION
            </h2>
            {isDismissible && (
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Delivery Pass Offer Box with Secondary Green (#6BBE59) Icon */}
          <div className="p-2.5 border border-gray-300 rounded-md flex items-center gap-2 bg-white shadow-xs">
            <div className="text-[#6BBE59] flex-shrink-0">
              <Truck size={18} className="stroke-[1.75]" />
            </div>
            <p className="text-[11px] text-gray-700 font-medium leading-snug">
              Free delivery on orders over $200 ($120 for delivery pass holders).
            </p>
          </div>

          {/* Postcode Search Input Row */}
          <div>
            <form onSubmit={handleSearchStores} className="flex border border-gray-300 rounded-md overflow-hidden focus-within:border-[#4967a9] focus-within:ring-1 focus-within:ring-[#4967a9] transition-all bg-white">
              <input
                type="text"
                placeholder="What's your postcode?"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  setError("");
                }}
                className="flex-1 px-3 py-2 text-xs text-gray-800 outline-none font-medium placeholder:text-gray-400 min-w-0"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#6BBE59] hover:bg-[#5da84d] active:bg-[#529743] text-white font-bold px-3.5 py-2 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 whitespace-nowrap min-w-[95px]"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Finding...
                  </>
                ) : (
                  "Find Stores"
                )}
              </button>
            </form>
            {error && (
              <p className="text-red-500 text-[11px] font-semibold mt-1">{error}</p>
            )}
          </div>

          {/* How would you like to shop? */}
          <div className="pt-1">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">
              How would you like to shop?
            </h3>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {/* Express Local Option */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShopType("express")}
                  className={`w-full h-full p-2.5 rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${shopType === "express"
                    ? "bg-[#6BBE59] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                >
                  <Package size={22} className="stroke-[1.75]" />
                  <span className="font-bold text-xs tracking-tight">Express Local</span>
                </button>
              </div>

              {/* Click & Collect Option */}
              <button
                type="button"
                onClick={() => setShopType("collect")}
                className={`w-full p-2.5 rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${shopType === "collect"
                  ? "bg-[#6BBE59] text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
              >
                <ShoppingBag size={22} className="stroke-[1.75]" />
                <span className="font-bold text-xs tracking-tight">Click &amp; Collect</span>
              </button>
            </div>
          </div>

          {/* Select store dropdown */}
          <div>
            <div className="relative">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 text-xs text-gray-700 bg-white font-medium pr-8 outline-none focus:border-[#4967a9] cursor-pointer"
              >
                <option value="">Select store</option>
                {stores.length > 0 ? (
                  stores.map((s: any) => (
                    <option key={s.id || s.slug || s.name} value={s.slug || s.name}>
                      {s.name || s.title || `Store (${s.slug || s.pincode})`}
                    </option>
                  ))
                ) : (
                  <option value="main-store">Main Local Store</option>
                )}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none stroke-[2.5]"
              />
            </div>
          </div>

          {/* Reserve Collection / Confirm Action */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmStore}
              className={`w-full py-2.5 rounded-md text-xs font-bold text-center transition-all ${shopType === "collect"
                ? "bg-[#6BBE59] hover:bg-[#5da84d] text-white cursor-pointer shadow-sm"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              disabled={shopType !== "collect"}
            >
              Reserve Collection
            </button>

            <button
              type="button"
              onClick={handleConfirmStore}
              className="w-full py-2.5 rounded-md text-xs font-bold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 text-center transition-colors cursor-pointer"
            >
              Decide Later
            </button>
          </div>
        </div>

        {/* Minimum Order Value Alert Box at Bottom */}
        <div className="mt-4 p-2.5 border border-[#F8B4B4] bg-[#FDF2F2] rounded-md text-center text-[11px] text-[#991B1B] font-medium">
          Minimum order value for delivery is <span className="font-extrabold text-[#991B1B]">$50</span>
        </div>
      </Drawer.Body>
    </Drawer>
  );
}
