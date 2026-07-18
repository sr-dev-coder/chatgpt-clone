import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Email is required'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Security: Never return the password by default in queries
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// Prevent Next.js HMR (Hot Module Replacement) from redefining the model and throwing errors
export const User = models.User || model('User', UserSchema);