"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import RightSidebar from "@/components/layout/RightSidebar";
import VoiceNavigation from "@/components/voice/VoiceNavigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import MegaNav from "@/components/layout/MegaNav";
import Footer from "@/components/layout/Footer";
import PincodeModal from "@/components/layout/PincodeModal";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  useEffect(() => {
    if (typeof window !== "undefined") {
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

  if (isHomepage) {
    return (
      <>
        <AnnouncementBar />
        <Header />
        <MegaNav />
        <main>{children}</main>
        <Footer />
        <VoiceNavigation />
        <PincodeModal />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 lg:pr-[400px] flex flex-col min-h-screen">
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
