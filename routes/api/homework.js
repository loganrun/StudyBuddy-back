import express from 'express';
const router = express.Router();
import { check, validationResult } from 'express-validator';
import { Notebook } from '../../models/User.js';
import auth from '../../middleware/auth.mjs';
import upload from '../../middleware/multer.js';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: 'weetime',
  keyFilename: 'weetime-4763db2adbbf.json',
});

const bucketName = 'studybudy';

// Helper function to upload file to Google Cloud Storage
const uploadToGCS = async (file) => {
  const bucket = storage.bucket(bucketName);
  const fileName = `homework/${Date.now()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      reject(error);
    });

    stream.on('finish', () => {
      resolve(`gs://${bucketName}/${fileName}`);
    });

    stream.end(file.buffer);
  });
};

// @route    POST /api/homework/:notebookId
// @desc     Process homework with LLM and store in notebook
// @access   Private
router.post('/:notebookId', upload.single('file'), async (req, res) => {
  try {
    const { extractedText, studentInfo, llmPrompt, fileName, fileType } = req.body;
    
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ msg: 'File is required' });
    }
    
    if (!llmPrompt) {
      return res.status(400).json({ msg: 'LLM prompt is required' });
    }

    // Parse studentInfo if it's a string
    let parsedStudentInfo;
    try {
      parsedStudentInfo = typeof studentInfo === 'string' ? JSON.parse(studentInfo) : studentInfo;
    } catch (error) {
      return res.status(400).json({ msg: 'Invalid student info format' });
    }

    if (!parsedStudentInfo?.subject) {
      return res.status(400).json({ msg: 'Subject is required in student info' });
    }

    const notebook = await Notebook.findById(req.params.notebookId);
    if (!notebook) {
      return res.status(404).json({ msg: 'Notebook not found' });
    }

    // Upload file to Google Cloud Storage
    const originalFileRef = await uploadToGCS(req.file);

    // Set response headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
      // Call Cerebras API (placeholder implementation)
      const cerebrasResponse = await callCerebrasAPI(llmPrompt, extractedText);
      
      let processedWork = '';
      
      // Stream Cerebras response chunks
      for await (const chunk of cerebrasResponse) {
        processedWork += chunk;
        res.write(chunk);
      }

      // Store homework after successful processing
      const newHomework = {
        subject: parsedStudentInfo.subject,
        originalFileRef,
        processedWork,
        fileName: fileName || req.file.originalname,
        fileType: fileType || req.file.mimetype,
        llmPrompt,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      notebook.homework.push(newHomework);
      await notebook.save();

      // Send metadata at the end
      const metadata = {
        homeworkId: notebook.homework[notebook.homework.length - 1]._id,
        fileName: newHomework.fileName,
        fileType: newHomework.fileType,
        subject: newHomework.subject,
        createdAt: newHomework.createdAt
      };

      res.write(`\n\n__METADATA__${JSON.stringify(metadata)}`);
      res.end();

    } catch (cerebrasError) {
      console.error('Cerebras API error:', cerebrasError.message);
      res.status(500).json({ msg: 'Failed to process homework with LLM', error: cerebrasError.message });
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Placeholder function for Cerebras API call
async function* callCerebrasAPI(prompt, extractedText) {
  // TODO: Replace with actual Cerebras API integration
  // This should make an HTTP request to Cerebras and yield chunks as they arrive
  
  const mockResponse = `Processing your homework...

Based on the content: "${extractedText.substring(0, 100)}..."

Here's the analysis: This appears to be a homework assignment that requires careful attention to detail.`;
  
  // Simulate streaming chunks
  const chunks = mockResponse.split(' ');
  for (const chunk of chunks) {
    yield chunk + ' ';
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

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