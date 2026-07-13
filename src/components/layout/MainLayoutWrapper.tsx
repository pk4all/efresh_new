"use client";

import { usePathname } from "next/navigation";
import RightSidebar from "@/components/layout/RightSidebar";
import VoiceNavigation from "@/components/voice/VoiceNavigation";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import MegaNav from "@/components/layout/MegaNav";
import Footer from "@/components/layout/Footer";

interface MainLayoutWrapperProps {
  children: React.ReactNode;
}

export default function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (isHomepage) {
    return (
      <>
        <AnnouncementBar />
        <Header />
        <MegaNav />
        <main>{children}</main>
        <Footer />
        <VoiceNavigation />
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
    </div>
  );
}
