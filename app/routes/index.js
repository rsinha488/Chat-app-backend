// routes/index.js
const express = require('express');
const router = express.Router();
const roomRoutes = require('./roomRoutes');
const userRoutes = require('./userRoutes');

router.use('/rooms', roomRoutes);
router.use('/users', userRoutes);

module.exports = router;
