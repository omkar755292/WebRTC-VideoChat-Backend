const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const DBConnect = require('./config/connectionDB');
const authRouter = require('./routes/authRouter');
const {Server} = require('socket.io')



env.config() //Configuring Hostname and Port
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 5000;
const socket_port = process.env.SOCKET_PORT || 5003;

DBConnect();
const app = express();
const io = new Server(socket_port,
    {
        cors: true
    }
);

app.use((req, res, next) => {
    console.log(`Requested API: ${req.method} ${req.originalUrl}`);
    next();
});

// middleware and routes
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRouter);
app.use(errorHandler);


app.listen(port, (req, res) => {
    console.log(`server listen on port http://${hostname}:${port}`);
});

io.on("connection",(socket)=>{
    console.log(`Socket Connected `, socket.id);
    socket.on('room:join', data=>{
        console.log(data);
    })
})