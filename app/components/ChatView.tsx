'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useChats } from '@/app/chat/ChatsContext';

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function ChatView({ chatId }: { chatId?: string }) {
  const { user } = useAuth();
  const { refreshChats } = useChats();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(Boolean(chatId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    setError(null);

    fetch(`/api/chats/${chatId}/messages`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        if (!cancelled) {
          setMessages(
            data.messages.map((m: ChatMessage) => ({ role: m.role, content: m.content }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this conversation.');
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !user) return;

    setError(null);
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: text, chatId, userId: user.id }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Request failed');
      }

      const newChatId = res.headers.get('x-chat-id');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      }

      refreshChats();

      if (!chatId && newChatId) {
        router.replace(`/chat/${newChatId}`);
      }
    } catch {
      setError('Something went wrong while sending your message.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
          {loadingHistory && (
            <p className="text-center text-sm text-zinc-500">Loading conversation…</p>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-24">
              <p className="text-xl font-medium text-zinc-400 dark:text-zinc-600">
                What can I help with?
              </p>
            </div>
          )}

          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                }`}
              >
                {message.content || (message.role === 'assistant' && sending ? '…' : '')}
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <div className="mx-auto max-w-3xl">
          {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message ChatGPT clone…"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-40"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
