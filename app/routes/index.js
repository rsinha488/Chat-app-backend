// routes/index.js
const express = require("express");
const router = express.Router();
const roomRoutes = require("./roomRoutes");
const userRoutes = require("./userRoutes");
const chatRoutes = require("./chatRoutes");
const themeRoutes = require("./themeRoutes");
const quizRoutes = require("./quizRoutes");
const hashtagRoutes= require("./hashtagRoutes");
const advertisementRoutes= require("./advertisementRoute");
const eventRoutes = require("./eventRoutes");

router.use("/rooms", roomRoutes);
router.use("/users", userRoutes);
router.use("/chat", chatRoutes);
router.use("/theme", themeRoutes);
router.use("/quiz", quizRoutes);
router.use("/hashtag",hashtagRoutes);
router.use("/event",eventRoutes);
router.use("/advertisements",advertisementRoutes)

module.exports = router;
