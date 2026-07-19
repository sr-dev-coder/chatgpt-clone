import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbconnect from '@/app/lib/dbconnect';
import { Chat } from '@/app/models/Chat';
import { Message } from '@/app/models/Message';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    await dbconnect();

    // 1. Verify the user
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const { chatId } = await params;

    // 2. Security Check: Ensure the requested chat actually belongs to this user
    const chat = await Chat.findOne({ _id: chatId, userId: decoded.userId });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    // 3. Fetch the messages in chronological order (oldest first)
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 }) 
      .select('role content createdAt'); // Don't send unnecessary DB fields to the client

    return NextResponse.json({ messages }, { status: 200 });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}