import express from 'express';
import connectDB from './config/db.js'; 
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'
import { Server } from 'socket.io';
import usersRouter from './routes/api/users.js'; 
import authRouter from './routes/api/auth.js'; 
import audioRouter from './routes/api/audio.js'; 
import chatRouter from './routes/api/chat.js'; 
import lectureRouter from './routes/api/lecture.js'; 
import tutorRouter from './routes/api/tutor.js'
import tutorAuthRouter from './routes/api/tutorAuth.js'

dotenv.config();


// Initialize our app variable with Express
const app = express();

// Socket.io setup

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST']  }});

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join-room', ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`${username} has joined room ${roomId}`);
        socket.broadcast.to(roomId).emit('user-connected', username);
    });

    socket.on('voice-offer', (roomId, offer) => {
        socket.to(roomId).emit('voice-offer', offer);
    });
    
    socket.on('voice-answer', (roomId, answer) => {
        socket.to(roomId).emit('voice-answer', answer);
    });
    
    socket.on('ice-candidate', (roomId, candidate) => {
        socket.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('join-call', ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`${username} has joined room ${roomId}`);
        socket.broadcast.to(roomId).emit('user-connected', username);
    });

    socket.on('text-change', (delta) =>{
        socket.broadcast.emit('text-change', delta);
    })

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });
    
    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });
    
    socket.on('ice-candidate', (candidate) => {
        socket.broadcast.emit('ice-candidate', candidate);
    });

    socket.on('error', (err) => {console.log(err);});

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


connectDB();

// Initialize middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Single endpoint just to test API. Send data to browser
app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/audio', audioRouter);
app.use('/api/chat', chatRouter);
app.use('/api/lecture', lectureRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/tutorAuth', tutorAuthRouter);

// Enviromental Variables
const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`Server started on port ${port}`));


