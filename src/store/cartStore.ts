import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types";

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { "Authorization": `Bearer ${token}` } : null;
};

const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-efresh-698528526600.australia-southeast2.run.app/api/v1/storefront";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;
  products: Product[];
  setProducts: (products: Product[]) => void;
  syncCartWithDb: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  getDiscount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: null,
      products: [],
      setProducts: (products) => set({ products }),

      syncCartWithDb: async () => {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
          const cleanBase = getBaseUrl();
          const res = await fetch(`${cleanBase}/cart`, { headers });
          if (res.ok) {
            const body = await res.json();
            const cartOut = body.data || body;
            const mappedItems = (cartOut.items || []).map((item: any) => ({
              product: {
                id: String(item.product_id),
                name: item.product_name || "Unknown Product",
                price: parseFloat(item.product_price) || 0,
                originalPrice: parseFloat(item.product_price) || 0,
                image: item.product_image || "/images/placeholder.jpg",
                category: "",
                rating: 5,
                reviews: 0,
                unit: item.unit_name || "1 unit",
                stock: 99,
              },
              quantity: item.qty || 1,
            }));
            set({ items: mappedItems });
          }
        } catch (err) {
          console.error("Failed to sync cart with db:", err);
        }
      },

      addItem: (product, quantity = 1) => {
        if (typeof window !== "undefined" && !localStorage.getItem("pincode")) {
          window.dispatchEvent(new CustomEvent("open-pincode-modal", { detail: { product, quantity } }));
          return;
        }
        const headers = getAuthHeaders();
        if (headers) {
          const cleanBase = getBaseUrl();
          fetch(`${cleanBase}/cart/items`, {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product_id: parseInt(product.id),
              qty: quantity,
              unit_type_id: null,
            }),
          }).then(() => get().syncCartWithDb());
        }

        // Local fallback update
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      removeItem: (productId) => {
        const headers = getAuthHeaders();
        if (headers) {
          const cleanBase = getBaseUrl();
          fetch(`${cleanBase}/cart/items/${productId}`, {
            method: "DELETE",
            headers,
          }).then(() => get().syncCartWithDb());
        }

        // Local fallback update
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const headers = getAuthHeaders();
        if (headers) {
          const cleanBase = getBaseUrl();
          fetch(`${cleanBase}/cart/items/${productId}`, {
            method: "PUT",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              qty: quantity,
            }),
          }).then(() => get().syncCartWithDb());
        }

        // Local fallback update
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => {
        const headers = getAuthHeaders();
        if (headers) {
          const cleanBase = getBaseUrl();
          fetch(`${cleanBase}/cart`, {
            method: "DELETE",
            headers,
          }).then(() => get().syncCartWithDb());
        }

        set({ items: [], couponCode: null });
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      applyCoupon: (code) => {
        const normalized = code.toUpperCase();
        if (normalized === "FAST024" || normalized === "ORGANIC3") {
          set({ couponCode: normalized });
          return true;
        }
        return false;
      },

      removeCoupon: () => set({ couponCode: null }),

      getDiscount: () => {
        const subtotal = get().getTotalPrice();
        const code = get().couponCode;
        if (code === "FAST024") return subtotal * 0.10;
        if (code === "ORGANIC3") return subtotal * 0.15;
        return 0;
      },
    }),
    { name: "ecart-cart-storage" }
  )
);
