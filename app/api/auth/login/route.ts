import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbconnect from '@/app/lib/dbconnect';
import { User } from '@/app/models/User';

export async function POST(req: Request) {
  try {
    await dbconnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // 1. Find the user by email
    // Crucial: Because we set 'select: false' on password in the model, 
    // we must explicitly ask for it here using .select('+password')
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 } // 401 Unauthorized
      );
    }

    // 2. Check if the incoming password matches the hashed password in the DB
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 3. Generate a JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' } // Session valid for 7 days
    );

    // 4. Create the response and set the HTTP-only cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 200 }
    );

    // Set cookie options for security
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,                 // Prevents frontend JS from reading the cookie
      secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
      sameSite: 'strict',             // Protects against CSRF attacks
      maxAge: 60 * 60 * 24 * 7,       // 7 days in seconds
      path: '/',                      // Available across the whole app
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}