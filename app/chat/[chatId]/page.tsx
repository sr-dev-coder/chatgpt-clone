'use client';

import { useParams } from 'next/navigation';
import ChatView from '@/app/components/ChatView';

export default function ExistingChatPage() {
  const params = useParams<{ chatId: string }>();
  return <ChatView chatId={params.chatId} />;
}
