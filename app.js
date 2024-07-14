const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const DBConnect = require('./config/connectionDB');
const authRouter = require('./routes/authRouter');
const { Server } = require('socket.io')

env.config() //Configuring Hostname and Port
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 5000;
const socket_port = process.env.SOCKET_PORT || 5003;

DBConnect();
const app = express();

app.use(cors());

app.use((req, res, next) => {
    console.log(`Requested API: ${req.method} ${req.originalUrl}`);
    next();
});

// middleware and routes
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);


app.listen(port, (req, res) => {
    console.log(`server listen on port http://${hostname}:${port}`);
});

const io = new Server(socket_port,
    {
        cors: true
    }
);

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on("connection", (socket) => {
    console.log('New socket connected', socket.id);

    socket.on('join-room', ({ roomId, userName, userEmail }) => {
        emailToSocketMap.set(userEmail, socket.id);
        socketToEmailMap.set(socket.id, userEmail);
        socket.join(roomId);
        socket.emit('user-connected', { socketId: socket.id, userName, userEmail, roomId });
        socket.broadcast.to(roomId).emit('new-user-joined', { userName, userEmail, roomId });
    });

    socket.on('signal', ({ offer, userEmail }) => {
        const socketId = emailToSocketMap.get(userEmail);
        const fromEmail = socketToEmailMap.get(socket.id);

        // Debug logs
        console.log('Signal event received:');
        console.log('Offer:', offer);
        console.log('To User Email:', userEmail);
        console.log('To Socket ID:', socketId);
        console.log('From Email:', fromEmail);

        socket.to(socketId).emit('incoming-signal', { offer, fromEmail });

    });

    socket.on('signal-accepted', (data) => {
        const { answer, userEmail } = data;
        console.log(data);
    })
});
