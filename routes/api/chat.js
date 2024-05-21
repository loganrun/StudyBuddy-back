import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
//import OpenAI from 'openai';
import Groq from 'groq-sdk'

dotenv.config();

// const openai = new OpenAI({
//     apiKey: process.env.OPEN_API_KEY
// });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})



router.post('/chat', async  function(req, res) {
    const {prompt} = req.body.data
    console.log(prompt)

    try {

        const response = await groq.chat.completions.create({
            model: "llama3-8b-8192",
    "messages": [
        {
        "role": "user",
        "content": prompt
        }
    ],
        temperature: 1,
        max_tokens: 256,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    })

        res.status(200).send(response.choices[0].message)
        
    } catch (error) {
        res.status(500).send(error.message )
    }

    
})

export default router;