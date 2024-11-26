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
//const rooms = new Map();

const users = {}
const socketToRoom = {}

io.on('connection', (socket) => {
    //console.log('New user connected');

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

    socket.on('signal', ({ to, from, signal }) => {
        io.to(to).emit('signal', { from, signal });
    });

    socket.on("join room", roomID => {
        //console.log("user connected")
        if (users[roomID]) {
            
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
            //console.log(users)
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all users", usersInThisRoom);
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

    // socket.on('join-room', (roomId, userId) => {
    //     socket.join(roomId);
    //     console.log(`${userId} joined room ${roomId}`)
    //     if (!rooms.has(roomId)) {
    //     rooms.set(roomId, new Set());
    //     }
    //     rooms.get(roomId).add(userId);
    
    //     // Notify other users in the room
    //     socket.to(roomId).emit('user-connected', userId);
    
    //     // Send list of existing users to the new user
    //     const existingUsers = Array.from(rooms.get(roomId)).filter(id => id !== userId);
    //     socket.emit('existing-users', existingUsers);
    
    //     socket.on('disconnect', () => {
    //     rooms.get(roomId).delete(userId);
    //     socket.to(roomId).emit('user-disconnected', userId);
    //     });
    // });
    
    
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

const port = process.env.PORT || 4000;

server.listen(port, () => console.log(`Server started on port ${port}`));


