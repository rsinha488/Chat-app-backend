// userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUser);

router.post('/', userController.createUser);

router.post('/login',userController.userLogin);

router.get('/:userId', userController.getUserDetail);

router.put('/:userId', userController.updateUserDetail);

router.post('/subscribe', userController.subscribeToRoom);

router.post('/subscribe/event', userController.subscribeToEvent);

router.post('/subscribe/hashtag', userController.subscribeToHashTag);



module.exports = router;
