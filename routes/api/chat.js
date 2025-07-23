import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
import { generateChatResponse } from '../../middleware/aiServices.mjs';

dotenv.config();

router.get('/', async function (req, res) {
    const prompt = req.query.prompt;
    const type = req.query.type || 'default';
    const userId = req.query.userId;
    const conversationId = req.query.conversationId;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    try {
        const result = await generateChatResponse(prompt, type, userId, conversationId);
        
        res.write(`data: ${JSON.stringify({ content: result.text, conversationId: result.conversationId })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

export default router;