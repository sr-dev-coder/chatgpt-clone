import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/app/lib/dbconnect';
import { User } from '@/app/models/User';

export async function POST(req: Request) {
  try {
    // 1. Connect to the database
    await dbConnect();

    // 2. Extract data from the frontend request
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide all required fields' }, 
        { status: 400 }
      );
    }

    // 3. Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' }, 
        { status: 409 } // 409 Conflict
      );
    }

    // 4. Hash the password before saving
    // 10 is the "salt rounds" — a good balance between security and performance
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create the new user in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // 6. Return a success response (omitting the password)
    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: { id: newUser._id, name: newUser.name, email: newUser.email }
      }, 
      { status: 201 } // 201 Created
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}