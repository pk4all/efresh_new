"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  X, ShoppingBag, ChevronRight, ChevronDown, Minus, Plus, Trash2,
  Sparkles, Mic, MicOff, Send, HelpCircle, Search, Keyboard
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { fetchProductsFromAgent, mapApiProductToProduct } from "@/utils/api";
import { Product } from "@/types";

function VoiceAssistantSidebarPanel() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCartStore = useCartStore((s) => s.clearCart);

  const [textCommand, setTextCommand] = useState("");
  const [agentId] = useState<string>(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_9601kx436kwwe6b8bfb6f08wqn9g");
  const products = useCartStore((s) => s.products);
  const setProducts = useCartStore((s) => s.setProducts);

  const { startSession, endSession, status } = useConversation({
    onConnect: () => {
      console.log("Conversation connected");
      toast.success("Voice Agent connected");
    },
    onDisconnect: () => {
      console.log("Conversation disconnected");
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast.error("Agent encountered an error");
    },
    clientTools: {
      navigate: async (params: { page?: string; url?: string; path?: string; destination?: string }) => {
        const page = params.page || params.url || params.path || params.destination || "";
        const normalizedPage = page.toLowerCase().trim();

        if (normalizedPage.includes("home") || normalizedPage === "/" || normalizedPage === "index") {
          router.push("/");
          toast.success("Agent navigated to Home");
          return "Navigated to home page";
        } else if (normalizedPage.includes("shop") || normalizedPage.includes("product") || normalizedPage.includes("store") || normalizedPage === "/products") {
          router.push("/products");
          toast.success("Agent navigated to Shop");
          return "Navigated to shop page";
        } else if (normalizedPage.includes("cart") || normalizedPage === "/cart") {
          router.push("/cart");
          toast.success("Agent opened cart");
          return "Opened shopping cart";
        } else if (normalizedPage.includes("checkout") || normalizedPage === "/checkout") {
          router.push("/checkout");
          toast.success("Agent navigated to Checkout");
          return "Navigated to checkout page";
        } else if (normalizedPage.includes("wishlist") || normalizedPage === "/wishlist") {
          router.push("/wishlist");
          toast.success("Agent navigated to Wishlist");
          return "Navigated to wishlist page";
        } else if (normalizedPage.includes("account") || normalizedPage.includes("profile") || normalizedPage === "/account") {
          router.push("/account");
          toast.success("Agent navigated to Account");
          return "Navigated to account page";
        }
        return `Page ${page} not recognized. Choose home, shop, cart, checkout, wishlist, or account.`;
      },
      searchProducts: async (params: { query: string }) => {
        if (typeof window !== "undefined" && window.location.pathname !== "/products") {
          router.push("/products");
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const query = params.query || "";
        const res = await fetchProductsFromAgent({ limit: 100, offset: 0, search: query });
        console.log("search res", res);
        const mapped = (res?.data || []).map(mapApiProductToProduct);
        console.log(mapped, 'mapeddata');
        setProducts(mapped);
        toast.success(`Agent searched for "${query}"`);
        return `Searched for products matching "${query}"`;
      },
      addProductToCart: async (params: { productName: string, quantity: number }) => {
        const productName = params.productName || "";
        const quantity = params.quantity || 1;
        const searchName = productName.toLowerCase().trim();
        const liveProducts = useCartStore.getState().products;
        const matchedProduct = liveProducts.find((p) =>
          p.name.toLowerCase().includes(searchName)
        );

        if (matchedProduct) {
          addItem(matchedProduct, quantity || 1);
          toast.success(`Agent added ${matchedProduct.name} to Cart`);
          return `Successfully added ${matchedProduct.name} to cart`;
        } else {
          toast.error(`Agent couldn't find "${productName}"`);
          return `Failed: Product "${productName}" not found in our catalog`;
        }
      },
      removeProductToCart: async (params: { productName: string, quantity: number }) => {
        const productName = params.productName || "";
        const searchName = productName.toLowerCase().trim();
        const liveProducts = useCartStore.getState().items;
        console.log(liveProducts, 'live cart product in remove product function');
        console.log(searchName, 'search name in remove product function');
        const matchedProduct = liveProducts.find((p) =>
          p.product.name.toLowerCase().includes(searchName)
        );
        console.log(matchedProduct, 'matched product in remove product function');
        if (matchedProduct) {
          removeItem(matchedProduct.product.id);
          toast.success(`Agent removed ${matchedProduct.product.name} from Cart`);
          return `Successfully removed ${matchedProduct.product.name} from cart`;
        } else {
          toast.error(`Agent couldn't find "${productName}"`);
          return `Failed: Product "${productName}" not found in our catalog`;
        }
      },
      updateCartQuantity: async (params: { productName: string, quantity: number }) => {
        const productName = params.productName || "";
        const quantity = params.quantity || 1;
        const searchName = productName.toLowerCase().trim();
        const liveProducts = useCartStore.getState().items;
        console.log(liveProducts, 'live cart product in update quantity function');
        console.log(searchName, 'search name in update quantity function');
        const matchedProduct = liveProducts.find((p) =>
          p.product.name.toLowerCase().includes(searchName)
        );
        console.log(matchedProduct, 'matched product in update quantity function');
        if (matchedProduct) {
          updateQuantity(matchedProduct.product.id, quantity || 1);
          toast.success(`Agent updated ${matchedProduct.product.name} to Cart`);
          return `Successfully updated ${matchedProduct.product.name} to cart`;
        } else {
          toast.error(`Agent couldn't find "${productName}"`);
          return `Failed: Product "${productName}" not found in our catalog`;
        }
      },

      clearCart: async () => {
        clearCartStore();
        toast.info("Agent cleared the cart");
        return "Successfully cleared all items from the cart";
      },
      scroll: async (params: { direction: string }) => {
        const direction = params.direction || "";
        const scrollAmount = direction === "down" ? window.innerHeight * 0.6 : -window.innerHeight * 0.6;
        window.scrollBy({ top: scrollAmount, behavior: "smooth" });
        return `Successfully scrolled ${direction}`;
      },
      loadMoreProducts: async (params: { page: number }) => {
        const res = await fetchProductsFromAgent({ limit: 15, offset: 0, search: '', page: params?.page || 2 });
        const mapped = (res?.data || []).map(mapApiProductToProduct);
        setProducts(mapped);
        toast.success(`Agent loaded more products`);
        return `Successfully loaded more products`;
      },
      proceedToCheckout: async () => {
        const cartItems = useCartStore.getState().items;
        if (cartItems.length === 0) {
          toast.error("Your cart is empty. Add items before checking out.");
          return "Failed to proceed to checkout: Cart is empty";
        }
        router.push("/checkout");
        toast.success("Agent proceeding to checkout");
        return "Successfully navigated to the checkout page";
      },
    }
  });

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    const command = textCommand.trim().toLowerCase();

    if (command.includes("go to home") || command.includes("go home") || command === "home") {
      router.push("/");
      toast.success("Navigating to Home");
    } else if (command.includes("go to shop") || command.includes("shop page") || command === "shop") {
      router.push("/products");
      toast.success("Navigating to Shop");
    } else if (command.includes("go to cart") || command.includes("view cart") || command.includes("open cart") || command === "cart") {
      router.push("/cart");
      toast.success("Opened Cart");
    } else if (command.includes("go to checkout") || command === "checkout") {
      router.push("/checkout");
      toast.success("Navigating to Checkout");
    } else if (command.includes("go to wishlist") || command === "wishlist") {
      router.push("/wishlist");
      toast.success("Navigating to Wishlist");
    } else if (command.includes("go to account") || command === "account") {
      router.push("/account");
      toast.success("Navigating to Account");
    } else if (command.includes("clear cart") || command.includes("empty cart")) {
      clearCartStore();
      toast.info("Cleared Cart");
    } else if (command.includes("scroll down")) {
      window.scrollBy({ top: window.innerHeight * 0.6, behavior: "smooth" });
    } else if (command.includes("scroll up")) {
      window.scrollBy({ top: -window.innerHeight * 0.6, behavior: "smooth" });
    } else if (command.startsWith("search for ") || command.startsWith("find ")) {
      const q = command.replace(/^(search for|find)\s+/, "");
      router.push(`/products?q=${encodeURIComponent(q)}`);
      toast.success(`Searching for "${q}"`);
    } else if (command.startsWith("add ") && (command.includes(" to cart") || command.includes(" to the cart"))) {
      const match = command.match(/^add\s+(.+?)\s+to\s+(?:the\s+)?cart$/);
      if (match && match[1]) {
        const searchName = match[1].toLowerCase().trim();
        const liveProducts = useCartStore.getState().products;
        const matchedProduct = liveProducts.find((p) => p.name.toLowerCase().includes(searchName));
        if (matchedProduct) {
          addItem(matchedProduct, 1);
          toast.success(`Added ${matchedProduct.name} to Cart`);
        } else {
          toast.error(`Product "${match[1]}" not found`);
        }
      }
    } else {
      toast.error(`Command not recognized: "${command}"`);
    }

    setTextCommand("");
  };

  const handleToggleSession = async () => {
    if (isConnected) {
      await endSession();
      toast.info("Conversation ended");
    } else {
      if (!agentId) {
        toast.error("Please configure NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env first.");
        return;
      }
      try {
        toast.info("Connecting to Voice Agent...");
        await startSession({ agentId });
      } catch (err) {
        console.error("Failed to start session:", err);
        toast.error("Failed to start Agent session. Check microphone permissions.");
      }
    }
  };



  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto select-none bg-white custom-scrollbar">
      {/* Visualizer & Status */}
      <div className="bg-[#f8f9fa] rounded-2xl p-6 flex flex-col items-center justify-center min-h-[120px] border border-gray-100 mb-5 transition-all duration-300">
        {isConnected ? (
          <div className="flex items-center gap-1.5 h-6 mb-3">
            <span className="w-1 h-3 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-1 h-5 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-1 h-4 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            <span className="w-1 h-5 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></span>
            <span className="w-1 h-2 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
          </div>
        ) : isConnecting ? (
          <div className="w-8 h-8 rounded-full border-2 border-[#0da487] border-t-transparent animate-spin mb-3"></div>
        ) : (
          <MicOff size={32} className="text-gray-400 mb-3" />
        )}

        <p className="text-xs text-gray-500 font-medium text-center">
          {isConnected
            ? "Connected! Talk to the agent."
            : isConnecting
              ? "Establishing connection..."
              : "Click 'Start Voice' to speak to Agent"}
        </p>
      </div>

      {/* Connection & Action */}
      <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-5">
        <button
          onClick={handleToggleSession}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 ${isConnected
            ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
            : "bg-[#0da487]/10 text-[#0da487] hover:bg-[#0da487]/20"
            }`}
        >
          {isConnected ? "Stop Agent Session" : "Start Voice Agent"}
        </button>

        <span className="text-[10px] text-gray-400 font-bold uppercase bg-gray-100 px-2.5 py-1 rounded tracking-wider">
          EFRESH AGENT
        </span>
      </div>

      {/* Command input */}
      <form onSubmit={handleTextSubmit} className="flex gap-2 items-center bg-white p-1 border border-gray-200 rounded-xl shadow-sm mb-5 focus-within:border-[#0da487] transition-all">
        <input
          type="text"
          value={textCommand}
          onChange={(e) => setTextCommand(e.target.value)}
          placeholder="Type command (e.g. 'go to shop')"
          className="flex-1 px-3 py-2 text-xs text-gray-700 bg-white outline-none rounded-lg"
        />
        <button
          type="submit"
          className="p-2 bg-[#0da487] text-white rounded-full hover:bg-[#0bc29e] transition-colors cursor-pointer flex items-center justify-center shadow-md shadow-[#0da487]/20"
          title="Send Command"
        >
          <Send size={13} />
        </button>
      </form>

      {/* Guide */}
      <div className="flex-1 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-3">
          <HelpCircle size={12} /> TRY SAYING:
        </span>
        <ul className="flex flex-col gap-2.5 text-xs text-gray-500">
          <li className="flex items-center gap-2">
            <ShoppingBag size={12} className="text-[#0da487]" />
            <span>&quot;Go to the products page&quot;</span>
          </li>
          <li className="flex items-center gap-2">
            <Search size={12} className="text-[#0da487]" />
            <span>&quot;Search for organic grapes&quot;</span>
          </li>
          <li className="flex items-center gap-2">
            <Sparkles size={12} className="text-[#ffa53b]" />
            <span>&quot;Add organic spinach to my cart&quot;</span>
          </li>
          <li className="flex items-center gap-2">
            <ChevronRight size={12} className="text-gray-400" />
            <span>&quot;Clear my cart&quot; or &quot;Scroll down&quot;</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function RightSidebar() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.getTotalPrice());

  if (isHomepage) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 select-none font-sans">
        {/* Floating Control Panel */}
        {showFloatingPanel && (
          <div
            className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col max-h-[500px]"
            style={{ boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15)" }}
          >
            {/* Header */}
            <div className="bg-[#0da487] text-white px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="animate-pulse" />
                <span className="font-semibold text-sm">eFresh Voice Assistant</span>
              </div>
              <button
                onClick={() => setShowFloatingPanel(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content (Voice Panel) */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-white custom-scrollbar">
              <VoiceAssistantSidebarPanel />
            </div>
          </div>
        )}

        {/* Floating Action Button (FAB) with pulsing rings for user focus */}
        <div className="relative">
          {!showFloatingPanel && (
            <>
              <span className="absolute inset-0 rounded-full bg-[#0da487]/25 animate-ping" style={{ animationDuration: '2.5s' }} />
              <span className="absolute -inset-1 rounded-full bg-[#0da487]/10 animate-pulse" />
            </>
          )}
          <button
            onClick={() => setShowFloatingPanel(!showFloatingPanel)}
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl border cursor-pointer transition-all duration-300 bg-white text-gray-700 border-gray-100 hover:scale-105 active:scale-95 z-10"
            style={{ boxShadow: "0 8px 24px rgba(13, 164, 135, 0.3)", borderRadius: "50%" }}
          >
            {showFloatingPanel ? (
              <ChevronDown size={22} className="text-[#0da487]" />
            ) : (
              <Mic size={22} className="text-[#0da487] animate-pulse" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden lg:flex fixed top-0 right-0 h-screen w-[400px] bg-white border-l border-[#eceff1] z-[60] flex-col shadow-2xl overflow-hidden font-sans">
      {/* TOP HALF: CART */}
      <div className="h-1/2 flex flex-col border-b border-[#eceff1] overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#eceff1] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0da487]/10 flex items-center justify-center text-[#0da487]">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h6 className="font-bold text-sm text-gray-800 tracking-wider">
                Your Cart
              </h6>
              <p className="text-[10px] text-gray-400 font-medium">Manage your items</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#0da487] text-white">
            {items.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50 space-y-3 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-1 text-gray-300">
                <ShoppingBag size={32} />
              </div>
              <p className="font-bold text-gray-700 text-sm">Your cart is empty</p>
              <p className="text-xs text-gray-400 max-w-[200px]">Add some fresh items to your cart to checkout!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200/60 transition-all duration-300"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    unoptimized
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <span className="text-xs font-bold text-gray-800 line-clamp-1">{item.product.name}</span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs font-black text-[#0da487]">${(item.product.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-7 bg-white shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 h-full text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <Minus size={10} className="stroke-[3]" />
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-700 min-w-[20px] text-center select-none">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 h-full text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <Plus size={10} className="stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="self-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Total Summary / Checkout Buttons */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-[#eceff1] space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-bold">Total:</span>
              <span className="text-lg font-black text-gray-800">
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                className="flex items-center justify-center gap-1.5 border-2 border-[#0da487] text-[#0da487] bg-white hover:bg-[#0da487] hover:text-white active:scale-[0.97] font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all duration-300 shadow-sm text-center"
              >
                <ShoppingBag size={14} />
                View Cart
              </Link>
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-1.5 border-2 border-[#0da487] text-[#0da487] bg-white hover:bg-[#0da487] hover:text-white active:scale-[0.97] font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all duration-300 shadow-sm text-center"
              >
                Checkout
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM HALF: VOICE ASSISTANT */}
      <div className="h-1/2 flex flex-col overflow-hidden bg-white">
        {/* Voice Header with solid teal background like the screenshot */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0da487] text-white">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="animate-pulse text-white" />
            <h6 className="font-bold text-sm text-white tracking-wider">
              eFresh Voice Assistant
            </h6>
          </div>
        </div>

        {/* Voice content */}
        <VoiceAssistantSidebarPanel />
      </div>

      {/* Custom Scrollbar CSS */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #ffffff;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </aside>
  );
}
