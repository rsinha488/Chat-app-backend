// server.js
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const routes = require('./app/routes');
const config = require('./config');
const socketio = require('./sockets');
const cors = require('cors')

const app = express();

const corsOptions ={
    origin:'http://localhost:3000', 
    optionSuccessStatus:200
}
app.use(cors());

// app.use(cors())

const server = http.createServer(app);

const io = socketio(server);

app.io=io
// Connect to MongoDB
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

//cors


// Middleware
app.use(express.json());
// Routes
app.use('/api', routes);

// Socket.IO
// require('./sockets')(io);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
