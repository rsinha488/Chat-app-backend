// userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUser);

router.get('/:username', userController.getSingleUser);

router.post('/subscribe', userController.subscribeToRoom);

router.post('/create', userController.createUser);

module.exports = router;
