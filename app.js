const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const DBConnect = require('./config/connectionDB');
const authRouter = require('./routes/authRouter');


env.config() //Configuring Hostname and Port
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 5000;

DBConnect();
const app = express();

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