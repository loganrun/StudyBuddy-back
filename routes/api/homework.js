import express from 'express';
const router = express.Router();
import { Notebook } from '../../models/User.js';
import { generateHomeworkResponse,} from '../../middleware/aiServices.mjs';

router.get('/', async function (req, res) {
    const prompt = req.query.prompt;
    const userId = req.query.userId;
    const conversationId = req.query.conversationId;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    try {
        const result = await generateHomeworkResponse(prompt, userId, conversationId);

        res.write(`data: ${JSON.stringify({ content: result.text, conversationId: result.conversationId, origin: 'homework' })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error.message);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

router.post('/:notebookId', async (req, res) => {
  const { studentInfo, llmPrompt, userId, conversationId } = req.body;
// console.log(req.body);
// console.log(req.params.notebookId);  
  
  try {
    const notebook = await Notebook.findById(req.params.notebookId);
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const result = await generateHomeworkResponse(llmPrompt, userId, conversationId);
    // console.log(result);
    // Store homework after successful processing
    const newHomework = {
      subject: studentInfo.subject,
      processedWork: result.text,
      llmPrompt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    notebook.homework.push(newHomework);
    await notebook.save();

    const metadata = {
      homeworkId: notebook.homework[notebook.homework.length - 1]._id,
      subject: newHomework.subject,
      conversationId: result.conversationId,
      createdAt: newHomework.createdAt
    };

    // Return JSON response
    res.json({
      
      content: result.text,
      conversationId: result.conversationId,
      metadata: metadata,
      done: true
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});






export default router;
