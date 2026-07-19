'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ChatSummary = {
  _id: string;
  title: string;
  updatedAt: string;
};

type ChatsContextValue = {
  chats: ChatSummary[];
  loading: boolean;
  refreshChats: () => Promise<void>;
};

const ChatsContext = createContext<ChatsContextValue | null>(null);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshChats = useCallback(async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  return (
    <ChatsContext.Provider value={{ chats, loading, refreshChats }}>
      {children}
    </ChatsContext.Provider>
  );
}

export function useChats() {
  const ctx = useContext(ChatsContext);
  if (!ctx) {
    throw new Error('useChats must be used within a ChatsProvider');
  }
  return ctx;
}
