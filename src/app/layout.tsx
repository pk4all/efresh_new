import type { Metadata } from "next";
import "rsuite/dist/rsuite.min.css";
import "./globals.css";
import { Toaster } from "sonner";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";

export const metadata: Metadata = {
  title: "eFresh — Fresh Groceries Delivered Fast",
  description:
    "Shop fresh vegetables, fruits, dairy, beverages, and pantry essentials online. Fast delivery, organic produce, and daily deals.",
  keywords: "grocery delivery, fresh produce, organic food, online grocery",
  openGraph: {
    title: "eFresh — Fresh Groceries Delivered Fast",
    description: "Fresh groceries and daily essentials, delivered to your door.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontFamily: "Inter, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
