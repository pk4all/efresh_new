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
import { Scribe, RealtimeEvents, CommitStrategy, type RealtimeConnection } from "@elevenlabs/client";

type SttSession = { connection: RealtimeConnection; getTranscript: () => string; isReady: () => boolean };

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
const VAD_SILENCE_HOLD_MS = 3000;
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

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);
  // The raw mic stream for the current recording segment - VAD's analyser
  // and the realtime STT connection's own internal capture both read from
  // the same physical microphone independently, but this is the handle used
  // to stop tracks and free the mic between segments.
  const currentMicStreamRef = useRef<MediaStream | null>(null);
  // Set once the current recording segment has confirmed real speech (past
  // noise-floor calibration + sustain check) - gates whether we bother
  // finalizing/sending anything to transcription at all.
  const speechConfirmedRef = useRef(false);
  // Manually toggled by clicking the orb - while true, nothing (VAD turn
  // completion, barge-in, the assistant finishing a reply) is allowed to
  // start listening again. Ref for synchronous checks inside
  // startRecording()'s guard, mirrored into state to drive the orb's label.
  const isListeningPausedRef = useRef(false);
  const [isListeningPaused, setIsListeningPaused] = useState(false);
  // Set by playTtsAudio while a barge-in-able clip is playing, to the exact
  // same "stop this clip and start listening" function the voice barge-in
  // monitor calls - lets the manual stop-speaking button trigger the
  // identical, already-consistent code path instead of a separate one.
  const manualInterruptRef = useRef<(() => void) | null>(null);
  // Set by the realtime STT connection's own close/error handlers if it dies
  // mid-recording; the VAD tick loop polls this each frame and ends the
  // segment from there, rather than calling stopRecording() directly from a
  // WebSocket event callback.
  const connectionDroppedRef = useRef(false);

  // Realtime speech-to-text (ElevenLabs Scribe v2 realtime, over WebSocket).
  // Streams audio continuously while recording instead of uploading one big
  // clip after the fact - turn-taking (when to stop listening) is still
  // entirely decided by our own VAD above, this only replaces how the
  // transcript text itself is obtained. Manual commit strategy: we tell it
  // when a turn is over (via our own silence detection), not its own VAD.
  // Each connection gets its OWN isolated transcript accumulator (a plain
  // closure variable, not a shared ref) - a single shared ref meant a late
  // event from a just-superseded connection could land after a new one had
  // already reset it, leaking old text into the new segment.
  const scribeConnectionRef = useRef<SttSession | null>(null);
  const [livePartialText, setLivePartialText] = useState("");
  // A connection opened ahead of time (muted, so it isn't yet capturing
  // anything real) so it's already fully connected the instant it's needed -
  // whether that's a barge-in or you replying the moment a response
  // finishes. Without this, opening a fresh connection from scratch (token
  // fetch + WebSocket handshake) takes long enough that the first words
  // spoken right after an interruption or a quick reply could be lost
  // before the connection was even ready to receive them.
  const prewarmedSttRef = useRef<Promise<SttSession | null> | null>(null);

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

  // Closes the realtime STT connection (if any) without waiting for a final
  // commit - used when the agent is stopped/torn down mid-recording, as
  // opposed to stopRecording()'s normal "commit and read the transcript" path.
  const cleanupScribeConnection = () => {
    if (scribeConnectionRef.current) {
      try { scribeConnectionRef.current.connection.close(); } catch (e) { }
      scribeConnectionRef.current = null;
    }
    setLivePartialText("");
  };

  // Closes and discards any connection that was opened ahead of time but
  // never actually got used (e.g. the agent was stopped while a reply was
  // still playing, before a barge-in or the next turn ever claimed it).
  const cleanupPrewarmedStt = () => {
    const pending = prewarmedSttRef.current;
    prewarmedSttRef.current = null;
    if (pending) {
      pending.then((session) => {
        if (session) { try { session.connection.close(); } catch (e) { } }
      });
    }
  };

  // Opens a fresh realtime STT connection. Mints a short-lived token
  // server-side first so the raw ElevenLabs API key is never exposed to the
  // browser. When startMuted is set (used for pre-warming ahead of time,
  // before we actually want it capturing anything), the mic is muted the
  // instant it's available so it doesn't pick up the assistant's own
  // playing TTS audio while just standing by - callers unmute it themselves
  // once they actually start using it.
  const startRealtimeStt = async (opts?: { startMuted?: boolean }): Promise<SttSession | null> => {
    try {
      const tokenRes = await fetch("/demo/api/stt-token", { method: "POST" });
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get realtime STT token");
      }
      const { token } = await tokenRes.json();

      let accumulated = "";
      let ready = false;

      const connection = Scribe.connect({
        token,
        modelId: "scribe_v2_realtime",
        languageCode: "en",
        commitStrategy: CommitStrategy.MANUAL,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (opts?.startMuted) {
        try { connection.mute(); } catch (e) { }
      }

      connection.on(RealtimeEvents.SESSION_STARTED, () => {
        ready = true;
        if (opts?.startMuted) {
          // The underlying mic track may not have existed yet the first
          // time mute() was attempted right after connect() - it certainly
          // does by now, so make sure it actually took.
          try { connection.mute(); } catch (e) { }
        }
      });
      connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
        setLivePartialText(data.text || "");
      });
      connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
        const chunk = (data.text || "").trim();
        if (chunk) {
          accumulated = accumulated ? `${accumulated} ${chunk}` : chunk;
        }
        setLivePartialText("");
      });
      connection.on(RealtimeEvents.ERROR, (data: any) => {
        console.error("Realtime STT error:", data?.error || data?.message || JSON.stringify(data));
      });

      // The connection can die mid-recording (dropped network, quota/rate
      // limit, session timeout, etc). Without reacting to this, the mic
      // would keep "listening" locally while nothing is actually being
      // transcribed server-side, which looks like the agent silently
      // stopping to respond even though you're still talking. Flag it here;
      // the VAD tick loop (which already owns ending a recording segment)
      // picks this up on its next frame and ends the segment from there.
      const endSegmentIfCurrent = () => {
        if (scribeConnectionRef.current?.connection === connection) {
          connectionDroppedRef.current = true;
        }
      };
      connection.on(RealtimeEvents.CLOSE, endSegmentIfCurrent);
      connection.on(RealtimeEvents.AUTH_ERROR, endSegmentIfCurrent);
      connection.on(RealtimeEvents.QUOTA_EXCEEDED, endSegmentIfCurrent);
      connection.on(RealtimeEvents.RATE_LIMITED, endSegmentIfCurrent);
      connection.on(RealtimeEvents.RESOURCE_EXHAUSTED, endSegmentIfCurrent);
      connection.on(RealtimeEvents.SESSION_TIME_LIMIT_EXCEEDED, endSegmentIfCurrent);
      connection.on(RealtimeEvents.TRANSCRIBER_ERROR, endSegmentIfCurrent);

      return { connection, getTranscript: () => accumulated, isReady: () => ready };
    } catch (err) {
      console.error("Failed to start realtime STT:", err);
      return null;
    }
  };

  // Starts opening a connection now (muted) so it's ready ahead of need,
  // rather than only when we actually call for one. A no-op if one is
  // already warming/warmed.
  const prewarmRealtimeStt = () => {
    if (!prewarmedSttRef.current) {
      prewarmedSttRef.current = startRealtimeStt({ startMuted: true });
    }
  };

  // Claims the pre-warmed connection if one is ready (or still connecting -
  // either way it's further along than starting from scratch), falling back
  // to opening a brand new one if none was pre-warmed. Either way, unmutes
  // it (a fresh connection isn't muted to begin with, so this is a no-op for
  // that path) and clears the pre-warm slot so nothing else can also claim it.
  const takeSttConnection = (): Promise<SttSession | null> => {
    const pending = prewarmedSttRef.current;
    prewarmedSttRef.current = null;
    const sessionPromise = pending || startRealtimeStt();
    return sessionPromise.then((session) => {
      if (session) {
        const tryUnmute = () => { try { session.connection.unmute(); } catch (e) { } };
        tryUnmute();
        // If this connection was only just pre-warmed (little/no lead time -
        // e.g. a short reply that got interrupted almost immediately), the
        // SDK's own internal mic track may not exist yet, and unmute() would
        // silently fail with nothing to retry it - leaving the connection
        // stuck muted (mic effectively dead) for the rest of this segment.
        // Retry once the session is confirmed up, since the track certainly
        // exists by then; harmless no-op if the first attempt already worked.
        session.connection.on(RealtimeEvents.SESSION_STARTED, tryUnmute);
      }
      return session;
    });
  };

  // Tells the connection this segment is over and waits for its final
  // committed_transcript event (with a short timeout so a dropped event
  // can't hang the conversation forever), then closes the connection.
  const finalizeRealtimeStt = (session: SttSession): Promise<string> => {
    const { connection, getTranscript } = session;

    // Mute the mic capture the instant we decide the input is done, not once
    // the connection eventually closes. Committing just tells the server
    // "finalize what you have" - the SDK's own mic stream keeps actively
    // capturing and sending audio afterward until close(), so without this
    // the mic stays functionally "listening" for as long as it takes to get
    // the committed transcript back and the connection to tear down.
    try { connection.mute(); } catch (e) { }

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        // Without this, a finished connection was left open indefinitely -
        // its WebSocket and the SDK's own internal mic stream would both
        // keep running in the background for the rest of the session.
        try { connection.close(); } catch (e) { }
        resolve(getTranscript().trim());
      };

      const timeoutId = setTimeout(finish, 4000);

      const doCommit = () => {
        connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, finish);
        try {
          connection.commit();
        } catch (e) {
          console.error("Failed to commit realtime STT segment:", e);
          finish();
        }
      };

      if (session.isReady()) {
        doCommit();
      } else {
        // The WebSocket handshake hasn't finished yet - commit() would throw
        // "WebSocket is not connected" if called now, so wait for the
        // session to actually start first. The timeout above still applies
        // as a backstop if it never does.
        connection.on(RealtimeEvents.SESSION_STARTED, doCommit);
      }
    });
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
    let myInterruptFn: (() => void) | null = null;

    const finish = (result: { bargedIn: boolean; played: boolean; error?: string; superseded?: boolean }) => {
      if (settled) return;
      settled = true;
      stopBargeInMonitor?.();
      stopPlaybackLevelMonitor?.();
      // Only clear the shared slot if it's still pointing at this call's own
      // interrupt function - a newer clip may have already replaced it.
      if (manualInterruptRef.current === myInterruptFn) {
        manualInterruptRef.current = null;
      }
      onFinished(result);
    };

    // Get the next listening connection warming up now, in parallel with
    // everything below, so it's already open by the time it's actually
    // needed (a barge-in, or you replying right as this finishes) instead of
    // starting from scratch at that moment. Skipped for clips that aren't
    // followed by listening again (filler lines, the goodbye message).
    if (allowBargeIn) {
      prewarmRealtimeStt();
    }

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
        myInterruptFn = () => {
          try { audio.pause(); } catch (e) { }
          URL.revokeObjectURL(audioUrl);
          setActiveAudio(null);
          finish({ bargedIn: true, played: true });
        };
        manualInterruptRef.current = myInterruptFn;
        stopBargeInMonitor = createBargeInMonitor(myInterruptFn);
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

    if (currentMicStreamRef.current) {
      try { currentMicStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) { }
      currentMicStreamRef.current = null;
    }
    cleanupScribeConnection();
    cleanupPrewarmedStt();

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

  // Cleanup recording timeout, VAD listeners, mic stream, and the realtime
  // STT connection on unmount.
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      cleanupVad();
      if (currentMicStreamRef.current) {
        try { currentMicStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) { }
        currentMicStreamRef.current = null;
      }
      cleanupScribeConnection();
      cleanupPrewarmedStt();
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
          const success = addItem(matchedProduct, 1);
          if (success) {
            toast.success(`Added ${matchedProduct.name} to Cart`);
          }
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
  async function startRecording(assumeSpeaking = false, retryCount = 0) {
    const currentActiveAudio = useAgentStore.getState().activeAudio;
    const currentIsTranscribing = useAgentStore.getState().isTranscribing;
    if (!isAgentActiveRef.current || currentActiveAudio || currentIsTranscribing || isListeningPausedRef.current) return;

    // Stop any existing active recording session before starting a new one
    if (currentMicStreamRef.current) {
      try { currentMicStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) { }
      currentMicStreamRef.current = null;
    }
    if (scribeConnectionRef.current) {
      try { scribeConnectionRef.current.connection.close(); } catch (e) { }
      scribeConnectionRef.current = null;
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
      currentMicStreamRef.current = stream;
      setIsRecording(true);

      // Claims the connection pre-warmed while the assistant was last
      // speaking (already open, just needs unmuting) if one's available,
      // otherwise falls back to opening a fresh one. Runs in parallel with
      // VAD setup below - it has its own independent mic capture (via the
      // SDK's microphone option), so it doesn't need to wait on anything
      // here. Turn-taking (deciding when the user has stopped talking) is
      // entirely driven by our own VAD, not by this connection.
      takeSttConnection().then((session) => {
        // The recording may have already been stopped/superseded by the
        // time this resolves.
        if (currentMicStreamRef.current !== stream) {
          session?.connection.close();
          return;
        }
        scribeConnectionRef.current = session;
      });

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
      connectionDroppedRef.current = false;
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
      // If you answer immediately (e.g. a quick single-word reply right as
      // listening starts), the whole thing can happen inside the 400ms
      // calibration window - which used to be completely blind to speech,
      // so a fast short answer could be swallowed entirely, leaving nothing
      // to trigger the silence timer and stranding the recording open until
      // the 30s hard cap. Now a clearly loud, sustained signal is trusted as
      // real speech (against the safe static threshold) even mid-calibration,
      // instead of waiting the calibration window out no matter what.
      let earlySpeechSince: number | null = null;

      const tick = () => {
        if (connectionDroppedRef.current) {
          connectionDroppedRef.current = false;
          stopRecording();
          return;
        }

        const rms = computeRms(analyser, vadData);
        orbLevelRef.current = rms;

        if (calibrating) {
          calibrationSamples.push(rms);

          if (rms > VAD_SPEECH_RMS_THRESHOLD) {
            if (earlySpeechSince === null) earlySpeechSince = performance.now();
            if (performance.now() - earlySpeechSince >= VAD_SUSTAIN_MS) {
              calibrating = false;
              dynamicThreshold = VAD_SPEECH_RMS_THRESHOLD;
              speechStarted = true;
              speechConfirmedRef.current = true;
              aboveThresholdSince = earlySpeechSince;
              silenceStart = null;
              vadRafRef.current = requestAnimationFrame(tick);
              return;
            }
          } else {
            earlySpeechSince = null;
          }

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
    } catch (err: any) {
      console.error("Failed to start recording:", err);

      // A permission denial genuinely can't be recovered from without the
      // user re-granting access, so stop the whole session for that. Other
      // failures (most commonly a transient "device busy" error from the mic
      // being momentarily claimed by more than one stream right around a
      // barge-in - the barge-in monitor's own stream, a pre-warmed STT
      // connection's own internal mic capture, and this new request can all
      // briefly overlap) are very likely to succeed a moment later - retry
      // instead of killing the whole agent and forcing a manual restart over
      // what's usually a sub-second hiccup. A few attempts with backoff
      // rather than just one, since hardware release isn't always instant.
      const isPermissionError = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      if (isPermissionError) {
        toast.error("Failed to access microphone. Please check permissions.");
        setIsAgentActive(false);
        isAgentActiveRef.current = false;
        return;
      }

      const maxRetries = 5;
      if (isAgentActiveRef.current && retryCount < maxRetries) {
        const delay = 300 + retryCount * 300;
        setTimeout(() => {
          if (isAgentActiveRef.current) startRecording(assumeSpeaking, retryCount + 1);
        }, delay);
      } else if (isAgentActiveRef.current) {
        // Genuinely stuck, not just a brief hiccup - say so instead of
        // silently doing nothing, but leave the agent active so a manual
        // "Start Agent" toggle (or the next barge-in) can try again rather
        // than forcing a full stop.
        toast.error("Couldn't access the microphone after several tries. Please check that nothing else is using it.");
      }
    }
  }

  async function stopRecording() {
    const stream = currentMicStreamRef.current;
    const sttSession = scribeConnectionRef.current;
    if (!stream && !sttSession) return;

    cleanupVad();
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    // Stop the mic stream right away to turn off the microphone light - the
    // realtime STT connection keeps whatever audio it's already streamed
    // internally and doesn't need the stream kept open to finalize.
    if (stream) {
      try { stream.getTracks().forEach(t => t.stop()); } catch (e) { }
    }
    currentMicStreamRef.current = null;

    try {
      // The mic picked something up, but it never rose clearly above the
      // calibrated ambient noise floor for long enough to count as real
      // speech - almost certainly just background noise (fan, traffic, hum).
      // Discard it instead of finalizing the transcript, which can
      // otherwise hallucinate words out of non-speech audio.
      if (!speechConfirmedRef.current) {
        console.warn("No confirmed speech in this segment - discarding without transcribing.");
        if (sttSession) { try { sttSession.connection.close(); } catch (e) { } }
        scribeConnectionRef.current = null;
        setIsTranscribing(false);
        if (isAgentActiveRef.current) {
          startRecording();
        }
        return;
      }

      if (!sttSession) {
        console.warn("No realtime STT connection available for this segment.");
        setIsTranscribing(false);
        if (isAgentActiveRef.current) {
          toast.error("Couldn't reach the voice service. Please try again.");
          startRecording();
        }
        return;
      }

      const text = await finalizeRealtimeStt(sttSession);
      scribeConnectionRef.current = null;

      if (!isAgentActiveRef.current) return;
      if (text) {
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
          // Show whatever products the backend returned, regardless of which
          // action came back alongside them - not just the dedicated
          // searchProducts action. Set before navigating (below) so the
          // products page has them immediately on mount instead of a brief
          // empty state.
          const products = chatData?.data?.products;
          console.log(products, 'products');
          if (products?.length > 0) {
            const mapped = (products || []).map(mapApiProductToProduct);
            setProducts(mapped);
          }

          if (action == 'searchProducts') {
            if (typeof window !== "undefined" && window.location.pathname !== "/products") {
              // ?voice=1 tells the products page these results already came
              // from the assistant - don't run its own default category
              // fetch on top of (and overwrite) what we just set above.
              router.push("/products?voice=1");
              await new Promise((resolve) => setTimeout(resolve, 500));
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
      // currentMicStreamRef was already stopped/cleared before the try block
      // above ran - only the STT connection can still legitimately be open
      // here (e.g. if an error was thrown before finalizeRealtimeStt cleared it).
      if (scribeConnectionRef.current) {
        try { scribeConnectionRef.current.connection.close(); } catch (e) { }
        scribeConnectionRef.current = null;
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
    // Starting or stopping the whole agent always begins/ends in a normal,
    // unpaused state - stale pause state shouldn't carry over into a new session.
    isListeningPausedRef.current = false;
    setIsListeningPaused(false);

    if (isAgentActive) {
      setIsAgentActive(false);
      isAgentActiveRef.current = false;

      // Stop recording immediately and cleanup without processing a final response
      cleanupVad();
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      setIsRecording(false);
      setIsTranscribing(false);

      if (currentMicStreamRef.current) {
        try { currentMicStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) { }
        currentMicStreamRef.current = null;
      }
      cleanupScribeConnection();
      cleanupPrewarmedStt();

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

  // Clicking the orb toggles whether it's allowed to listen. Pausing while
  // actively recording abandons that recording outright - it's a mute, not
  // a "submit what I've said so far."
  const handleOrbClick = () => {
    if (!isAgentActiveRef.current) return;

    const next = !isListeningPausedRef.current;
    isListeningPausedRef.current = next;
    setIsListeningPaused(next);

    if (next) {
      if (isRecording) {
        cleanupVad();
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        if (currentMicStreamRef.current) {
          try { currentMicStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) { }
          currentMicStreamRef.current = null;
        }
        cleanupScribeConnection();
        setIsRecording(false);
      }
    } else if (!isTranscribing && !activeAudio) {
      // Resuming: start listening right away, unless something else is
      // already actively happening (thinking/speaking) - the normal flow
      // will pick it up once that finishes, now that the pause is cleared.
      startRecording();
    }
  };

  const orbState: "listening" | "thinking" | "speaking" | "paused" = isListeningPaused
    ? "paused"
    : isTranscribing
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
          <div className="relative">
            <div
              ref={orbElRef}
              onClick={handleOrbClick}
              role="button"
              tabIndex={0}
              aria-label={orbState === "paused" ? "Resume listening" : "Pause listening"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOrbClick();
                }
              }}
              className={`voice-orb ${orbState === "thinking" ? "voice-orb--thinking" : ""} ${orbState === "paused" ? "voice-orb--paused" : ""} rounded-full cursor-pointer`}
              style={{ borderRadius: "50%", overflow: "hidden", clipPath: "circle(50% at 50% 50%)" }}
            />
            {/* Pops up only while the assistant is actually speaking - lets
                you cut it off with a tap instead of needing to talk over it. */}
            {orbState === "speaking" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  manualInterruptRef.current?.();
                }}
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-[var(--theme-color1,#4967a9)] hover:bg-gray-50 active:scale-90 transition-transform cursor-pointer"
                aria-label="Stop speaking and start listening"
                title="Stop speaking"
              >
                <Mic size={12} />
              </button>
            )}
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            {orbState === "paused"
              ? "Paused - tap to resume"
              : orbState === "thinking"
                ? "Thinking..."
                : orbState === "speaking"
                  ? "Talking..."
                  : "Listening... (tap to pause)"}
          </span>
          {isRecording && livePartialText && (
            <span className="text-[11px] text-gray-400 italic max-w-[220px] text-center line-clamp-2">
              &quot;{livePartialText}&quot;
            </span>
          )}
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
        .voice-orb--paused {
          filter: grayscale(0.85) brightness(0.9);
          opacity: 0.6;
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

  // Which layout (floating FAB vs fixed sidebar) is shown was previously
  // decided with CSS breakpoint classes alone (lg:hidden / hidden lg:block),
  // which means BOTH branches - each with their own <VoiceAssistantSidebarPanel />
  // - were mounted simultaneously; CSS only hid one visually. Since that panel
  // owns its own mic stream, VAD loop, and realtime STT connection, having two
  // live instances meant two independent "agents" both reacting to the same
  // conversation. Deciding the breakpoint in JS instead ensures only one
  // branch - and therefore only one panel instance - is ever mounted at a time.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)"); // Tailwind's `lg` breakpoint
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  const showAsideLayout = isDesktop && !isHomepage;

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
      {/* Exactly one of these renders at a time (decided in JS via
          showAsideLayout above), never both - see the comment on isDesktop
          for why that matters here specifically. */}
      {showAsideLayout ? (
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
      ) : (
        renderFloatingVoiceAgent()
      )}
    </>
  );
}
