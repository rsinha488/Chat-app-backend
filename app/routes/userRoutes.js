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

router.post('/sendFriendRequest',userController.sendFriendRequest);

router.post ('/acceptFriendRequest',userController.acceptFriendRequest);

router.post('/blockUser',userController.blockUser);

router.get('/friends/:userId',userController.getFriendList);

router.get('/requests/:userId',userController.getFriendRequests);

router.post('/rejectFriendRequest',userController.rejectFriendRequest);

router.post('/unblockUser',userController.unblockUser)



module.exports = router;
