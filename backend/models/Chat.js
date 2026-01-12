// backend/models/Chat.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: "New Chat"
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

chatSchema.index({ userId: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
