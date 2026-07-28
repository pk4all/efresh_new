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
import { useAgentStore } from "@/store/agentStore";
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

// Voice-activity detection tuning: these replace the old fixed 3s recording
// window so the assistant listens naturally and only stops once you pause,
// like ChatGPT's voice mode rather than cutting you off on a timer.
const VAD_SPEECH_RMS_THRESHOLD = 0.02;
const VAD_SILENCE_HOLD_MS = 1100;
const VAD_MAX_RECORDING_MS = 30000; // hard safety cap if silence is never detected
const BARGE_IN_RMS_THRESHOLD = 0.035; // a bit higher than VAD to resist TTS speaker bleed
const BARGE_IN_SUSTAIN_FRAMES = 5; // require a few consecutive frames above threshold

// Short acknowledgements played while waiting on transcription/chat API calls
// so the assistant never goes quiet on you - like a real person saying
// "let me check" instead of leaving dead air.
const THINKING_FILLER_PHRASES = [
  "Mm-hmm, let me check that for you.",
  "Ooh okay, one sec, pulling that up now.",
  "Got it, let me take a quick look.",
  "Sure thing, give me just a moment.",
  "Alright, let me see what I can find for you.",
  "One moment, checking that for you now.",
  "Okay, let me dig into that real quick.",
];

function computeRms(analyser: AnalyserNode, buffer: Uint8Array<ArrayBuffer>): number {
  analyser.getByteTimeDomainData(buffer);
  let sumSquares = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128;
    sumSquares += v * v;
  }
  return Math.sqrt(sumSquares / buffer.length);
}

// Watches the mic in the background (e.g. while TTS is playing) and fires
// onSpeechDetected as soon as the user starts talking over the assistant.
// Returns a stop() function that can be called immediately, even before the
// underlying mic stream has finished being acquired.
function createBargeInMonitor(onSpeechDetected: () => void): () => void {
  let cancelled = false;
  let cleanupFn: (() => void) | null = null;

  (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      let rafId = 0;
      let aboveThresholdFrames = 0;

      const tick = () => {
        if (cancelled) return;
        const rms = computeRms(analyser, data);
        if (rms > BARGE_IN_RMS_THRESHOLD) {
          aboveThresholdFrames++;
          if (aboveThresholdFrames >= BARGE_IN_SUSTAIN_FRAMES) {
            cancelled = true;
            cleanupFn?.();
            onSpeechDetected();
            return;
          }
        } else {
          aboveThresholdFrames = 0;
        }
        rafId = requestAnimationFrame(tick);
      };

      cleanupFn = () => {
        cancelAnimationFrame(rafId);
        stream.getTracks().forEach((t) => t.stop());
        try { audioCtx.close(); } catch (e) { }
      };

      rafId = requestAnimationFrame(tick);
    } catch (e) {
      console.error("Barge-in monitor failed to start:", e);
    }
  })();

  return () => {
    cancelled = true;
    cleanupFn?.();
  };
}

// Taps an <audio> element's actual output so the orb can react to the
// assistant's own speech in real time, the same way it reacts to your voice.
function createPlaybackLevelMonitor(audio: HTMLAudioElement, onLevel: (level: number) => void): () => void {
  let stopped = false;
  let rafId = 0;
  let audioCtx: AudioContext | null = null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
    const source = audioCtx.createMediaElementSource(audio);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    // Route through the analyser but still out to speakers - createMediaElementSource
    // hijacks the element's normal output, so it must be reconnected to destination.
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    const data = new Uint8Array(analyser.fftSize);

    const tick = () => {
      if (stopped) return;
      onLevel(computeRms(analyser, data));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  } catch (e) {
    console.error("Playback level monitor failed to start:", e);
  }

  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(rafId);
    onLevel(0);
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) { }
    }
  };
}

function VoiceAssistantSidebarPanel() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCartStore = useCartStore((s) => s.clearCart);
  const syncCartWithDb = useCartStore((s) => s.syncCartWithDb);

  const [textCommand, setTextCommand] = useState("");
  const products = useCartStore((s) => s.products);
  const setProducts = useCartStore((s) => s.setProducts);

  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);

  // Orb visual: fed live by the mic (while listening) and the TTS output
  // (while speaking) so it reacts to actual sound instead of just switching
  // between static icons. Updated imperatively via refs/DOM, not React state,
  // so it can run every animation frame without triggering re-renders.
  const orbLevelRef = useRef(0);
  const orbDisplayRef = useRef(0);
  const orbElRef = useRef<HTMLDivElement | null>(null);
  const orbRafRef = useRef<number | null>(null);

  const isRecording = useAgentStore((s) => s.isRecording);
  const setIsRecording = useAgentStore((s) => s.setIsRecording);

  const isAgentActive = useAgentStore((s) => s.isAgentActive);
  const setIsAgentActive = useAgentStore((s) => s.setIsAgentActive);
  const sessionId = useAgentStore((s) => s.sessionId);
  const setSessionId = useAgentStore((s) => s.setSessionId);
  const messages = useAgentStore((s) => s.messages);
  const setMessages = useAgentStore((s) => s.setMessages);
  const mediaRecorder = useAgentStore((s) => s.mediaRecorder);
  const setMediaRecorder = useAgentStore((s) => s.setMediaRecorder);
  const activeAudio = useAgentStore((s) => s.activeAudio);
  const setActiveAudio = useAgentStore((s) => s.setActiveAudio);
  const isTranscribing = useAgentStore((s) => s.isTranscribing);
  const setIsTranscribing = useAgentStore((s) => s.setIsTranscribing);

  const isAgentActiveRef = useRef(isAgentActive);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const shouldTerminateAfterTtsRef = useRef(false);

  const cleanupVad = () => {
    if (vadRafRef.current !== null) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    if (vadAudioCtxRef.current) {
      try { vadAudioCtxRef.current.close(); } catch (e) { }
      vadAudioCtxRef.current = null;
    }
  };

  // Fetches TTS audio, plays it, and lets the user barge in (start talking)
  // to cut it off early - mirrors how ChatGPT's voice mode behaves. Always
  // resolves exactly once via onFinished, whether the clip finished naturally,
  // was interrupted, or failed to play.
  const playTtsAudio = async (
    text: string,
    onFinished: (result: { bargedIn: boolean; played: boolean; error?: string }) => void,
    allowBargeIn = true
  ) => {
    let stopBargeInMonitor: (() => void) | null = null;
    let stopPlaybackLevelMonitor: (() => void) | null = null;
    let settled = false;

    const finish = (result: { bargedIn: boolean; played: boolean; error?: string }) => {
      if (settled) return;
      settled = true;
      stopBargeInMonitor?.();
      stopPlaybackLevelMonitor?.();
      onFinished(result);
    };

    try {
      // Cut off anything still playing (e.g. a filler line that hasn't
      // finished yet) so responses never overlap each other.
      const prevAudio = useAgentStore.getState().activeAudio;
      if (prevAudio) {
        try { prevAudio.pause(); } catch (e) { }
        setActiveAudio(null);
      }

      const ttsRes = await fetch("/demo/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!ttsRes.ok) {
        let message = "TTS API error";
        try {
          const errData = await ttsRes.json();
          message = errData.error || message;
        } catch (_) { }
        throw new Error(message);
      }

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setActiveAudio(audio);
      stopPlaybackLevelMonitor = createPlaybackLevelMonitor(audio, (level) => {
        orbLevelRef.current = level;
      });

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setActiveAudio(null);
        finish({ bargedIn: false, played: true });
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setActiveAudio(null);
        finish({ bargedIn: false, played: false, error: "Audio playback error" });
      };

      if (allowBargeIn) {
        stopBargeInMonitor = createBargeInMonitor(() => {
          try { audio.pause(); } catch (e) { }
          URL.revokeObjectURL(audioUrl);
          setActiveAudio(null);
          finish({ bargedIn: true, played: true });
        });
      }

      await audio.play();
    } catch (err: any) {
      console.error("Failed to generate or play TTS response:", err);
      finish({ bargedIn: false, played: false, error: err.message });
    }
  };

  // Fires off a short "let me check that for you" line while the transcribe
  // and chat API calls are in flight, so the wait never sounds like dead air.
  // Fire-and-forget: it doesn't drive the conversation loop itself.
  const playFillerLine = () => {
    const phrase = THINKING_FILLER_PHRASES[Math.floor(Math.random() * THINKING_FILLER_PHRASES.length)];
    playTtsAudio(phrase, () => { }, false);
  };

  const terminateWithThankYou = async (errorMessage?: string) => {
    console.error("Agent terminating due to API/system error:", errorMessage);

    setIsAgentActive(false);
    isAgentActiveRef.current = false;

    cleanupVad();
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    setIsRecording(false);
    setIsTranscribing(false);

    const activeRecorder = useAgentStore.getState().mediaRecorder;
    if (activeRecorder) {
      if (activeRecorder.state !== "inactive") {
        try { activeRecorder.stop(); } catch (e) { }
      }
      if (activeRecorder.stream) {
        activeRecorder.stream.getTracks().forEach((t) => t.stop());
      }
      setMediaRecorder(null);
    }

    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }

    const currentAudio = useAgentStore.getState().activeAudio;
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) { }
      setActiveAudio(null);
    }

    const isVoiceQuotaError = errorMessage?.includes("out of credits") || errorMessage?.includes("quota_exceeded");

    let thankYouText = "Ah, sorry about that - something glitched on my end. Give it another shot in a bit!";
    if (errorMessage === "Invalid or expired token." || errorMessage?.includes("Invalid or expired token")) {
      thankYouText = "Looks like you'll need to log in first before we keep chatting - hop back in and I'll be right here!";
    } else if (isVoiceQuotaError) {
      thankYouText = "I'm out of voice credits for now, so I can't talk until the quota resets. Please try again later.";
    }
    const agentMsgId = `err_thank_${Date.now()}`;
    setMessages(prev => [...prev, { id: agentMsgId, sender: "agent", text: thankYouText }]);

    if (isVoiceQuotaError) {
      // Skip attempting to speak - we already know TTS is unavailable, so
      // trying again would just fail the same way and clutter the console.
      toast.error("Voice assistant is out of speech credits for this billing period.");
      return;
    }

    await playTtsAudio(thankYouText, () => { }, false);
  };

  // Sync ref with store state
  useEffect(() => {
    isAgentActiveRef.current = isAgentActive;
  }, [isAgentActive]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup recording timeout and VAD listeners on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      cleanupVad();
    };
  }, []);

  // Drives the orb: smoothly follows whatever live audio level is currently
  // feeding orbLevelRef (mic while listening, TTS output while speaking),
  // plus a gentle idle "breathing" motion so it's never fully static.
  useEffect(() => {
    if (!isAgentActive) {
      if (orbRafRef.current !== null) {
        cancelAnimationFrame(orbRafRef.current);
        orbRafRef.current = null;
      }
      orbLevelRef.current = 0;
      orbDisplayRef.current = 0;
      return;
    }

    const animate = () => {
      orbDisplayRef.current += (orbLevelRef.current - orbDisplayRef.current) * 0.15;
      const level = Math.min(1, orbDisplayRef.current * 4);
      const breathe = Math.sin(Date.now() / 900) * 0.03;
      const scale = 1 + level * 0.3 + breathe;
      const glow = 14 + level * 40;

      if (orbElRef.current) {
        orbElRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        orbElRef.current.style.setProperty("--orb-glow", `${glow.toFixed(1)}px`);
      }

      orbRafRef.current = requestAnimationFrame(animate);
    };
    orbRafRef.current = requestAnimationFrame(animate);

    return () => {
      if (orbRafRef.current !== null) {
        cancelAnimationFrame(orbRafRef.current);
        orbRafRef.current = null;
      }
    };
  }, [isAgentActive]);

  // Resume recording loop if page transitions and agent is supposed to be active
  useEffect(() => {
    if (isAgentActive) {
      const resumeTimer = setTimeout(() => {
        // Only start if it's active and not currently doing anything
        if (isAgentActiveRef.current && !isRecording && !isTranscribing) {
          startRecording();
        }
      }, 500);
      return () => clearTimeout(resumeTimer);
    }
  }, [isAgentActive]);

  const executeCommand = async (commandText: string) => {
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
        let matchedProduct = liveProducts.find((p) => p.name.toLowerCase().includes(searchName));

        if (!matchedProduct) {
          try {
            const searchRes = await fetchProductsFromAgent({ search: searchName, limit: 1 });
            if (searchRes && searchRes.data && searchRes.data.length > 0) {
              matchedProduct = mapApiProductToProduct(searchRes.data[0]);
            }
          } catch (e: any) {
            console.error("Failed to fetch product from agent search", e);
            await terminateWithThankYou(e.message || "fetchProductsFromAgent error");
            return;
          }
        }

        if (matchedProduct) {
          addItem(matchedProduct, 1);
          toast.success(`Added ${matchedProduct.name} to Cart`);
        } else {
          toast.error(`Product "${match[1]}" not found`);
        }
      }
    } else {
      // toast.success(`Command not recognized: "${command}"`);
    }
  };

  // no need this function exicute [End] //

  // Start ne agent.

  async function startRecording() {
    const currentActiveAudio = useAgentStore.getState().activeAudio;
    const currentIsTranscribing = useAgentStore.getState().isTranscribing;
    if (!isAgentActiveRef.current || currentActiveAudio || currentIsTranscribing) return;

    // Stop any existing active recorder
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try { mediaRecorder.stop(); } catch (e) { }
    }
    // Stop any existing playing audio
    if (activeAudio) {
      try { activeAudio.pause(); } catch (e) { }
      setActiveAudio(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      // Safari prefers audio/mp4, Chrome/Firefox prefer audio/webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      setMediaRecorder(recorder);

      chunksRef.current = [];
      recorder.ondataavailable = e => chunksRef.current.push(e.data);
      recorder.start();
      setIsRecording(true);

      // Voice-activity detection: keep listening naturally and only stop once
      // the user has spoken and then paused, instead of a blind fixed window.
      cleanupVad();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      vadAudioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const vadData = new Uint8Array(analyser.fftSize);

      let speechStarted = false;
      let silenceStart: number | null = null;

      const tick = () => {
        const rms = computeRms(analyser, vadData);
        orbLevelRef.current = rms;
        if (rms > VAD_SPEECH_RMS_THRESHOLD) {
          speechStarted = true;
          silenceStart = null;
        } else if (speechStarted) {
          if (silenceStart === null) {
            silenceStart = performance.now();
          } else if (performance.now() - silenceStart > VAD_SILENCE_HOLD_MS) {
            stopRecording();
            return;
          }
        }
        vadRafRef.current = requestAnimationFrame(tick);
      };
      vadRafRef.current = requestAnimationFrame(tick);

      // Hard safety cap in case silence is never detected (e.g. constant background noise)
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, VAD_MAX_RECORDING_MS);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error("Failed to access microphone. Please check permissions.");
      setIsAgentActive(false);
      isAgentActiveRef.current = false;
    }
  }

  async function stopRecording() {
    const activeRecorder = useAgentStore.getState().mediaRecorder;
    if (!activeRecorder) return;

    cleanupVad();
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      activeRecorder.stop();
      // Wait for a short moment to let the media recorder stop fully and data to be pushed
      await new Promise((resolve) => setTimeout(resolve, 100));

      const audioBlob = new Blob(chunksRef.current, { type: activeRecorder.mimeType });

      // Stop all tracks on the stream to turn off the microphone light
      if (activeRecorder.stream) {
        activeRecorder.stream.getTracks().forEach(t => t.stop());
      }
      setMediaRecorder(null);

      // Prevent empty or corrupted audio error if recorded blob is too small/empty
      if (!audioBlob || audioBlob.size < 500) {
        console.warn("Recorded audio blob is empty or too small:", audioBlob?.size);
        setIsTranscribing(false);
        if (isAgentActiveRef.current) {
          toast.error("No speech detected. Try speaking closer to the microphone.");
          startRecording();
        }
        return;
      }

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

      if (!isAgentActiveRef.current) return;
      const { text } = await res.json();
      if (text && text.trim()) {
        setTextCommand(text);

        // Add user query to messages list
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, sender: "user", text }]);

        // Give a quick spoken acknowledgement while the chat API call is in
        // flight, instead of leaving the wait silent.
        playFillerLine();

        // Get current sessionId or use stored one
        const activeSessionId = sessionId || localStorage.getItem("agent_session_id");

        // AbortController for timeout on the chat API call
        const controller = new AbortController();
        chatAbortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let replyText = "";
        try {
          const chatData = await sendAgentChatMessage(
            activeSessionId || "fallback_session",
            text,
            controller.signal
          );
          clearTimeout(timeoutId);
          chatAbortControllerRef.current = null;
          if (!isAgentActiveRef.current) return;
          replyText = chatData.response || chatData.reply || chatData.text || (chatData.data && (chatData.data.response || chatData.data.reply || chatData.data.text)) || "I'm sorry, I couldn't understand that.";
          console.log(chatData, 'api response')
          let action = chatData?.data?.action.trim() || '';
          if (['CartChanged', 'ProductAdded'].includes(action)) {
            await syncCartWithDb();
          }
          console.log(action, 'action');
          if (action == 'searchProducts') {
            if (typeof window !== "undefined" && window.location.pathname !== "/products") {
              router.push("/products");
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
            const products = chatData?.data?.products;
            console.log(products, 'products');
            if (products?.length > 0) {
              const mapped = (products || []).map(mapApiProductToProduct);
              setProducts(mapped);
            }
          }
          //'none',
          if (['thanks'].includes(action)) {
            //setIsAgentActive(false);
            //isAgentActiveRef.current = false;
            shouldTerminateAfterTtsRef.current = true;
            console.log(shouldTerminateAfterTtsRef.current, 'shouldTerminateAfterTtsRef.current')
          }
          if (action == 'GotoCart' || action === 'gotoCart' || action === 'GotoCart') {
            router.push('/cart');
          }
          if (action == 'Home' || action === 'home' || action === 'GotoHome') {
            router.push('/');
          }
          if (action === 'product' || action === 'Products' || action === 'GotoProduct' || action === 'gotoProduct') {
            router.push('/products');
          }
          if (action == 'account' || action === 'Account' || action === 'GotoAccount' || action === 'gotoAccount') {
            router.push('/account');
          }
          if (action == 'wishlist' || action === 'Wishlist' || action === 'GotoWishlist' || action === 'gotoWishlist') {
            router.push('/account?tab=wishlist');
          }
          if (action == 'account/orders') {
            router.push('/account?tab=order');
          }
          if (action == 'account/address') {
            router.push('/account?tab=address');
          }
          if (action == 'account/profile' || action === 'Account/Profile' || action === 'GotoAccount/Profile' || action === 'gotoAccount/Profile') {
            router.push('/account?tab=profile');
          }
          if (action == 'checkout' || action === 'Checkout' || action === 'GotoCheckout' || action === 'gotoCheckout') {
            router.push('/checkout');
          }
        } catch (chatErr: any) {
          clearTimeout(timeoutId);
          console.error("Chat API error:", chatErr);
          await terminateWithThankYou(chatErr.message || "Chat API error");
          return;
        }

        // Add agent response to messages list
        const agentMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: agentMsgId, sender: "agent", text: replyText }]);

        // Convert response text to voice and play it. Barge-in lets the user
        // start talking over the assistant to cut it off, just like ChatGPT voice.
        await playTtsAudio(stripMarkdown(replyText), ({ bargedIn, played, error }) => {
          if (!played) {
            terminateWithThankYou(error || "TTS error");
            return;
          }
          if (bargedIn) {
            // User interrupted - drop any pending termination and listen to them now.
            shouldTerminateAfterTtsRef.current = false;
            if (isAgentActiveRef.current) startRecording();
            return;
          }
          if (shouldTerminateAfterTtsRef.current) {
            setIsAgentActive(false);
            isAgentActiveRef.current = false;
            shouldTerminateAfterTtsRef.current = false;
          } else if (isAgentActiveRef.current) {
            startRecording();
          }
        });

        // Also check if text has matching shop commands to trigger navigation or action
        // await executeCommand(text);

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
      await terminateWithThankYou(error.message || "Transcription/Recording error");
    } finally {
      setIsTranscribing(false);
      if (activeRecorder && activeRecorder.stream) {
        activeRecorder.stream.getTracks().forEach(t => t.stop());
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

      // Stop the media recorder immediately and cleanup without processing a final response
      cleanupVad();
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      setIsRecording(false);
      setIsTranscribing(false);

      if (mediaRecorder) {
        if (mediaRecorder.state !== "inactive") {
          try {
            mediaRecorder.stop();
          } catch (e) {
            console.error("Error stopping recorder on toggle:", e);
          }
        }
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        }
        setMediaRecorder(null);
      }

      // Abort any ongoing chat API call
      if (chatAbortControllerRef.current) {
        chatAbortControllerRef.current.abort();
        chatAbortControllerRef.current = null;
      }

      // Stop any ongoing welcome/response TTS audio playback
      if (activeAudio) {
        try {
          activeAudio.pause();
        } catch (e) {
          console.error("Error pausing active audio:", e);
        }
        setActiveAudio(null);
      }

      // Reset agent variables
      // setMessages([]);
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
          } catch (sessionErr: any) {
            console.error("Error creating agent session:", sessionErr);
            await terminateWithThankYou(sessionErr.message || "Session creation error");
            return;
          }
        }

        // Add welcome message to visual chat window
        const welcomeText = "Hey, welcome to eFresh! I'm your shopping buddy - here to help you find great picks, add stuff to your cart, or just get you where you need to go. What are we grabbing today?";
        setMessages(prev => [...prev, { id: `welcome_${Date.now()}`, sender: "agent", text: welcomeText }]);
        setIsTranscribing(false);

        // Convert welcome message to voice and play it, then start listening.
        // You can talk over it at any point - it'll stop and listen to you.
        await playTtsAudio(welcomeText, ({ played, error }) => {
          if (!played) {
            terminateWithThankYou(error || "Welcome TTS error");
            return;
          }
          if (isAgentActiveRef.current) {
            startRecording();
          }
        });
      } catch (err) {
        console.error("Failed to start recording:", err);
        toast.error("Failed to access microphone. Please check permissions.");
        setIsTranscribing(false);
        setIsAgentActive(false);
        isAgentActiveRef.current = false;
      }
    }
  };

  const orbState: "listening" | "thinking" | "speaking" = isTranscribing
    ? "thinking"
    : activeAudio
      ? "speaking"
      : "listening";

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto select-none bg-white custom-scrollbar">
      {/* Chat Messages Window */}
      <div className="flex-1 min-h-[220px] overflow-y-auto mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
            <Sparkles className="w-8 h-8 text-[#4967a9]/40 mb-2 animate-pulse" />
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
                  ? "bg-[#4967a9] text-white rounded-tr-none"
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
        <div ref={chatEndRef} />
      </div>

      {/* Live voice orb - sits below the chat, outside the scrollable area,
          so it's always visible while active. Reacts to the mic while
          listening and to its own voice while speaking, so it feels like an
          actual conversation partner rather than a static icon. */}
      {isAgentActive && (
        <div className="flex flex-col items-center gap-1.5 pb-4">
          <div
            ref={orbElRef}
            className={`voice-orb ${orbState === "thinking" ? "voice-orb--thinking" : ""}`}
          />
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {orbState === "thinking" ? "Thinking..." : orbState === "speaking" ? "Talking..." : "Listening..."}
          </span>
        </div>
      )}

      {/* Connection & Action - the orb above already shows live status, so
          this row just holds the start/stop control. */}
      <div className="flex items-center justify-center border-t border-b border-gray-100 py-3.5 mb-5 bg-white">
        <button
          onClick={handleToggleRecording}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 ${isAgentActive
            ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 animate-pulse"
            : "bg-[#4967a9]/10 text-[#4967a9] hover:bg-[#4967a9]/20"
            }`}
        >
          {isAgentActive ? "Stop Agent" : "Start Agent"}
        </button>
      </div>

      {/* Command input */}
      <form onSubmit={handleTextSubmit} className="flex gap-2 items-center bg-white p-1 border border-gray-200 rounded-xl shadow-sm mb-5 focus-within:border-[#4967a9] transition-all" style={{ display: 'none' }}>
        <input
          type="text"
          value={textCommand}
          onChange={(e) => setTextCommand(e.target.value)}
          placeholder="Type command (e.g. 'go to shop')"
          className="flex-1 px-3 py-2 text-xs text-gray-700 bg-white outline-none rounded-lg"
        />
        <button
          type="submit"
          className="p-2 bg-[#4967a9] text-white rounded-full hover:bg-[#3b548b] transition-colors cursor-pointer flex items-center justify-center shadow-md shadow-[#4967a9]/20"
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

      <style jsx>{`
        .voice-orb {
          --orb-glow: 16px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          background: radial-gradient(
            circle at 32% 26%,
            #ffffff 0%,
            #eef1ff 22%,
            #b7c1ff 46%,
            #7681f2 70%,
            #4c56e6 100%
          );
          box-shadow: 0 0 var(--orb-glow) calc(var(--orb-glow) * 0.35) rgba(99, 102, 241, 0.45);
          will-change: transform;
        }
        .voice-orb::before {
          content: "";
          position: absolute;
          inset: -10%;
          border-radius: 50%;
          background: radial-gradient(circle at 70% 75%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 45%),
            radial-gradient(circle at 22% 62%, rgba(129, 140, 255, 0.55) 0%, rgba(129, 140, 255, 0) 50%);
          mix-blend-mode: screen;
          animation: voiceOrbSwirl 7s ease-in-out infinite alternate;
        }
        .voice-orb--thinking {
          animation: voiceOrbHue 2.4s linear infinite;
        }
        @keyframes voiceOrbSwirl {
          0% {
            transform: rotate(0deg) scale(1);
          }
          100% {
            transform: rotate(20deg) scale(1.06);
          }
        }
        @keyframes voiceOrbHue {
          from {
            filter: hue-rotate(0deg);
          }
          to {
            filter: hue-rotate(25deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function RightSidebar() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);

  const isAgentActive = useAgentStore((s) => s.isAgentActive);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.getTotalPrice());

  useEffect(() => {
    if (isHomepage && isAgentActive) {
      setShowFloatingPanel(true);
    }
  }, [isHomepage, isAgentActive]);

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
    </aside >
  );
}
