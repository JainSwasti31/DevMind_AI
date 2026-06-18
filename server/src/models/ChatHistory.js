import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const chatHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    repository: { type: Schema.Types.ObjectId, ref: 'Repository', required: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

// One chat thread per user per repo
chatHistorySchema.index({ user: 1, repository: 1 }, { unique: true });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;
