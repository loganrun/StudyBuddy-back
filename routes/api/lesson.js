import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';

//import OpenAI from 'openai';
import Groq from 'groq-sdk'


dotenv.config();

// const openai = new OpenAI({
//     apiKey: process.env.OPEN_API_KEY,
    
// });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    

router.get('/', async function(req, res) {
    const prompt = req.query.prompt;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    //console.log("Open AI Stream");

    try {
        const response = await  groq.chat.completions.create({
            model:   "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `
                    You are a helpful educational assistant specialized in creating K–5 extracurricular lesson plans. 
                            Your responses should be:
                            1. Casual and teacher-friendly in tone.
                            2. Fully fleshed-out: include objectives, materials, activities, and references or worksheets where appropriate.
                            3. Well-organized in plain text with clear headings and bullet points.
                            4. Student-centered, featuring creative and fun engagement strategies.
                            5. Aligned to relevant standards if appropriate, but not required.
                            6. You only include an assessment or quiz if the user specifically requests it.
                            7. You may suggest additional ideas or creative approaches, as long as they follow community guidelines.
                            8. Do not include time or duration unless specifically requested.
                            9. Do not provide special accommodations unless the user requests them.
                            
                                        `,
                },
                { role: "user", content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
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


