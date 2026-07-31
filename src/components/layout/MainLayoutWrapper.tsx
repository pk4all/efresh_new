"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import RightSidebar from "@/components/layout/RightSidebar";
import Header from "@/components/layout/Header";
import MegaNav from "@/components/layout/MegaNav";
import Footer from "@/components/layout/Footer";
import PincodeModal from "@/components/layout/PincodeModal";
import CookieConsentDrawer from "@/components/layout/CookieConsentDrawer";
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
        let sessionExpiredHandledAt = 0;
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);

          // Only successful/error status matters here - inspecting 200 OK
          // bodies too meant any endpoint's *successful* response (e.g. the
          // cart) that happened to mention "token" anywhere would get
          // misread as a session expiry, wiping a token that had just been
          // set (right after a fresh login) and re-popping the login modal.
          if (!response.ok) {
            const clone = response.clone();
            try {
              const body = await clone.json();
              const detail = body?.detail;
              const looksLikeAuthError =
                detail === "Invalid or expired token." ||
                detail === "Not authenticated" ||
                (typeof detail === "string" &&
                  (detail.toLowerCase().includes("token") || detail.toLowerCase().includes("not authenticated")));

              // Debounce: several requests can fail with the same auth error
              // in a burst (e.g. cart + agent session firing close together)
              // - only actually act on it once per short window instead of
              // stacking up repeated token wipes / modals / toasts.
              if (looksLikeAuthError && Date.now() - sessionExpiredHandledAt > 3000) {
                sessionExpiredHandledAt = Date.now();
                localStorage.removeItem("token");
                localStorage.removeItem("customer_id");
                localStorage.removeItem("name");
                window.dispatchEvent(new CustomEvent("open-login-modal"));
                toast.error("Session expired. Please log in again.");
              }
            } catch (e) {
              // Not JSON
            }
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
        <div className={`flex-1 flex flex-col min-h-screen ${isHomepage ? "" : "lg:pr-[320px]"}`}>
          <Header />
          <MegaNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <RightSidebar />
        <PincodeModal />
        <CookieConsentDrawer />
      </div>
  );
}
