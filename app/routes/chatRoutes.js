const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../utils/authenticateUser');

router.post('/sendMessage',  authenticate, chatController.sendMessage);

router.post('/sendEmojiReaction',  authenticate, chatController.sendEmojiReaction);

router.get('/:id',  authenticate, chatController.getMessage);

router.post('/hide', authenticate, chatController.hideMessage);

router.post('/hide/ban', authenticate, chatController.hideMsgAndBanUser);

router.post("/reportMsg",chatController.reportMessage)

module.exports = router;