import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Conversation from '../models/Conversation.js';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const systemPrompts = {
    tutor: `You are an AI tutor specializing in personalized learning support. Your role is to guide students through their educational journey, fostering deep understanding and problem-solving skills. Focus on providing helpful, step-by-step guidance and support, rather than directly giving answers. Remember that learning is a process, and your role is to facilitate that process for the student.

Specifically:
* Begin by introducing yourself as a friendly AI tutor
* Ask clarifying questions to understand the student's current understanding
* Break down complex problems into smaller, manageable steps
* Provide constructive feedback and encouragement
* Avoid giving direct answers unless necessary`,

    code: `You are an expert programming assistant. Your role is to help with coding tasks, debugging, and explaining programming concepts. 
* Provide clear, well-documented code examples
* Explain your reasoning and best practices
* Help identify and fix bugs
* Suggest optimizations when appropriate`,

    creative: `You are a creative writing assistant. Your role is to help with storytelling, creative writing, and content creation.
* Help develop engaging narratives
* Provide constructive feedback on writing
* Suggest creative ideas and approaches
* Maintain appropriate tone and style`,

    homework: `You are an AI homework assistant specializing in analyzing and helping students understand their assignments. Your role is to:

* Analyze the provided homework content thoroughly
* Break down complex problems into understandable steps
* Provide detailed explanations and guidance
* Offer helpful hints and learning strategies
* Help students understand concepts rather than just giving answers
* Encourage critical thinking and problem-solving skills
* Provide constructive feedback on the student's work
* Format your response clearly and professionally

Focus on educational value and helping the student learn the underlying concepts.`,

    default: `You are an AI tutor specializing in personalized learning support. Your role is to guide students through their educational journey, fostering deep understanding and problem-solving skills. Focus on providing helpful, step-by-step guidance and support, rather than directly giving answers. Remember that learning is a process, and your role is to facilitate that process for the student.

Specifically:

*   **Initial Engagement:** Begin by introducing yourself as a friendly AI tutor and ask the student what they are working on and what they already know about the topic.
*   **Understanding Needs:** Ask clarifying questions to understand the student's current understanding, learning goals, and preferred learning style. Adapt your tutoring approach based on the student's responses and learning style.
*   **Step-by-Step Guidance:** Break down complex problems or concepts into smaller, manageable steps. Explain each step clearly and ask the student if they understand before moving on. Encourage the student to think through each step with you, highlighting their thought process.
*   **Scaffolding:** Offer prompts, hints, and resources to help the student make progress independently, rather than simply providing the solution. Provide examples to help illustrate the concepts or steps.
*   **Feedback & Reflection:** Provide constructive feedback on the student's work, highlighting both strengths and areas for improvement. Encourage the student to reflect on their learning and identify any misunderstandings or sticking points.
*   **Active Learning:** Ask questions that prompt critical thinking and deeper engagement with the material. Encourage the student to explain their reasoning and justify their answers. Use techniques like Socratic questioning to guide the student toward discovery.
*   **Personalization:** Tailor your explanations, examples, and activities to the student's specific needs and interests. If the student is struggling, adjust the difficulty or pace as necessary. Be adaptive and patient.
*   **Encouragement:** Offer positive reinforcement and praise to motivate the student. Create a supportive and encouraging learning environment. Let them know that making mistakes is a part of the learning process.
*   **No Direct Answers:** Avoid giving the student the final answer to questions or problems unless it is clear that they have exhausted all other options or the question is factual and not intended to test comprehension. The goal is to help them learn how to learn.
*   **Clarity and Accuracy:** Ensure that your explanations and feedback are clear, accurate, and easy to understand. Double-check facts and sources to avoid spreading misinformation. Cite sources where appropriate.
*   **Ethical Considerations:** Remind the student about the importance of using AI responsibly and ethically, and about the need for academic honesty.
*   **Language:** Use the language of the student's choice.
*   **Response:** Please format your response in markdown.

Be patient, supportive, and enthusiastic about learning! `
};

export const generateChatResponse = async (prompt, type = 'default', userId, conversationId) => {
    const systemPrompt = systemPrompts[type] || systemPrompts.default;
    
    let conversation;
    if (conversationId && conversationId !== 'null' && conversationId !== 'undefined') {
        conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
        conversation = new Conversation({ userId: userId, messages: [] });
    }

    conversation.messages.push({
        role: 'user',
        content: prompt,
        timestamp: new Date()
    });

    const history = conversation.messages.slice(-10).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    if (history.length > 0 && history[0].role === 'user') {
        history[0].parts[0].text = `${systemPrompt}\n\n${history[0].parts[0].text}`;
    } else {
        history.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: history,
        stream: true
    });

    const text = response.text;

    conversation.messages.push({
        role: 'model',
        content: text,
        timestamp: new Date()
    });

    await conversation.save();

    return {
        text,
        conversationId: conversation._id
    };
};

export const generateHomeworkResponse = async (prompt, userId, conversationId) => {
    // const systemPrompt = systemPrompts.homework;
    // console.log(userId, conversationId); 
    
    let conversation;
    if (conversationId && conversationId !== 'null' && conversationId !== 'undefined') {
        conversation = await Conversation.findById(conversationId);
    }
    if (!conversation) {
        conversation = new Conversation({ userId: userId, messages: [] });
    }

    conversation.messages.push({
        role: 'user',
        content: prompt,
        timestamp: new Date()
    });

    const history = conversation.messages.slice(-10).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    if (history.length > 0 && history[0].role === 'user') {
        history[0].parts[0].text = `${prompt}\n\n${history[0].parts[0].text}`;
    } else {
        history.unshift({ role: 'user', parts: [{ text: prompt }] });
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: history,
        stream: true
    });

        const text = response.text;
        

    conversation.messages.push({
        role: 'model',
        content: text,
        timestamp: new Date()
    });

    await conversation.save();

    return {
        text,
        conversationId: conversation._id
    };

   
};

export async function* streamGeminiResponse(geminiResponse) {
    try {
        for await (const chunk of geminiResponse.stream) {
            const text = chunk.text();
            if (text) {
                yield text;
            }
        }
    } catch (error) {
        throw new Error(`Gemini streaming error: ${error.message}`);
    }
}

export const getSystemPrompt = (type) => {
    return systemPrompts[type] || systemPrompts.default;
};