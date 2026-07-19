'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { ChatsProvider } from '@/app/chat/ChatsContext';
import Sidebar from '@/app/components/Sidebar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <ChatsProvider>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </ChatsProvider>
  );
}
