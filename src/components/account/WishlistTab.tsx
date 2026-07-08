"use client";

import Link from "next/link";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";

export default function WishlistTab() {
  const wishlistItems = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <div>
      <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">My Wishlist</h2>
          <p className="text-xs text-gray-400 mt-1">Products you have saved for later.</p>
        </div>
        <span className="text-xs font-semibold text-gray-400">
          {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart size={48} className="mx-auto mb-3 text-gray-255" />
          <h3 className="text-base font-bold text-gray-700">Your wishlist is empty</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">Browse products and save your favorites here!</p>
          <Link href="/products" className="btn-primary py-2 px-4 text-xs font-bold rounded-xl shadow-md inline-flex">
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((product) => (
            <div key={product.id} className="border border-gray-150 rounded-2xl p-4 relative flex flex-col hover:border-[#0da487]/30 transition-all shadow-sm">
              <button
                onClick={() => {
                  removeItem(product.id);
                  toast("Removed from wishlist 💔");
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-rose-50 transition-colors z-10 border border-gray-100 cursor-pointer"
              >
                <Trash2 size={13} className="text-gray-400 hover:text-rose-500" />
              </button>

              <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3 relative">
                <img src={product.image} className="w-full h-full object-cover" alt="" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                {product.category}
              </span>
              <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 flex-grow">
                {product.name}
              </h4>

              <div className="flex items-baseline gap-2 mt-2 mb-3">
                <span className="font-extrabold text-sm text-[#0da487]">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-xs line-through text-gray-400">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  addToCart(product);
                  openCart();
                  toast.success("Added to cart!");
                }}
                className="btn-primary w-full py-2.5 text-xs font-bold rounded-xl justify-center shadow-sm cursor-pointer"
              >
                <ShoppingCart size={13} /> Move to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
