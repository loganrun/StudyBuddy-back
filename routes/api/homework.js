import express from 'express';
const router = express.Router();
import { check, validationResult } from 'express-validator';
import { Notebook } from '../../models/User.js';
import auth from '../../middleware/auth.mjs';
import { generateHomeworkResponse, streamGeminiResponse } from '../../middleware/aiServices.mjs';

// @route    POST /api/homework/:notebookId
// @desc     Process homework with LLM and store in notebook
// @access   Private
router.post('/:notebookId', async (req, res) => {
  const { studentInfo, llmPrompt, userId, conversationId } = req.body;

  // Validate required fields
  if (!llmPrompt) {
    return res.status(400).json({ msg: 'LLM prompt is required' });
  }

  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required' });
  }

  if (!studentInfo?.subject) {
    return res.status(400).json({ msg: 'Subject is required in student info' });
  }

  try {
    const notebook = await Notebook.findById(req.params.notebookId);
    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const result = await generateHomeworkResponse(llmPrompt, userId, conversationId);
    
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
      origin: 'homework',
      metadata: metadata,
      done: true
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

// Alternative: Keep SSE endpoint separate if you want both options
router.post('/:notebookId/stream', async (req, res) => {
  const { studentInfo, llmPrompt, userId, conversationId } = req.body;

  // Validate required fields
  if (!llmPrompt) {
    return res.status(400).json({ msg: 'LLM prompt is required' });
  }

  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required' });
  }

  if (!studentInfo?.subject) {
    return res.status(400).json({ msg: 'Subject is required in student info' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  try {
    const notebook = await Notebook.findById(req.params.notebookId);
    if (!notebook) {
      res.write(`data: ${JSON.stringify({ error: 'Notebook not found' })}\n\n`);
      return res.end();
    }

    const result = await generateHomeworkResponse(llmPrompt, userId, conversationId);
    
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

    res.write(`data: ${JSON.stringify({ content: result.text, conversationId: result.conversationId  })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error(error.message);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// @route    GET /api/homework/:notebookId
// @desc     Get all homework from a notebook
// @access   Private
router.get('/:notebookId', async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.notebookId);
    
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    res.json(notebook.homework);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/homework/:notebookId/:homeworkId
// @desc     Update homework processed work in a notebook
// @access   Private
router.put('/:notebookId/:homeworkId', [
  check('processedWork', 'Processed work content is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { processedWork, subject } = req.body;
    const notebook = await Notebook.findById(req.params.notebookId);
    
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    const homework = notebook.homework.id(req.params.homeworkId);
    if (!homework) {
      return res.status(404).json({ msg: 'Homework not found' });
    }

    homework.processedWork = processedWork;
    if (subject) {
      homework.subject = subject;
    }
    homework.updatedAt = new Date();

    await notebook.save();
    
    res.json(homework);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE /api/homework/:notebookId/:homeworkId
// @desc     Delete homework from a notebook
// @access   Private
router.delete('/:notebookId/:homeworkId', auth, async (req, res) => {
  try {
    const notebook = await Notebook.findById(req.params.notebookId);
    
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    const homework = notebook.homework.id(req.params.homeworkId);
    if (!homework) {
      return res.status(404).json({ msg: 'Homework not found' });
    }

    notebook.homework.pull(req.params.homeworkId);
    await notebook.save();
    
    res.json({ msg: 'Homework deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
// import express from 'express';
// const router = express.Router();
// import { check, validationResult } from 'express-validator';
// import { Notebook } from '../../models/User.js';
// import auth from '../../middleware/auth.mjs';
// import { generateHomeworkResponse, streamGeminiResponse } from '../../middleware/aiServices.mjs';



// // @route    POST /api/homework/:notebookId
// // @desc     Process homework with LLM and store in notebook
// // @access   Private
// router.post('/:notebookId', async (req, res) => {
//   const { studentInfo, llmPrompt, userId, conversationId } = req.body;

//   // Validate required fields
//   if (!llmPrompt) {
//     return res.status(400).json({ msg: 'LLM prompt is required' });
//   }

//   if (!userId) {
//     return res.status(400).json({ msg: 'User ID is required' });
//   }

//   if (!studentInfo?.subject) {
//     return res.status(400).json({ msg: 'Subject is required in student info' });
//   }

//   res.writeHead(200, {
//     'Content-Type': 'text/event-stream',
//     'Cache-Control': 'no-cache',
//     'Connection': 'keep-alive'
//   });

//   try {
//     const notebook = await Notebook.findById(req.params.notebookId);
//     if (!notebook) {
//       res.write(`data: ${JSON.stringify({ error: 'Notebook not found' })}\n\n`);
//       return res.end();
//     }

//     const result = await generateHomeworkResponse(llmPrompt, userId, conversationId);
    
//     // Store homework after successful processing
//     const newHomework = {
//       subject: studentInfo.subject,
//       processedWork: result.text,
//       llmPrompt,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     notebook.homework.push(newHomework);
//     await notebook.save();

//     const metadata = {
//       homeworkId: notebook.homework[notebook.homework.length - 1]._id,
//       subject: newHomework.subject,
//       conversationId: result.conversationId,
//       createdAt: newHomework.createdAt
//     };

//     res.write(`data: ${JSON.stringify({ content: result.text, conversationId: result.conversationId  })}\n\n`);
//     res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
//     res.end();


//   } catch (error) {
//     console.error(error.message);
//     res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
//     res.end();
//   }
// });


// // @route    GET /api/homework/:notebookId
// // @desc     Get all homework from a notebook
// // @access   Private
// router.get('/:notebookId', async (req, res) => {
//   try {
//     const notebook = await Notebook.findById(req.params.notebookId);
    
//     if (!notebook) {
//       return res.status(404).json({ msg: 'Notebook not found' });
//     }

//     res.json(notebook.homework);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// // @route    PUT /api/homework/:notebookId/:homeworkId
// // @desc     Update homework processed work in a notebook
// // @access   Private
// router.put('/:notebookId/:homeworkId', [
//   check('processedWork', 'Processed work content is required').not().isEmpty()
// ], async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const { processedWork, subject } = req.body;
//     const notebook = await Notebook.findById(req.params.notebookId);
    
//     if (!notebook) {
//       return res.status(404).json({ msg: 'Notebook not found' });
//     }

//     const homework = notebook.homework.id(req.params.homeworkId);
//     if (!homework) {
//       return res.status(404).json({ msg: 'Homework not found' });
//     }

//     homework.processedWork = processedWork;
//     if (subject) {
//       homework.subject = subject;
//     }
//     homework.updatedAt = new Date();

//     await notebook.save();
    
//     res.json(homework);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// // @route    DELETE /api/homework/:notebookId/:homeworkId
// // @desc     Delete homework from a notebook
// // @access   Private
// router.delete('/:notebookId/:homeworkId', auth, async (req, res) => {
//   try {
//     const notebook = await Notebook.findById(req.params.notebookId);
    
//     if (!notebook) {
//       return res.status(404).json({ msg: 'Notebook not found' });
//     }

//     const homework = notebook.homework.id(req.params.homeworkId);
//     if (!homework) {
//       return res.status(404).json({ msg: 'Homework not found' });
//     }

//     notebook.homework.pull(req.params.homeworkId);
//     await notebook.save();
    
//     res.json({ msg: 'Homework deleted' });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

// export default router;