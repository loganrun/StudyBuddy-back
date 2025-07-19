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
import lessonRouter from './routes/api/lesson.js';
import voiceAgent from './routes/api/voiceAgent.js';
import homeworkRouter from './routes/api/homework.js';
import Document from './models/Document.js';

dotenv.config();



const app = express();

// Socket.io setup

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST']  }});
const defaultValue = ""
const rooms = new Map();

const users = {}
const socketToRoom = {}

io.on('connection', (socket) => {
    console.log('New user connected');
    socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        const clients = io.sockets.adapter.rooms.get(roomId);
        const userCount = clients ? clients.size : 0;
        io.to(roomId).emit('userCount', userCount);
    });

     socket.on('newItem', (item) => {  
        socket.to(item.roomId).emit('newItem', item);
    });
    
    socket.on('updateItem', (item) => {
        socket.to(item.roomId).emit('updateItem', item);
    });
    
    socket.on('undo', (data) => {
        socket.to(data.roomId).emit('undo', data.itemId);
    });

    socket.on('clear', ({ roomId }) => {
        socket.to(roomId).emit('clear');
    });
    

    socket.on('draw', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('draw', data);
    });

    socket.on('shape', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('shape', data);
    });

    socket.on('text', (data) => {
        const { roomId } = data;
        // Broadcast the text event to all other clients in the room
        socket.to(roomId).emit('text', data);
    });

    

    socket.on("get-document", async documentId => {
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

    socket.on('signal', ({ to, from, signal }) => {
        io.to(to).emit('signal', { from, signal });
    });

    

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
    })

});


connectDB();


app.use(express.json({ extended: false }));
app.use(cors());

app.get('/', (req, res) => res.send('API Running'));


app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/audio', audioRouter);
app.use('/api/chat', chatRouter);
app.use('/api/lecture', lectureRouter);
app.use('/api/tutor', tutorRouter);
app.use('/api/tutorAuth', tutorAuthRouter);
app.use('/api/lesson', lessonRouter);
app.use('/api/voiceAgent', voiceAgent);
app.use('/api/homework', homeworkRouter);

async function findOrCreateDocument(id) {
    if (id == null) return
    // console.log(id)
    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: defaultValue })
}

const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`Server started on port ${port}`));


