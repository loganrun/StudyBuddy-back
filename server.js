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
import Document from './models/Document.js';

dotenv.config();


// Initialize app variable with Express
const app = express();

// Socket.io setup

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST']  }});
const defaultValue = ""

io.on('connection', (socket) => {
    console.log('New user connected');

    

    socket.on("get-document", async documentId => {
        //console.log(documentId)
        const document = await findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit("load-document", document.data)
    
        socket.on("send-changes", delta => {
        socket.broadcast.to(documentId).emit("receive-changes", delta)
        })
    
        socket.on("save-document", async data => {
        await Document.findByIdAndUpdate(documentId, { data })
        })
    })

    socket.on('voice-offer', ({ roomId, offer }) => {
        console.log(`Received voice offer for room ${roomId}`);
        socket.to(roomId).emit('voice-offer', { offer, roomId });
        console.log(`Forwarded voice offer to room ${roomId}`);
    });
    
    
    socket.on('voice-answer', ({ roomId, answer }) => {
        console.log(`Received voice answer for room ${roomId}`);
        socket.to(roomId).emit('voice-answer', { answer, roomId });
        console.log(`Forwarded voice answer to room ${roomId}`);
    });
    
    socket.on('ice-candidate', ({ roomId, candidate }) => {
        console.log(`Received ICE candidate for room ${roomId}`, candidate);
        socket.to(roomId).emit('ice-candidate', { candidate, roomId });
        console.log(`Forwarded ICE candidate to room ${roomId}`);
    });

    socket.on('join-call', ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`${username} has joined room ${roomId}`);
        socket.broadcast.to(roomId).emit('user-connected', username);
        console.log("user voice connected")
    });

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
        console.log("user voice connected")
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

async function findOrCreateDocument(id) {
    if (id == null) return
    // console.log(id)
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
}

// Enviromental Variables
const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`Server started on port ${port}`));


