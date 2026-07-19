'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useChats } from '@/app/chat/ChatsContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { chats, loading } = useChats();
  const params = useParams<{ chatId?: string }>();
  const activeChatId = params?.chatId;

  return (
    <aside className="w-64 shrink-0 h-full bg-zinc-900 text-zinc-100 flex flex-col">
      <div className="p-3">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          + New chat
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {loading && (
          <p className="px-2 py-2 text-sm text-zinc-500">Loading chats…</p>
        )}
        {!loading && chats.length === 0 && (
          <p className="px-2 py-2 text-sm text-zinc-500">No chats yet</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {chats.map((chat) => (
            <li key={chat._id}>
              <Link
                href={`/chat/${chat._id}`}
                className={`block truncate rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeChatId === chat._id
                    ? 'bg-zinc-800 text-zinc-50'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {chat.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}
