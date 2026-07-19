import { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema(
  {
    // Links this message to its parent chat thread
    chatId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Chat', 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['user', 'assistant', 'system'], // Restricts to valid AI roles
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: true }
);

export const Message = models.Message || model('Message', MessageSchema);