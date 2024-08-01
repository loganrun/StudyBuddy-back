import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
import OpenAI from 'openai';
//import Groq from 'groq-sdk'

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPEN_API_KEY,
    
});

router.get('/', async function(req, res) {
    const prompt = req.query.prompt;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    console.log("Open AI Stream");

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 1,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: true
        });

        for await (const chunk of response) {
            const content = chunk.choices[0].delta.content;
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch(error) {
        console.error(error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

export default router;