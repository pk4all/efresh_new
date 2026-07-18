"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import RightSidebar from "@/components/layout/RightSidebar";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import MegaNav from "@/components/layout/MegaNav";
import Footer from "@/components/layout/Footer";
import PincodeModal from "@/components/layout/PincodeModal";
import { toast } from "sonner";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Intercept fetch calls for token expiration
      if (!(window as any).__fetch_intercepted__) {
        (window as any).__fetch_intercepted__ = true;
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          const clone = response.clone();
          try {
            const body = await clone.json();
            if (body && (body.detail === "Invalid or expired token." || body.detail === "Not authenticated" || (typeof body.detail === "string" && (body.detail.toLowerCase().includes("token") || body.detail.toLowerCase().includes("not authenticated"))))) {
              localStorage.removeItem("token");
              localStorage.removeItem("customer_id");
              localStorage.removeItem("name");
              window.dispatchEvent(new CustomEvent("open-login-modal"));
              toast.error("Session expired. Please log in again.");
            }
          } catch (e) {
            // Not JSON
          }
          return response;
        };
      }

      // Check pending cart item from pincode redirect
      const pendingItemStr = localStorage.getItem("pending_cart_item");
      if (pendingItemStr) {
        try {
          const { product, quantity } = JSON.parse(pendingItemStr);
          useCartStore.getState().addItem(product, quantity);
        } catch (e) {
          console.error("Failed to add pending cart item:", e);
        } finally {
          localStorage.removeItem("pending_cart_item");
        }
      }
    }
  }, []);

  return (
      <div className="flex min-h-screen bg-white">
        <div className={`flex-1 flex flex-col min-h-screen ${isHomepage ? "" : "lg:pr-[400px]"}`}>
          <AnnouncementBar />
          <Header />
          <MegaNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <RightSidebar />
        <PincodeModal />
      </div>
  );
}
