"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPincode = localStorage.getItem("pincode");
      const storedVendor = localStorage.getItem("vendor_id");
      if (!storedPincode || !storedVendor || forceOpen) {
        setIsOpen(true);
      }
    }
  }, [forceOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode.trim()) {
      setError("Please enter a valid pincode");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await getVendorByPincode(pincode.trim());
      
      // Check for vendor_id inside response data structure
      const vendorData = res?.data || res;
      const vendorId = vendorData?.vendor_id || vendorData?.id || vendorData?.vendor?.id || vendorData?.vendor?.vendor_id;

      if (vendorId) {
        localStorage.setItem("pincode", pincode.trim());
        localStorage.setItem("vendor_id", String(vendorId));
        localStorage.setItem("vendor_data", JSON.stringify(vendorData));
        
        toast.success(`Location set! Connected to vendor ${vendorId}`);
        setIsOpen(false);
        if (onClose) onClose();
        
        // Reload page to re-fetch products/categories using the new vendor context
        window.location.reload();
      } else {
        setError("We don't deliver to this area yet. Please try another pincode.");
      }
    } catch (err: any) {
      console.error("Error setting pincode:", err);
      setError("Delivery unavailable for this pincode. Please try another area.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isDismissible = !forceOpen && typeof window !== "undefined" && !!localStorage.getItem("pincode");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Backdrop click to close (only if dismissible) */}
      {isDismissible && (
        <div className="absolute inset-0" onClick={() => { setIsOpen(false); if (onClose) onClose(); }} />
      )}

      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center z-10 animate-in zoom-in-95 duration-200 border border-gray-100">
        {isDismissible && (
          <button
            type="button"
            onClick={() => { setIsOpen(false); if (onClose) onClose(); }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            &times;
          </button>
        )}

        <div className="w-16 h-16 rounded-full bg-[#0da487]/10 flex items-center justify-center mx-auto mb-4 text-[#0da487]">
          <MapPin size={32} className="animate-bounce" />
        </div>

        <h3 className="font-extrabold text-lg text-gray-800 mb-2">
          Enter Delivery Pincode
        </h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          Provide your pincode to see the fresh stock, organic items, and delivery zones matching your local area.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              required
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value);
                setError("");
              }}
              placeholder="e.g. 3000, 2000"
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none text-center font-bold tracking-wider focus:border-[#0da487] transition-all"
            />
            {error && (
              <p className="text-red-500 text-xs font-semibold mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0da487] hover:bg-[#0bc29e] active:scale-[0.98] text-white font-bold text-sm py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-md shadow-[#0da487]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Finding Local Vendor...
              </>
            ) : (
              <>
                Check Availability
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
