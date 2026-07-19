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
}));
