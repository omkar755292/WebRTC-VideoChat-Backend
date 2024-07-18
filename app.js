const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const DBConnect = require('./config/connectionDB');
const authRouter = require('./routes/authRouter');
const http = require('http');
const { Server } = require('socket.io');

env.config();

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
    },
});

// Uncomment the following line when your DB connection is set up
// DBConnect();

app.use((req, res, next) => {
    console.log(`Requested API: ${req.method} ${req.originalUrl}`);
    next();
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);

const emailToSocketMap = new Map();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('create-room', (data) => {
        const { userEmail, roomId } = data;
        socket.join(roomId);
        emailToSocketMap.set(userEmail, socket.id);
        socket.emit('host-join', { roomId });
    });

    socket.on('join-room', (data) => {
        const { userEmail, roomId, myId } = data;
        socket.join(roomId);
        emailToSocketMap.set(userEmail, socket.id);
        socket.broadcast.to(roomId).emit('user-connected', { userEmail, id: myId })
        socket.emit('user-join', { roomId });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        for (const [email, info] of emailToSocketMap.entries()) {
            if (info.socketId === socket.id) {
                emailToSocketMap.delete(email);
                console.log(`Removed ${email} from socket map`);
                break;
            }
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server listening on http://${hostname}:${port}`);
});
