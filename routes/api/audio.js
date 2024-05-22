import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import Lectures from '../../models/Lectures.js'; 
import { Storage } from '@google-cloud/storage';
import Summarization from '../../middleware/summarization.js';
import Transcript from '../../middleware/transcript.js'
import dateFormat, { masks } from "dateformat";



const upload = multer({ storage: multer.memoryStorage() });

const storage = new Storage({
  projectId: 'weetime',
  keyFilename: 'weetime-4763db2adbbf.json',
});

const bucketName = 'studybudy';

router.get('/upload', async (req, res) => {
  try {
    const items = await Lectures.find();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const {subject} = req.body;
  const now = Date.now();
  const date = dateFormat(now, "mediumDate", true);
  
  try {
    if (!req.file) {
    return res.status(400).send('No file uploaded.');
    }

    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${Date.now()}${fileExtension}`;
    const file = storage.bucket(bucketName).file(fileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (error) => {
      console.error('Error uploading file:', error);
      res.status(500).send('Stream not on');
    });

    stream.on('finish', async () => {
      const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      const transcript = await Transcript(fileUrl);
      const summary = await Summarization(transcript.text);
      //console.log(transcript)
      //console.log(summary)

      // Save transcript and summary to the database
      await saveToDatabase(transcript.text,summary.content,fileUrl, date, subject);

      res.send(`File uploaded successfully: ${fileUrl}`);
    });

    stream.end(req.file.buffer);
    
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Stream did not end properly');
  }
});

async function saveToDatabase(transcript,summary,fileUrl, date, subject) {
  try {
    const lecture = new Lectures({
      subject: subject,
      url: fileUrl,
      transcript,
      summary,
      date
    });
    await lecture.save();
    return lecture
    
  } catch (error) {
    console.error('Error saving to database:', error);
    //res.status(500).send('Error saving to database');
    
  }
 
}



export default router;
