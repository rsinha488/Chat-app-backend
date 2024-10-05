const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/sendMessage', chatController.sendMessage);

router.post('/sendEmojiReaction', chatController.sendEmojiReaction);

router.get('/:id', chatController.getMessage);

router.post('/hide',chatController.hideMessage);

router.post('/hide/ban',chatController.hideMsgAndBanUser);

module.exports = router;