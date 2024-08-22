// routes/index.js
const express = require("express");
const router = express.Router();
const roomRoutes = require("./roomRoutes");
const userRoutes = require("./userRoutes");
const chatRoutes = require("./chatRoutes");
const themeRoutes = require("./themeRoutes");

router.use("/rooms", roomRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/theme", themeRoutes);

module.exports = router;
