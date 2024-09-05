// roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate } = require('../utils/authenticateUser');

router.post('/rooms', roomController.createRoom);
router.get('/',authenticate,roomController.getRoomsList);

module.exports = router;
