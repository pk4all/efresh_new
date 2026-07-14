"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, ShoppingBag, ChevronRight, Minus, Plus, Trash2,
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
        const query = params.query || "";
        const res = await fetchProductsFromAgent({ limit: 100, offset: 0, search: query });
        const mapped = (res?.data || []).map(mapApiProductToProduct);
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
        const liveProducts = useCartStore.getState().products;
        const matchedProduct = liveProducts.find((p) =>
          p.name.toLowerCase().includes(searchName)
        );

        if (matchedProduct) {
          removeItem(matchedProduct.id);
          toast.success(`Agent removed ${matchedProduct.name} from Cart`);
          return `Successfully removed ${matchedProduct.name} from cart`;
        } else {
          toast.error(`Agent couldn't find "${productName}"`);
          return `Failed: Product "${productName}" not found in our catalog`;
        }
      },
      updateCartQuantity: async (params: { productName: string, quantity: number }) => {
        const productName = params.productName || "";
        const quantity = params.quantity || 1;
        const searchName = productName.toLowerCase().trim();
        const liveProducts = useCartStore.getState().products;
        const matchedProduct = liveProducts.find((p) =>
          p.name.toLowerCase().includes(searchName)
        );

        if (matchedProduct) {
          updateQuantity(matchedProduct.id, quantity || 1);
          toast.success(`Agent updated ${matchedProduct.name} to Cart`);
          return `Successfully updated ${matchedProduct.name} to cart`;
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

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto select-none bg-white">
      {/* Visualizer & Status */}
      <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] border border-gray-100 mb-3">
        {isConnected ? (
          <div className="flex items-center gap-1.5 h-6 mb-3">
            <span className="w-1.5 h-4 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-1.5 h-6 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-1.5 h-5 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            <span className="w-1.5 h-6 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></span>
            <span className="w-1.5 h-3 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
          </div>
        ) : isConnecting ? (
          <span className="text-xs text-[#0da487] font-medium mb-3 animate-pulse">Establishing WebRTC connection...</span>
        ) : (
          <MicOff size={28} className="text-gray-400 mb-3" />
        )}

        <p className="text-xs text-gray-500 font-medium text-center">
          {isConnected
            ? "Connected! Talk to the agent."
            : isConnecting
              ? "Connecting to ElevenLabs..."
              : "Click 'Start Agent' to talk with voice commands"}
        </p>
      </div>

      {/* Connection & Action */}
      <div className="flex items-center justify-between border-t border-b border-gray-100 py-3 mb-4">
        <button
          onClick={handleToggleSession}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${isConnected
            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            : "bg-[#0da487]/10 text-[#0da487] border border-[#0da487]/20 hover:bg-[#0da487]/20"
            }`}
        >
          {isConnected ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1"></span>
              Stop Session
            </>
          ) : (
            <>
              <Mic size={14} className="animate-pulse" />
              Start Voice Agent
            </>
          )}
        </button>

        <span className="text-[10px] text-[#0da487] font-bold uppercase bg-[#0da487]/10 px-2.5 py-1 rounded border border-[#0da487]/20">
          eFresh Agent
        </span>
      </div>

      {/* Command input */}
      <form onSubmit={handleTextSubmit} className="flex gap-2 items-center bg-gray-50 p-1 border border-gray-100 rounded-xl mb-4">
        <input
          type="text"
          value={textCommand}
          onChange={(e) => setTextCommand(e.target.value)}
          placeholder="Type command (e.g. 'go home')"
          className="flex-1 px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487]"
        />
        <button
          type="submit"
          className="p-2 bg-[#0da487] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
          title="Send Command"
        >
          <Send size={14} />
        </button>
      </form>

      {/* Guide */}
      <div className="flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-2">
          <HelpCircle size={12} /> Try Saying:
        </span>
        <ul className="flex flex-col gap-1.5 text-xs text-gray-600">
          <li className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <ShoppingBag size={13} className="text-[#0da487]" />
            <span>"Go to the product page"</span>
          </li>
          <li className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <Search size={13} className="text-[#0da487]" />
            <span>"Search for organic grapes"</span>
          </li>
          <li className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <Sparkles size={13} className="text-[#ffa53b]" />
            <span>"Add organic spinach to my cart"</span>
          </li>
          <li className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <ChevronRight size={13} className="text-gray-400" />
            <span>"Clear my cart" or "Scroll down"</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function RightSidebar() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.getTotalPrice());

  return (
    <aside className="hidden lg:flex fixed top-0 right-0 h-screen w-[400px] bg-white border-l border-[#eceff1] z-[60] flex-col shadow-2xl overflow-hidden font-sans">
      {/* TOP HALF: CART */}
      <div className="h-1/2 flex flex-col border-b border-[#eceff1] overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eceff1] bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#0da487]" />
            <span className="font-bold text-sm text-gray-800 uppercase tracking-wider">
              Your Cart
            </span>
            <span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold bg-[#0da487]">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-white space-y-2.5 custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-6">
              <ShoppingBag size={42} className="text-gray-300" />
              <p className="font-semibold text-gray-500 text-sm">Your cart is empty</p>
              <p className="text-xs text-gray-400">Add products to get started</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-gray-800 line-clamp-1">
                      {item.product.name}
                    </span>
                    <span className="text-xs font-extrabold text-[#0da487] flex-shrink-0">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-1 py-0.5">
                      <button
                        className="w-5 h-5 rounded hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={8} />
                      </button>
                      <span className="text-xs text-gray-700 font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        className="w-5 h-5 rounded hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus size={8} />
                      </button>
                    </div>

                    <button
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#eceff1] px-5 py-3.5 space-y-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Subtotal</span>
              <span className="font-bold text-sm text-gray-800">
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Link
                href="/cart"
                className="flex items-center justify-center border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-700 hover:text-gray-900 font-semibold text-xs py-2 px-3 rounded-full transition-all bg-white shadow-sm"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                className="flex items-center justify-center bg-[#0da487] hover:bg-[#0b8b72] text-white font-semibold text-xs py-2 px-3 rounded-full transition-all border border-transparent shadow-sm"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM HALF: VOICE ASSISTANT */}
      <div className="h-1/2 flex flex-col overflow-hidden">
        {/* Voice Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eceff1] bg-gray-50">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#0da487] animate-pulse" />
            <span className="font-bold text-sm text-gray-800 uppercase tracking-wider">
              eFresh Voice Assistant
            </span>
          </div>
        </div>

        {/* Voice content wrapped in ConversationProvider */}
        <ConversationProvider>
          <VoiceAssistantSidebarPanel />
        </ConversationProvider>
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
