import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbconnect from '@/app/lib/dbconnect';
import { Chat } from '@/app/models/Chat';

export async function GET(req: NextRequest) {
  try {
    await dbconnect();

    // 1. Extract and verify the JWT from the cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    // 2. Fetch chats belonging to this user, newest first
    const chats = await Chat.find({ userId: decoded.userId })
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt'); // Only fetch the fields we need for the sidebar

    return NextResponse.json({ chats }, { status: 200 });

  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}