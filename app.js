const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const DBConnect = require('./config/connectionDB');
const authRouter = require('./routes/authRouter');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
env.config();

// Configuring Hostname and Port
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 5000;

// Initialize database connection
// DBConnect();

const app = express();

app.use(cors());

app.use((req, res, next) => {
    console.log(`Requested API: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware and routes
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);

// Create HTTP server instance
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server listening on http://${hostname}:${port}`);
});

// Create Socket.IO server and attach to the HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // Specify allowed origins here
        methods: ["GET", "POST"]
    }
});

const emailToSocketMap = new Map();

io.on("connection", (socket) => {
    console.log('New socket connected', socket.id);

    socket.on('create-room', ({ roomId, userName, userEmail }) => {
        emailToSocketMap.set(userEmail, socket.id);
        socket.join(roomId);
        socket.emit('room-created', { socketId: socket.id, roomId });
        console.log(`User ${userName} created room: ${roomId}`);
    });

    socket.on('join-room', ({ roomId, userName, userEmail }) => {
        emailToSocketMap.set(userEmail, socket.id);
        socket.join(roomId);
        socket.broadcast.to(roomId).emit('hello', { socketId: socket.id, userEmail, roomId });
        socket.emit('user-connected', { socketId: socket.id, roomId });
        console.log(`User ${userName} connected to room: ${roomId}`);
    });

    socket.on('call-user', (data) => {
        const { offer, fromEmail, toEmail, roomId } = data;
        const socketId = emailToSocketMap.get(toEmail);
        if (socketId) {
            setTimeout(() => {
                console.log('Action after 200ms delay');
                socket.to(socketId).emit('delayed-message', { message: 'This message is delayed by 200ms' });
                socket.to(socketId).emit('incoming-call', { offer, fromEmail });
            }, 200);
    
            
            console.log(`${fromEmail} made an offer to ${toEmail}`);

            console.log('Offer:', offer);
            console.log('Socket id:', socketId);
        } else {
            console.log(`User with email ${toEmail} not found`);
        }
    });

    socket.on('call-accepted', (data) => {
        const { answer, fromEmail } = data;
        const socketId = emailToSocketMap.get(fromEmail);
        if (socketId) {
            socket.to(socketId).emit('call-accepted', { answer });
            console.log(`Call accepted by ${fromEmail}`);
            console.log('Answer:', answer);
        } else {
            console.log(`User with email ${fromEmail} not found`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected', socket.id);
        // Remove the socket from emailToSocketMap if needed
        for (let [email, id] of emailToSocketMap.entries()) {
            if (id === socket.id) {
                emailToSocketMap.delete(email);
                break;
            }
        }
    });
});
