import express from 'express';
import connectDB from './config/db.js'; // Assuming db.js is an ESM module
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize our app variable with Express
const app = express();

const corsOptions = {
    origin: 'https://studybuddy0602.netlify.app/', // Replace with your Netlify app's URL
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };

// Connect Database
connectDB();

// Initialize middleware
app.use(express.json({ extended: false }));
app.use(cors(corsOptions));

// Single endpoint just to test API. Send data to browser
app.get('/', (req, res) => res.send('API Running'));

// Define Routes
import usersRouter from './routes/api/users.js'; 
import authRouter from './routes/api/auth.js'; 
import audioRouter from './routes/api/audio.js'; 
import chatRouter from './routes/api/chat.js'; 
import lectureRouter from './routes/api/lecture.js'; 

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/audio', audioRouter);
app.use('/api/chat', chatRouter);
app.use('/api/lecture', lectureRouter);

// Enviromental Variables
const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`Server started on port ${port}`));


