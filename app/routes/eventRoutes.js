const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../utils/authenticateUser');

router.post('/', authenticate,eventController.createEvent);

router.get('/', authenticate,eventController.getAllEvents);
router.get('/:status', authenticate,eventController.getAllEvents);

router.get('/:id', authenticate,eventController.getOneEventDetail);

router.put('/:id', authenticate,eventController.updateEventDetail);

router.delete('/:id', authenticate,eventController.softDeleteEvent);

router.post('/message',authenticate,eventController.sendEventMessage);

module.exports = router;