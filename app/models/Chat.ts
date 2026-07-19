import { Schema, model, models } from 'mongoose';

const ChatSchema = new Schema(
  {
    // Links this chat to the user who created it
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    title: { 
      type: String, 
      default: 'New Chat' 
    },
  },
  { timestamps: true } // Creates 'createdAt' and 'updatedAt'
);

export const Chat = models.Chat || model('Chat', ChatSchema);