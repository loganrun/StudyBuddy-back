import dotenv from 'dotenv';
import Groq from 'groq-sdk'

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

export default async function getSummarization(data){
    // const response = await fetch(
	// 	"https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
	// 	{
	// 		headers: { Authorization: `Bearer ${process.env.Hugging_Face}` },
	// 		method: "POST",
	// 		body: JSON.stringify(data),
	// 	}
	// );
	try {

        const response = await groq.chat.completions.create({
            model: "llama3-8b-8192",
    "messages": [
		{
			role: "system",
			content: "you are a helpful assistant."
		},
        {
        "role": "user",
        "content": `Please summarize the following text:\n${data}\n\nSummary:`
        }
    ],
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    })

        const result = response.choices[0].message
		console.log(result)
		return result;
        
    } catch (error) {
        console.error(error.message )
    }
	
}

