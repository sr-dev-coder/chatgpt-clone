import { NextRequest, NextResponse } from 'next/server';
import { streamText, type ModelMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import dbConnect from '@/app/lib/dbconnect';
import { Chat } from '@/app/models/Chat';
import { Message } from '@/app/models/Message';

export async function POST(req: NextRequest) {
  try {
    const { messageText, chatId, userId } = await req.json();

    if (!messageText || !userId) {
      return NextResponse.json(
        { error: 'messageText and userId are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Create a new chat if this is the first message in the thread
    let activeChatId = chatId;
    if (!activeChatId) {
      const chat = await Chat.create({
        userId,
        title: messageText.slice(0, 30),
      });
      activeChatId = chat._id.toString();
    }

    // 2. Save the incoming user message
    await Message.create({
      chatId: activeChatId,
      role: 'user',
      content: messageText,
    });

    // 3. Fetch chat history in chronological order for the AI SDK
    const previousMessages = await Message.find({ chatId: activeChatId })
      .sort({ createdAt: 1 })
      .select('role content');

    const messages: ModelMessage[] = previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 4. Stream the assistant's reply
    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      messages,
      onFinish: async ({ text }) => {
        // 5. Persist the assistant's final response once streaming ends
        await Message.create({
          chatId: activeChatId,
          role: 'assistant',
          content: text,
        });
      },
    });

    // 6. Stream the response back, exposing the chat id for new chats
    return result.toTextStreamResponse({
      headers: {
        'x-chat-id': activeChatId,
      },
    });
  } catch (error) {
    console.error('Error in chat stream:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
