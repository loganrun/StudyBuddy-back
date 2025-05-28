import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
    userId: String,
    conversationId: String,
    messages: [messageSchema]
});

export default mongoose.model('Conversation', conversationSchema);