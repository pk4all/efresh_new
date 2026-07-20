import { create } from "zustand";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
}

interface AgentStore {
  isAgentActive: boolean;
  sessionId: string | null;
  messages: Message[];
  setIsAgentActive: (active: boolean) => void;
  setSessionId: (id: string | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  
  // Track active recorder and audio instances globally to prevent overlap
  mediaRecorder: MediaRecorder | null;
  setMediaRecorder: (rec: MediaRecorder | null) => void;
  activeAudio: HTMLAudioElement | null;
  setActiveAudio: (audio: HTMLAudioElement | null) => void;
  isTranscribing: boolean;
  setIsTranscribing: (val: boolean) => void;
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  isAgentActive: false,
  sessionId: null,
  messages: [],
  setIsAgentActive: (active) => set({ isAgentActive: active }),
  setSessionId: (id) => set({ sessionId: id }),
  setMessages: (update) =>
    set((state) => ({
      messages: typeof update === "function" ? update(state.messages) : update,
    })),
  mediaRecorder: null,
  setMediaRecorder: (rec) => set({ mediaRecorder: rec }),
  activeAudio: null,
  setActiveAudio: (audio) => set({ activeAudio: audio }),
  isTranscribing: false,
  setIsTranscribing: (val) => set({ isTranscribing: val }),
  isRecording: false,
  setIsRecording: (val) => set({ isRecording: val }),
}));
