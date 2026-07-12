"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Sparkles, X, ChevronDown, ShoppingBag, Search, HelpCircle, Keyboard, Send } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
// import { products } from "@/data/products";
import { toast } from "sonner";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { fetchProductsFromAgent, mapApiProductToProduct } from "@/utils/api";
import { Product } from "@/types";
function VoiceNavigationInner() {
  const router = useRouter();
  const openCart = useCartStore((s) => s.openCart);
  const addItem = useCartStore((s) => s.addItem);
  const clearCartStore = useCartStore((s) => s.clearCart);

  const [textCommand, setTextCommand] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [agentId, setAgentId] = useState<string>(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_9601kx436kwwe6b8bfb6f08wqn9g");
  const products = useCartStore((s) => s.products);
  const setProducts = useCartStore((s) => s.setProducts);

  useEffect(() => {
    console.log(products, 'products updated');
  }, [products]);

  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "agent_9601kx436kwwe6b8bfb6f08wqn9g";
    startSession({ agentId: id });
    return () => {
      endSession();
    };
  }, []);

  const { startSession, endSession, status } = useConversation({
    onConnect: () => {
      console.log("Conversation connected");
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
        console.log(params, "navigate params");
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
          //openCart();
          router.push("/cart");
          toast.success("Agent opened cart drawer");
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
        console.log('================query', query, params);
        const res = await fetchProductsFromAgent({ limit: 100, offset: 0, search: query });
        const mapped = (res?.data || []).map(mapApiProductToProduct);
        setProducts(mapped);
        toast.success(`Agent searched for "${query}"`);
        return `Searched for products matching "${query}"`;
      },
      addProductToCart: async (params: { productName: string }) => {
        const productName = params.productName || "";
        const searchName = productName.toLowerCase().trim();
        const liveProducts = useCartStore.getState().products;
        const matchedProduct = liveProducts.find((p) =>
          p.name.toLowerCase().includes(searchName)
        );

        if (matchedProduct) {
          addItem(matchedProduct, 1);
          toast.success(`Agent added ${matchedProduct.name} to Cart`);
          return `Successfully added ${matchedProduct.name} to cart`;
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



  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  // Text-input fallback command interpreter
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    const command = textCommand.trim().toLowerCase();

    // Command Parser logic
    if (command.includes("go to home") || command.includes("go home") || command === "home") {
      router.push("/");
      toast.success("Navigating to Home");
    } else if (command.includes("go to shop") || command.includes("shop page") || command === "shop") {
      router.push("/products");
      toast.success("Navigating to Shop");
    } else if (command.includes("go to cart") || command.includes("view cart") || command.includes("open cart") || command === "cart") {
      openCart();
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
        toast.info("Connecting to  Voice Agent...");
        // Request microphone permission natively and start conversation
        await startSession({ agentId });
      } catch (err) {
        console.error("Failed to start session:", err);
        toast.error("Failed to start Agent session. Check microphone permissions.");
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none">
      {/* Floating Control Panel */}
      {showPanel && (
        <div
          className="w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          style={{ boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1)" }}
        >
          {/* Header */}
          <div className="bg-[#0da487] text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="animate-pulse" />
              <span className="font-semibold text-sm">eFresh Voice Assistant</span>
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-3">
            {/* Status & Visualizer */}
            <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center min-h-[90px] border border-gray-100">
              {isConnected ? (
                <div className="flex items-center gap-1.5 h-6 mb-2">
                  <span className="w-1 h-3 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1 h-5 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1 h-4 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  <span className="w-1 h-5 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></span>
                  <span className="w-1 h-2 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></span>
                </div>
              ) : isConnecting ? (
                <span className="text-xs text-gray-500 font-medium mb-2 animate-pulse">Connecting...</span>
              ) : (
                <MicOff size={24} className="text-gray-400 mb-2" />
              )}

              <p className="text-xs text-gray-500 font-medium text-center">
                {isConnected
                  ? "Connected! Talk to the agent."
                  : isConnecting
                    ? "Establishing WebRTC connection..."
                    : agentId
                      ? "Click 'Start Voice' to speak to  Agent"
                      : "Agent ID missing in .env"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between border-t border-b border-gray-100 py-2">
              <button
                onClick={handleToggleSession}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${isConnected
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-[#0da487]/10 text-[#0da487] hover:bg-[#0da487]/20"
                  }`}
              >
                {isConnected ? "Stop Agent Session" : "Start Voice Agent"}
              </button>

              <span className="text-[10px] text-gray-400 font-semibold uppercase bg-gray-100 px-2 py-0.5 rounded">
                eFresh Agent
              </span>
            </div>

            {/* Command Text Input Form Fallback */}
            <form onSubmit={handleTextSubmit} className="flex gap-1.5 items-center bg-gray-50 p-1 border border-gray-100 rounded-xl">
              <input
                type="text"
                value={textCommand}
                onChange={(e) => setTextCommand(e.target.value)}
                placeholder="Type command (e.g. 'go to shop')"
                className="flex-1 px-3 py-1.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-lg outline-none focus:border-[#0da487] focus:ring-1 focus:ring-[#0da487]"
              />
              <button
                type="submit"
                className="p-1.5 bg-[#0da487] text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                title="Send Command"
              >
                <Send size={13} />
              </button>
            </form>

            {/* Guide */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <HelpCircle size={10} /> Try Saying:
              </span>
              <ul className="mt-1.5 flex flex-col gap-1 text-[11px] text-gray-600">
                <li className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded transition-colors">
                  <ShoppingBag size={10} className="text-gray-400" />
                  <span>"Go to the shop page"</span>
                </li>
                <li className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded transition-colors">
                  <Search size={10} className="text-gray-400" />
                  <span>"Search for organic grapes"</span>
                </li>
                <li className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded transition-colors">
                  <Sparkles size={10} className="text-[#ffa53b]" />
                  <span>"Add organic spinach to my cart"</span>
                </li>
                <li className="flex items-center gap-1.5 p-1 hover:bg-gray-50 rounded transition-colors">
                  <ChevronDown size={10} className="text-gray-400" />
                  <span>"Clear my cart" or "Scroll down"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border cursor-pointer transition-all duration-300 ${isConnected
          ? "bg-[#0da487] text-white border-teal-600 scale-110"
          : showPanel
            ? "bg-white text-[#0da487] border-gray-100 rotate-180"
            : "bg-white text-gray-700 border-gray-100 hover:scale-105"
          }`}
        style={{ boxShadow: "0 8px 24px rgba(13, 164, 135, 0.25)" }}
      >
        {isConnected ? (
          <div className="relative">
            <Mic size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>
        ) : showPanel ? (
          <ChevronDown size={22} />
        ) : !agentId ? (
          <Keyboard size={22} />
        ) : (
          <Mic size={22} />
        )}
      </button>
    </div>
  );
}

export default function VoiceNavigation() {
  return (
    <ConversationProvider>
      <VoiceNavigationInner />
    </ConversationProvider>
  );
}
