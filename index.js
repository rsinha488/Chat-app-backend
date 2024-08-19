// server.js
const express = require("express");
const http = require("https");
const mongoose = require("mongoose");
const routes = require("./app/routes");
const config = require("./config");
const { socketIO } = require("./sockets");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  optionSuccessStatus: 200,
};
app.use(cors({
  origin: 'https://shiva2641998.github.io',
  methods: ['GET', 'POST'],
  // credentials: true,
}));

// app.use(cors())

const server = http.createServer(app);
// const io = new socketIo(server);  
const io = socketIO(server);
// app.use(require('./sockets/middlewares').global.socketIo(io));
app.io = io;

// Connect to MongoDB
mongoose
  .connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

//cors

// Middleware
app.use(express.json());
// Routes
app.use("/api", routes);

// Socket.IO
// require('./sockets')(io);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
