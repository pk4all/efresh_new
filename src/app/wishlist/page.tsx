"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account?tab=wishlist");
  }, [router]);

  return (
    <div className="py-24 text-center">
      <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider animate-pulse">
        Loading Wishlist...
      </div>
    </div>
  );
}
