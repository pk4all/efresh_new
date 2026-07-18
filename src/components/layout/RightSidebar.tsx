"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  X, ShoppingBag, ChevronRight, ChevronDown, Minus, Plus, Trash2,
  Sparkles, Mic, MicOff, Send, HelpCircle, Search, Keyboard
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { fetchProductsFromAgent, mapApiProductToProduct, createAgentSession, sendAgentChatMessage } from "@/utils/api";
import { Product } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function stripMarkdown(mdText: string): string {
  if (!mdText) return "";
  return mdText
    // Remove headers
    .replace(/^#+\s+/gm, "")
    // Remove bold/italic formatting
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    // Remove images ![alt](url) -> ""
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "")
    // Remove blockquotes
    .replace(/^\s*>\s+/gm, "")
    // Remove bullet points/numbered lists
    .replace(/^\s*[\*\+-]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Collapse extra whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function VoiceAssistantSidebarPanel() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCartStore = useCartStore((s) => s.clearCart);

  const [textCommand, setTextCommand] = useState("");
  const products = useCartStore((s) => s.products);
  const setProducts = useCartStore((s) => s.setProducts);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; sender: "user" | "agent"; text: string }[]>([]);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const isAgentActiveRef = useRef(false);

  const executeCommand = (commandText: string) => {
    if (!commandText.trim()) return;
    const command = commandText.trim().toLowerCase();

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
  };

  async function startRecording() {
    if (!isAgentActiveRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Safari prefers audio/mp4, Chrome/Firefox prefer audio/webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      chunksRef.current = [];
      mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop recording after 8 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 8000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to access microphone. Please check permissions.");
      setIsAgentActive(false);
      isAgentActiveRef.current = false;
    }
  }

  async function stopRecording() {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      mediaRecorder.stop();
      // Wait for a short moment to let the media recorder stop fully and data to be pushed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

      const formData = new FormData();
      formData.append("audio_file", audioBlob, "audio.webm");

      const res = await fetch("/demo/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to transcribe audio");
      }

      const { text } = await res.json();
      if (text && text.trim()) {
        setTextCommand(text);

        // Add user query to messages list
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, sender: "user", text }]);

        // Get current sessionId or use stored one
        const activeSessionId = sessionId || localStorage.getItem("agent_session_id");

        // AbortController for timeout on the chat API call
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let replyText = "";
        try {
          const chatData = await sendAgentChatMessage(
            activeSessionId || "fallback_session",
            text,
            controller.signal
          );
          clearTimeout(timeoutId);
          replyText = chatData.response || chatData.reply || chatData.text || (chatData.data && (chatData.data.response || chatData.data.reply || chatData.data.text)) || "I'm sorry, I couldn't understand that.";
        } catch (chatErr: any) {
          clearTimeout(timeoutId);
          if (chatErr.name === 'AbortError') {
            replyText = "The agent request timed out. Please try again.";
          } else {
            replyText = "Sorry, I had trouble reaching the agent.";
          }
        }

        // Add agent response to messages list
        const agentMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: agentMsgId, sender: "agent", text: replyText }]);

        // Convert response text to voice and play it
        let hasPlayedAudio = false;
        try {
          const ttsRes = await fetch("/demo/api/tts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: stripMarkdown(replyText) }),
          });

          if (ttsRes.ok) {
            const audioBlob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            hasPlayedAudio = true;
            audio.onended = () => {
              if (isAgentActiveRef.current) {
                startRecording();
              }
            };
            audio.play();
          }
        } catch (ttsErr) {
          console.error("Failed to generate or play TTS response:", ttsErr);
        }

        // If audio playback failed to set up or start, immediately resume recording loop
        if (!hasPlayedAudio && isAgentActiveRef.current) {
          startRecording();
        }

        // Also check if text has matching shop commands to trigger navigation or action
        executeCommand(text);

      } else {
        toast.error("No speech detected. Try speaking closer to the microphone.");
        // Resume recording loop
        if (isAgentActiveRef.current) {
          startRecording();
        }
      }
    } catch (error: any) {
      console.error("Error transcribing:", error);
      toast.error(error.message || "Error processing voice command.");
      // Resume recording loop on error
      if (isAgentActiveRef.current) {
        startRecording();
      }
    } finally {
      setIsTranscribing(false);
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      }
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    executeCommand(textCommand);
    setTextCommand("");
  };

  const handleToggleRecording = async () => {
    if (isAgentActive) {
      setIsAgentActive(false);
      isAgentActiveRef.current = false;
      if (isRecording) {
        await stopRecording();
      }
    } else {
      setIsAgentActive(true);
      isAgentActiveRef.current = true;
      try {
        setIsTranscribing(true);
        let activeSessionId = sessionId || localStorage.getItem("agent_session_id");

        if (!activeSessionId) {
          try {
            const sessionData = await createAgentSession();
            activeSessionId = sessionData.session_id || sessionData.id || (sessionData.data && (sessionData.data.session_id || sessionData.data.id));
            if (activeSessionId) {
              setSessionId(activeSessionId);
              localStorage.setItem("agent_session_id", activeSessionId);
            }
          } catch (sessionErr) {
            console.error("Error creating agent session:", sessionErr);
          }
        }

        setIsTranscribing(false);
        await startRecording();
      } catch (err) {
        console.error("Failed to start recording:", err);
        toast.error("Failed to access microphone. Please check permissions.");
        setIsTranscribing(false);
        setIsAgentActive(false);
        isAgentActiveRef.current = false;
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto select-none bg-white custom-scrollbar">
      {/* Chat Messages Window */}
      <div className="flex-1 min-h-[220px] overflow-y-auto mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
            <Sparkles className="w-8 h-8 text-[#0da487]/40 mb-2 animate-pulse" />
            <p className="text-xs font-bold text-gray-500">Conversational Voice Agent</p>
            <p className="text-[10px] text-gray-400 max-w-[180px] mt-1">Start the agent and talk to ask questions or navigate the site.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                }`}
            >
              <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 px-1">
                {msg.sender === "user" ? "You" : "Agent"}
              </span>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-xs shadow-sm leading-relaxed ${msg.sender === "user"
                  ? "bg-[#0da487] text-white rounded-tr-none"
                  : "bg-white text-gray-700 border border-gray-100 rounded-tl-none markdown-body"
                  }`}
              >
                {msg.sender === "user" ? (
                  msg.text
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connection & Action */}
      <div className="flex items-center justify-between border-t border-b border-gray-100 py-3.5 mb-5 bg-white">
        <button
          onClick={handleToggleRecording}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 ${isAgentActive
            ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 animate-pulse"
            : "bg-[#0da487]/10 text-[#0da487] hover:bg-[#0da487]/20"
            }`}
        >
          {isAgentActive ? "Stop Agent" : "Start Agent"}
        </button>

        {/* Agent Animation / Status Area */}
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-1 h-4">
              <span className="w-0.5 h-2 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-0.5 h-3 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-0.5 h-2 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              <span className="w-0.5 h-3 bg-[#0da487] rounded-full animate-bounce" style={{ animationDelay: "450ms" }}></span>
            </div>
          ) : isTranscribing ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0da487] border-t-transparent animate-spin"></div>
          ) : null}

          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {isRecording ? "Listening..." : isTranscribing ? "Thinking..." : "Agent Idle"}
          </span>
        </div>
      </div>

      {/* Command input */}
      <form onSubmit={handleTextSubmit} className="flex gap-2 items-center bg-white p-1 border border-gray-200 rounded-xl shadow-sm mb-5 focus-within:border-[#0da487] transition-all" style={{ display: 'none' }}>
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
      <div className="flex-1 text-left" style={{ display: 'none' }}>
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
      <div className="h-1/2 flex flex-col border-b border-[#eceff1] overflow-hidden" style={{ display: 'none' }}>
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
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
    </aside >
  );
}
