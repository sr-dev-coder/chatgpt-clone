import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbconnect from '@/app/lib/dbconnect';
import { User } from '@/app/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbconnect();

    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { user: { id: user._id, name: user.name, email: user.email } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
