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
import { fetchProductsFromAgent, mapApiProductToProduct, createAgentSession, sendAgentChatMessage, getPublicAssetUrl, getVendorByPincode } from "@/utils/api";
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

// Barge-in is a little more conservative than regular listening: the mic is
// live at the same time the assistant's own voice is coming out of the
// speakers, so it's more exposed to speaker bleed than plain listening is.
// Not too conservative though - these were previously tuned aggressively to
// fight background noise and ended up blocking genuine interruptions too.
const BARGE_IN_RMS_THRESHOLD = 0.03;

// Ambient-noise rejection: rather than trusting a single fixed volume
// threshold (which false-triggers on fans, traffic, AC hum, etc.), sample
// the room's noise floor for a moment first and only treat audio as real
// speech once it clearly and continuously rises above that floor. Sustain
// is tracked in wall-clock time (not animation-frame count) since rAF
// cadence varies with display refresh rate and throttles hard on
// backgrounded tabs - a frame count would mean a different real-world
// duration depending on the device.
const NOISE_CALIBRATION_MS = 400;
const VAD_NOISE_MARGIN_MULTIPLIER = 2.5;
const VAD_NOISE_MARGIN_MIN = 0.012;
const VAD_SUSTAIN_MS = 150;
const BARGE_IN_NOISE_MARGIN_MULTIPLIER = 2.2;
const BARGE_IN_NOISE_MARGIN_MIN = 0.014;
const BARGE_IN_SUSTAIN_MS = 180;

function computeDynamicThreshold(noiseFloor: number, fallback: number, marginMultiplier: number, marginMin: number): number {
  return Math.max(noiseFloor * marginMultiplier, noiseFloor + marginMin, fallback);
}

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

// Picks a filler line that actually matches what the user asked for, instead
// of a generic random one - falls back to the generic pool for anything that
// doesn't match a recognized shopping intent.
const FILLER_INTENT_PATTERNS: Array<{ pattern: RegExp; phrases: string[] }> = [
  {
    pattern: /\badd\b.*\b(cart|basket)\b|\bput\b.*\bcart\b/i,
    phrases: ["Sure, adding that to your cart now.", "Got it, popping that in your cart.", "On it, adding that for you."],
  },
  {
    pattern: /\bremove\b|\bdelete\b|\btake .* out\b/i,
    phrases: ["Okay, removing that now.", "Got it, taking that off your cart."],
  },
  {
    pattern: /\bcheckout\b|\bpay\b|\bplace (my|the) order\b/i,
    phrases: ["Sure, let's get you to checkout.", "Taking you to checkout now."],
  },
  {
    pattern: /\bcart\b/i,
    phrases: ["Let me pull up your cart.", "One sec, checking your cart."],
  },
  {
    pattern: /\bsearch\b|\bfind\b|\blook(ing)? for\b|\bdo you have\b/i,
    phrases: ["Let me look that up for you.", "Searching for that now.", "One sec, let me find that."],
  },
  {
    pattern: /\bprice\b|\bcost\b|\bhow much\b|\bavailable\b|\bstock\b/i,
    phrases: ["Let me check that for you.", "Give me a sec to check on that."],
  },
  {
    pattern: /\border\b|\btrack\b|\bdelivery\b/i,
    phrases: ["Let me check on that for you.", "One moment, pulling that up."],
  },
];

function pickContextualFillerLine(userText: string): string {
  for (const { pattern, phrases } of FILLER_INTENT_PATTERNS) {
    if (pattern.test(userText)) {
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  }
  return THINKING_FILLER_PHRASES[Math.floor(Math.random() * THINKING_FILLER_PHRASES.length)];
}

// Greetings and clearly off-topic small talk get answered instantly and
// locally - no reason to burn a round trip to the shopping backend for
// "hi" or "tell me a joke". Anything that isn't confidently one of these
// still goes to the real chat API as before.
const GREETING_PATTERN =
  /^(hi|hey|hello|hiya|yo|howdy|good\s*(morning|afternoon|evening))\b|\bhow('?s| is) it going\b|\bhow are you\b|\bwhat'?s up\b/i;

const OFF_TOPIC_PATTERN =
  /\b(weather|joke|tell me a story|the news|sports? score|who won|movie recommendation|play (a )?song|who is the president|capital of|meaning of life|solve (this|for)|write (me )?(a )?(code|program)|are you (a )?(robot|human|ai)|what'?s your name|how old are you|what time is it)\b/i;

const GROCERY_KEYWORD_PATTERN =
  /\b(cart|checkout|order|product|item|price|discount|offer|deal|delivery|deliver|shop|store|grocery|groceries|fruit|vegetable|veggie|produce|organic|fresh|milk|bread|meat|chicken|fish|snack|drink|beverage|buy|add|remove|delete|search|find|wishlist|account|address|payment|quantity|stock|available|recipe|recommend|suggest|basket|bill|total|coupon|voucher|return|refund|track)\b/i;

const GREETING_REPLIES = [
  "Hey there! What can I help you find today?",
  "Hiya! Ready to help you shop - what are you after?",
  "Hello! What can I grab for you today?",
];

const OFF_TOPIC_REPLIES = [
  "Ha, that's a bit outside my wheelhouse - I'm your grocery shopping buddy! Anything I can help you find today?",
  "I'm just here for the grocery run, so I can't help with that one - but let me know what you need from the shop!",
  "That's outside what I can help with - I'm all about groceries. What can I add to your cart?",
];

// Returns a canned reply for greetings/off-topic small talk, or null if the
// message should go to the real chat API as normal.
function getLocalQuickReply(userText: string): string | null {
  const text = userText.trim();
  if (!text) return null;

  if (GREETING_PATTERN.test(text)) {
    return GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
  }

  if (OFF_TOPIC_PATTERN.test(text) && !GROCERY_KEYWORD_PATTERN.test(text)) {
    return OFF_TOPIC_REPLIES[Math.floor(Math.random() * OFF_TOPIC_REPLIES.length)];
  }

  return null;
}

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
      let aboveThresholdSince: number | null = null;
      let calibrating = true;
      const calibrationStart = performance.now();
      const calibrationSamples: number[] = [];
      let dynamicThreshold = BARGE_IN_RMS_THRESHOLD;

      const tick = () => {
        if (cancelled) return;
        const rms = computeRms(analyser, data);

        if (calibrating) {
          calibrationSamples.push(rms);
          if (performance.now() - calibrationStart >= NOISE_CALIBRATION_MS) {
            calibrating = false;
            const noiseFloor = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
            dynamicThreshold = computeDynamicThreshold(
              noiseFloor,
              BARGE_IN_RMS_THRESHOLD,
              BARGE_IN_NOISE_MARGIN_MULTIPLIER,
              BARGE_IN_NOISE_MARGIN_MIN
            );
          }
          rafId = requestAnimationFrame(tick);
          return;
        }

        if (rms > dynamicThreshold) {
          if (aboveThresholdSince === null) aboveThresholdSince = performance.now();
          if (performance.now() - aboveThresholdSince >= BARGE_IN_SUSTAIN_MS) {
            cancelled = true;
            cleanupFn?.();
            onSpeechDetected();
            return;
          }
        } else {
          aboveThresholdSince = null;
        }
        rafId = requestAnimationFrame(tick);
      };

      let cleanedUp = false;
      cleanupFn = () => {
        // Guard against double cleanup: onSpeechDetected() below typically
        // triggers the caller to also invoke the stop() function this module
        // returned, which would otherwise try to close this AudioContext
        // twice and throw an unhandled InvalidStateError.
        if (cleanedUp) return;
        cleanedUp = true;
        cancelAnimationFrame(rafId);
        stream.getTracks().forEach((t) => t.stop());
        try { audioCtx.close().catch(() => { }); } catch (e) { }
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
      try { audioCtx.close().catch(() => { }); } catch (e) { }
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
  // Set once the current recording segment has confirmed real speech (past
  // noise-floor calibration + sustain check) - gates whether we bother
  // sending the clip to transcription at all.
  const speechConfirmedRef = useRef(false);

  // When true, the next transcribed turn is treated as the answer to "what's
  // your pincode?" instead of a normal shopping message. Login is no longer
  // required to use the agent, but we still need a delivery pincode to be
  // useful, so it's collected conversationally the first time it's missing.
  const awaitingPincodeRef = useRef(false);
  // Counts real shopping-assistance replies given this session while the
  // user isn't logged in, so we can nudge them toward logging in once
  // (for better, personalized results) without blocking anonymous use.
  const anonymousResponseCountRef = useRef(0);
  const hasNudgedLoginRef = useRef(false);

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

  // Every recognized utterance gets its own task id. Bumped the moment a new
  // one starts, which both cancels whatever the previous task was doing
  // (aborts its chat request) and lets that old task's own async
  // continuations recognize they've been superseded and bail out silently
  // instead of speaking a stale reply over/after the new one.
  const activeTaskIdRef = useRef(0);

  // Guards against two audio clips ever sounding at once. Every attempt to
  // play TTS (filler, reply, welcome, apology...) claims the next number
  // *before* it starts fetching, so "who asked most recently" is fixed at
  // request time - not decided by whichever network response happens to
  // come back first. Right before actually playing, each one re-checks that
  // it's still the highest number claimed; if something newer has since
  // taken over, it discards itself instead of talking over it. This closes
  // a real race: e.g. a filler line's TTS fetch resolving *after* the real
  // reply's already started playing would otherwise barge in on top of it.
  const audioGenerationRef = useRef(0);

  const cleanupVad = () => {
    if (vadRafRef.current !== null) {
      cancelAnimationFrame(vadRafRef.current);
      vadRafRef.current = null;
    }
    if (vadAudioCtxRef.current) {
      try { vadAudioCtxRef.current.close().catch(() => { }); } catch (e) { }
      vadAudioCtxRef.current = null;
    }
  };

  // Fetches TTS audio, plays it, and lets the user barge in (start talking)
  // to cut it off early - mirrors how ChatGPT's voice mode behaves. Always
  // resolves exactly once via onFinished, whether the clip finished naturally,
  // was interrupted, or failed to play.
  const playTtsAudio = async (
    text: string,
    onFinished: (result: { bargedIn: boolean; played: boolean; error?: string; superseded?: boolean }) => void,
    allowBargeIn = true
  ) => {
    let stopBargeInMonitor: (() => void) | null = null;
    let stopPlaybackLevelMonitor: (() => void) | null = null;
    let settled = false;

    const finish = (result: { bargedIn: boolean; played: boolean; error?: string; superseded?: boolean }) => {
      if (settled) return;
      settled = true;
      stopBargeInMonitor?.();
      stopPlaybackLevelMonitor?.();
      onFinished(result);
    };

    try {
      // Claim the next generation number before fetching anything - "who
      // asked most recently" is decided by request order, not by whichever
      // network response happens to come back first.
      audioGenerationRef.current += 1;
      const myGeneration = audioGenerationRef.current;

      // Stop whatever's currently audible right away rather than letting it
      // keep playing while this request is still fetching.
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

      // Something newer has already claimed the "currently speaking" slot
      // while this fetch was in flight (e.g. a filler line that took longer
      // than the real reply it was supposed to be filling time for) -
      // discard this one instead of talking over whatever's already playing.
      if (audioGenerationRef.current !== myGeneration) {
        finish({ bargedIn: false, played: false, superseded: true });
        return;
      }

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
  const playFillerLine = (userText: string) => {
    const phrase = pickContextualFillerLine(userText);
    playTtsAudio(phrase, () => { }, false);
  };

  // Shared "what happens after the assistant finishes speaking a turn" logic -
  // used by both the real chat reply and the local quick-reply shortcut below.
  const handleAssistantTurnFinished = (result: { bargedIn: boolean; played: boolean; error?: string; superseded?: boolean }) => {
    if (result.superseded) {
      // A newer clip already took over the speaker - not a failure, and
      // that newer clip's own onFinished is the one that should drive what
      // happens next, not this stale one.
      return;
    }
    if (!result.played) {
      terminateWithThankYou(result.error || "TTS error");
      return;
    }
    if (result.bargedIn) {
      shouldTerminateAfterTtsRef.current = false;
      // The user is already mid-sentence (that's what triggered the barge-in),
      // so skip the usual noise-floor calibration for this recording.
      if (isAgentActiveRef.current) startRecording(true);
      return;
    }
    if (shouldTerminateAfterTtsRef.current) {
      setIsAgentActive(false);
      isAgentActiveRef.current = false;
      shouldTerminateAfterTtsRef.current = false;
    } else if (isAgentActiveRef.current) {
      startRecording();
    }
  };

  // Wraps handleAssistantTurnFinished with a staleness check: if a newer
  // task has started since this one's TTS began playing, this task has been
  // superseded and should not act (e.g. must not call startRecording() and
  // potentially fight with whatever the newer task is already doing).
  const createTurnFinishedHandler = (myTaskId: number) =>
    (result: { bargedIn: boolean; played: boolean; error?: string; superseded?: boolean }) => {
      if (activeTaskIdRef.current !== myTaskId) return;
      handleAssistantTurnFinished(result);
    };

  // Handles the reply to "what's your delivery pincode?" - pulls the digits
  // out of whatever was transcribed, looks up delivery for that area the
  // same way PincodeModal does, and saves it so the rest of the site (and
  // subsequent agent replies, which read vendor_id fresh each call) picks it
  // up immediately. Keeps asking again on a bad/unrecognized answer.
  const handlePincodeAnswer = async (rawText: string, myTaskId: number) => {
    // Processing for this turn is done - clear this now (not just in
    // stopRecording's outer finally) so the mic isn't still gated as "busy"
    // by the time playTtsAudio's onFinished tries to start the next
    // recording once this reply is spoken.
    setIsTranscribing(false);

    const digits = rawText.replace(/\D/g, "");
    const onFinishedIfCurrent = createTurnFinishedHandler(myTaskId);

    if (digits.length < 3 || digits.length > 8) {
      if (activeTaskIdRef.current !== myTaskId) return;
      const askAgainText = "Sorry, I didn't quite catch a pincode there - could you say it again? Just the numbers is perfect.";
      const msgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: msgId, sender: "agent", text: askAgainText }]);
      await playTtsAudio(askAgainText, onFinishedIfCurrent);
      return;
    }

    try {
      const res = await getVendorByPincode(digits);
      const vendorList = Array.isArray(res?.data) ? res.data : res ? [res] : [];
      const vendorData = vendorList[0] || res;
      const vendorIdValue = vendorData?.slug || vendorData?.name || vendorData?.id;

      if (!vendorIdValue && vendorList.length === 0) {
        throw new Error("No delivery available for this pincode");
      }

      if (activeTaskIdRef.current !== myTaskId) return;

      localStorage.setItem("pincode", digits);
      if (vendorIdValue) {
        localStorage.setItem("vendor_id", String(vendorIdValue));
        localStorage.setItem("vendor_data", JSON.stringify(vendorData));
      }
      window.dispatchEvent(new Event("pincode-updated"));
      window.dispatchEvent(new Event("storage"));

      awaitingPincodeRef.current = false;

      const confirmText = `Perfect, I've set your delivery area to ${digits}. What can I help you find today?`;
      const msgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: msgId, sender: "agent", text: confirmText }]);
      await playTtsAudio(confirmText, onFinishedIfCurrent);
    } catch (err: any) {
      if (activeTaskIdRef.current !== myTaskId) return;
      console.error("Pincode lookup failed:", err);
      const failText = `Hmm, I couldn't find delivery for ${digits} - mind trying a different pincode?`;
      const msgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: msgId, sender: "agent", text: failText }]);
      await playTtsAudio(failText, onFinishedIfCurrent);
    }
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

    // Login isn't required to use the agent anymore, so a stale/expired
    // token should never hard-block the conversation - just drop it and let
    // the next request go through anonymously.
    if (errorMessage === "Invalid or expired token." || errorMessage?.includes("Invalid or expired token")) {
      localStorage.removeItem("token");
    }

    let thankYouText = "Ah, sorry about that - something glitched on my end. Give it another shot in a bit!";
    if (isVoiceQuotaError) {
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

  // Refresh the agent's session on login: a session created while anonymous
  // shouldn't keep being reused once the user is authenticated, so drop it
  // and (if the agent has actually been used) fetch a fresh one tied to the
  // now-logged-in identity right away instead of waiting for the next
  // "Start Agent" click.
  const wasLoggedInRef = useRef(
    typeof window !== "undefined" && !!localStorage.getItem("token")
  );
  useEffect(() => {
    const handleAuthChange = () => {
      const isLoggedInNow = typeof window !== "undefined" && !!localStorage.getItem("token");
      if (isLoggedInNow === wasLoggedInRef.current) return;
      wasLoggedInRef.current = isLoggedInNow;

      const hadSession = typeof window !== "undefined" && !!localStorage.getItem("agent_session_id");
      localStorage.removeItem("agent_session_id");
      setSessionId(null);

      if (isLoggedInNow) {
        // Logging in unlocks better, personalized help - no need for the
        // anonymous-usage nudge/counter anymore.
        anonymousResponseCountRef.current = 0;
        hasNudgedLoginRef.current = false;

        if (hadSession || isAgentActiveRef.current) {
          createAgentSession()
            .then((sessionData) => {
              const newSessionId =
                sessionData.session_id || sessionData.id ||
                (sessionData.data && (sessionData.data.session_id || sessionData.data.id));
              if (newSessionId) {
                setSessionId(newSessionId);
                localStorage.setItem("agent_session_id", newSessionId);
              }
            })
            .catch((err) => {
              console.error("Failed to refresh agent session after login:", err);
            });
        }
      }
    };

    window.addEventListener("storage", handleAuthChange);
    return () => window.removeEventListener("storage", handleAuthChange);
  }, []);

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

  // assumeSpeaking: true when we already know the user is actively talking
  // (e.g. they just barged in over the assistant). In that case, running the
  // normal ambient-noise calibration would sample their live voice as if it
  // were background noise, inflating the threshold and making the rest of
  // what they say fail to register as speech - so skip straight to "speech
  // confirmed" instead of calibrating from scratch mid-sentence.
  async function startRecording(assumeSpeaking = false) {
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

      speechConfirmedRef.current = assumeSpeaking;
      let speechStarted = assumeSpeaking;
      let silenceStart: number | null = null;
      let aboveThresholdSince: number | null = null;

      // Calibration phase: sample the room's ambient noise briefly so the
      // speech threshold adapts to this environment instead of a fixed guess.
      // Skipped entirely when assumeSpeaking, since there's no quiet moment
      // to sample - the user is already talking.
      let calibrating = !assumeSpeaking;
      const calibrationStart = performance.now();
      const calibrationSamples: number[] = [];
      let dynamicThreshold = VAD_SPEECH_RMS_THRESHOLD;

      const tick = () => {
        const rms = computeRms(analyser, vadData);
        orbLevelRef.current = rms;

        if (calibrating) {
          calibrationSamples.push(rms);
          if (performance.now() - calibrationStart >= NOISE_CALIBRATION_MS) {
            calibrating = false;
            const noiseFloor = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
            dynamicThreshold = computeDynamicThreshold(
              noiseFloor,
              VAD_SPEECH_RMS_THRESHOLD,
              VAD_NOISE_MARGIN_MULTIPLIER,
              VAD_NOISE_MARGIN_MIN
            );
          }
          vadRafRef.current = requestAnimationFrame(tick);
          return;
        }

        if (rms > dynamicThreshold) {
          if (aboveThresholdSince === null) aboveThresholdSince = performance.now();
          if (performance.now() - aboveThresholdSince >= VAD_SUSTAIN_MS) {
            speechStarted = true;
            speechConfirmedRef.current = true;
            silenceStart = null;
          }
        } else {
          aboveThresholdSince = null;
          if (speechStarted) {
            if (silenceStart === null) {
              silenceStart = performance.now();
            } else if (performance.now() - silenceStart > VAD_SILENCE_HOLD_MS) {
              stopRecording();
              return;
            }
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

      // The mic picked something up, but it never rose clearly above the
      // calibrated ambient noise floor for long enough to count as real
      // speech - almost certainly just background noise (fan, traffic, hum).
      // Discard it instead of sending it to transcription, which can
      // otherwise hallucinate words out of non-speech audio.
      if (!speechConfirmedRef.current) {
        console.warn("No confirmed speech in this segment - discarding without transcribing.");
        setIsTranscribing(false);
        if (isAgentActiveRef.current) {
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

        // A new task has been given - kill whatever the previous one was
        // still doing (abort its chat request if any is in flight) so only
        // one task is ever running at a time, and mark this as the new
        // current task so any of the old one's async continuations that do
        // eventually resolve can recognize they've been superseded.
        if (chatAbortControllerRef.current) {
          chatAbortControllerRef.current.abort();
          chatAbortControllerRef.current = null;
        }
        activeTaskIdRef.current += 1;
        const myTaskId = activeTaskIdRef.current;

        // Add user query to messages list
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, sender: "user", text }]);

        // If we just asked for a delivery pincode, this turn is the answer -
        // handle it locally instead of treating it as a shopping question.
        if (awaitingPincodeRef.current) {
          await handlePincodeAnswer(text, myTaskId);
          return;
        }

        // Greetings and clearly off-topic small talk get answered instantly,
        // without spending a round trip on the shopping backend.
        const quickReply = getLocalQuickReply(text);
        if (quickReply) {
          // Done processing this turn - clear before playTtsAudio's
          // onFinished tries to start the next recording (see note in
          // handlePincodeAnswer).
          setIsTranscribing(false);
          const quickMsgId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, { id: quickMsgId, sender: "agent", text: quickReply }]);
          await playTtsAudio(quickReply, createTurnFinishedHandler(myTaskId));
          return;
        }

        // Give a quick, relevant spoken acknowledgement while the chat API
        // call is in flight, instead of leaving the wait silent.
        playFillerLine(text);

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
          // A newer task started while this one was waiting on the chat API
          // (shouldn't normally happen since the abort above should have
          // cancelled it, but guard anyway) - don't act on a stale reply.
          if (activeTaskIdRef.current !== myTaskId) return;
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
          if (action == 'login' || action === 'Login' || action === 'GotoLogin' || action === 'gotoLogin') {
            router.push('/login');
          }
        } catch (chatErr: any) {
          clearTimeout(timeoutId);
          // This request was deliberately killed because a newer task took
          // over (see the abort() above) - not a real failure, so no error
          // message, no apology, nothing to speak. The new task is already
          // handling things.
          if (chatErr?.name === "AbortError" && activeTaskIdRef.current !== myTaskId) {
            return;
          }
          console.error("Chat API error:", chatErr);
          await terminateWithThankYou(chatErr.message || "Chat API error");
          return;
        }

        // The chat API call is fully done now - only now is it safe to clear
        // this. Leaving it set until here (not just in the outer finally)
        // keeps the mic gated off for the entire time the chat request is in
        // flight, and also avoids a race where playTtsAudio's onFinished
        // tries to start the next recording before this flag is reset.
        setIsTranscribing(false);

        // Login is no longer required to use the agent, but it does unlock
        // better, personalized help - so anonymous users get 3 free replies,
        // then a one-time nudge tacked onto the end of the 3rd reply.
        const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("token");
        if (!isLoggedIn) {
          anonymousResponseCountRef.current += 1;
          if (anonymousResponseCountRef.current >= 3 && !hasNudgedLoginRef.current) {
            hasNudgedLoginRef.current = true;
            replyText = `${replyText} By the way, if you log in I can save your cart and give you more personalized help - want to sign in for better results?`;
          }
        }

        if (activeTaskIdRef.current !== myTaskId) return;

        // Add agent response to messages list
        const agentMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: agentMsgId, sender: "agent", text: replyText }]);

        // Convert response text to voice and play it. Barge-in lets the user
        // start talking over the assistant to cut it off, just like ChatGPT voice.
        await playTtsAudio(stripMarkdown(replyText), createTurnFinishedHandler(myTaskId));

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
      // Fresh session, fresh 3-reply anonymous allowance.
      anonymousResponseCountRef.current = 0;
      hasNudgedLoginRef.current = false;
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

        // No login required to use the agent - but we do need a delivery
        // pincode to be useful, so ask for it conversationally the first
        // time it's missing (mirrors what PincodeModal does elsewhere).
        const hasPincode = typeof window !== "undefined" && !!localStorage.getItem("pincode");
        awaitingPincodeRef.current = !hasPincode;

        const hasPriorChat = messages.length > 0;

        if (hasPincode && hasPriorChat) {
          // Already talked before and we know where to deliver - skip the
          // welcome spiel and jump straight back into listening.
          setIsTranscribing(false);
          startRecording();
        } else {
          const welcomeText = hasPincode
            ? "Hey, welcome to eFresh! I'm your shopping buddy - here to help you find great picks, add stuff to your cart, or just get you where you need to go. What are we grabbing today?"
            : "Hey, welcome to eFresh! I'm your shopping buddy. First up, what's your delivery pincode or postcode, so I can find stores near you?";

          // Add welcome message to visual chat window
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
        }
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
            <Sparkles className="w-8 h-8 text-[var(--theme-color1)]/40 mb-2 animate-pulse" />
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
                  ? "text-white rounded-tr-none"
                  : "bg-white text-gray-700 border border-gray-100 rounded-tl-none markdown-body"
                  }`}
                style={msg.sender === "user" ? { background: "var(--theme-color2)", color: "#ffffff" } : {}}
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
            className={`voice-orb ${orbState === "thinking" ? "voice-orb--thinking" : ""} rounded-full`}
            style={{ borderRadius: "50%", overflow: "hidden", clipPath: "circle(50% at 50% 50%)" }}
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
            : "bg-[var(--theme-color1)]/10 text-[var(--theme-color1)] hover:bg-[var(--theme-color1)]/20"
            }`}
        >
          {isAgentActive ? "Stop Agent" : "Start Agent"}
        </button>
      </div>

      {/* Command input */}
      <form onSubmit={handleTextSubmit} className="flex gap-2 items-center bg-white p-1 border border-gray-200 rounded-xl shadow-sm mb-5 focus-within:border-[var(--theme-color1)] transition-all" style={{ display: 'none' }}>
        <input
          type="text"
          value={textCommand}
          onChange={(e) => setTextCommand(e.target.value)}
          placeholder="Type command (e.g. 'go to shop')"
          className="flex-1 px-3 py-2 text-xs text-gray-700 bg-white outline-none rounded-lg"
        />
        <button
          type="submit"
          className="p-2 text-white rounded-full transition-colors cursor-pointer flex items-center justify-center shadow-md shadow-[var(--theme-color1)]/20"
          style={{ background: "var(--theme-color2)", color: "#ffffff" }}
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
          border-radius: 50% !important;
          -webkit-border-radius: 50% !important;
          clip-path: circle(50% at 50% 50%) !important;
          -webkit-clip-path: circle(50% at 50% 50%) !important;
          position: relative;
          overflow: hidden !important;
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
          border-radius: 50% !important;
          -webkit-border-radius: 50% !important;
          clip-path: circle(50% at 50% 50%) !important;
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
    if (isAgentActive) {
      setShowFloatingPanel(true);
    }
  }, [isAgentActive]);

  const renderFloatingVoiceAgent = () => (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 select-none font-sans">
      {/* Floating Control Panel */}
      {showFloatingPanel && (
        <div
          className="w-[calc(100vw-3rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 flex flex-col max-h-[500px]"
          style={{ boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2)" }}
        >
          {/* Header */}
          <div className="text-white px-4 py-2.5 flex items-center justify-between border-b border-white/10" style={{ background: "var(--theme-color2)" }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Sparkles size={12} className="animate-pulse text-white" />
              </div>
              <span className="font-semibold text-xs text-white/95 tracking-wide">
                eFresh Voice Assistant
              </span>
            </div>
            <button
              onClick={() => setShowFloatingPanel(false)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content (Voice Panel) */}
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-white custom-scrollbar">
            <VoiceAssistantSidebarPanel />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) with pulsing rings */}
      <div className="relative">
        {!showFloatingPanel && (
          <>
            <span
              className="block absolute inset-0 rounded-full bg-[var(--theme-color1)]/25 animate-ping"
              style={{ animationDuration: '2.5s', borderRadius: "50%", clipPath: "circle(50% at 50% 50%)" }}
            />
            <span
              className="block absolute -inset-1 rounded-full bg-[var(--theme-color1)]/10 animate-pulse"
              style={{ borderRadius: "50%", clipPath: "circle(50% at 50% 50%)" }}
            />
          </>
        )}
        <button
          onClick={() => setShowFloatingPanel(!showFloatingPanel)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl border cursor-pointer transition-all duration-300 bg-white text-gray-700 border-gray-100 hover:scale-105 active:scale-95 z-10 overflow-hidden"
          style={{ boxShadow: "0 8px 24px rgba(13, 164, 135, 0.35)", borderRadius: "50%", clipPath: "circle(50% at 50% 50%)" }}
        >
          {showFloatingPanel ? (
            <ChevronDown size={22} className="text-[var(--theme-color1)]" />
          ) : (
            <Mic size={22} className="text-[var(--theme-color1)] animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* On Mobile Screens (lg:hidden): Always show Voice Assistant FAB on all pages */}
      <div className="lg:hidden">
        {renderFloatingVoiceAgent()}
      </div>

      {/* On Desktop Screens (lg:block): Homepage shows FAB, inner pages show Sidebar */}
      {isHomepage ? (
        <div className="hidden lg:block">
          {renderFloatingVoiceAgent()}
        </div>
      ) : (
    <aside className="hidden lg:flex fixed top-0 right-0 h-screen w-[320px] bg-white border-l border-[#eceff1] z-[60] flex-col shadow-xl overflow-hidden font-sans">
      {/* TOP HALF: CART */}
      <div className="h-1/2 flex flex-col border-b border-[#eceff1] overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eceff1] bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--theme-color1)]/10 flex items-center justify-center text-[var(--theme-color1)]">
              <ShoppingBag size={15} />
            </div>
            <div>
              <h6 className="font-bold text-xs text-gray-800 tracking-wide">
                Your Cart
              </h6>
              <p className="text-[9px] text-gray-400 font-medium">Manage your items</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--theme-color1)] text-white">
            {items.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 bg-white custom-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-1.5 text-center py-4">
              <Image
                src={getPublicAssetUrl("/images/notfound.svg")}
                alt="Your cart is empty"
                width={70}
                height={70}
                className="object-contain mb-1"
              />
              <p className="font-bold text-gray-700 text-xs">Your cart is empty</p>
              <p className="text-[11px] text-gray-400 max-w-[180px]">Add some fresh items to your cart to checkout!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border-b border-gray-100">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-2.5 py-2.5 px-1 bg-white hover:bg-gray-50/50 transition-colors"
                >
                  <div className="relative w-11 h-11 rounded-xs overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      unoptimized
                      className="object-contain p-1"
                      sizes="44px"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getPublicAssetUrl("/images/placeholder.png");
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0 h-full py-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-bold !text-[#0c2646] truncate leading-snug" style={{ color: "#0c2646" }}>{item.product.name}</span>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 size={14} className="stroke-[1.75]" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 mt-1">
                      <span className="text-xs font-bold text-[#0da487] flex items-baseline gap-0.5">
                        ${(item.product.price * item.quantity).toFixed(2)}
                        {(item.product.unit_type || item.product.product_type) && (
                          <span className="text-[10px] font-normal text-[#5282b8] ml-0.5">
                            / {item.product.unit_type || item.product.product_type}
                          </span>
                        )}
                      </span>
                      <div className="flex items-center border border-gray-200 rounded-xs bg-white px-1.5 py-0.5 text-xs">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="text-gray-600 hover:text-black transition-colors px-1 cursor-pointer font-bold text-xs"
                        >
                          –
                        </button>
                        <span className="font-bold text-[#0c2646] px-1.5 min-w-[14px] text-center select-none text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="text-gray-600 hover:text-black transition-colors px-1 cursor-pointer font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Total Summary / Checkout Buttons */}
        {items.length > 0 && (
          <div className="p-3.5 bg-white border-t border-[#eceff1] space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-semibold">Total:</span>
              <span className="text-base font-extrabold text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                className="btn-outline flex-1 py-2 px-2 text-xs font-bold text-center"
              >
                <ShoppingBag size={13} />
                <span>View Cart</span>
              </Link>
              <Link
                href="/checkout"
                className="btn-primary flex-1 py-2 px-2 text-xs font-bold text-center"
              >
                <span>Checkout</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM HALF: VOICE ASSISTANT */}
      <div className="h-1/2 flex flex-col overflow-hidden bg-white">
        {/* Voice Header */}
        <div className="flex items-center justify-between px-4 py-2.5 text-white border-b border-white/10" style={{ background: "var(--theme-color2)" }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Sparkles size={12} className="animate-pulse text-white" />
            </div>
            <span className="font-semibold text-xs text-white/95 tracking-wide">
              eFresh Voice Assistant
            </span>
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
      )}
    </>
  );
}
