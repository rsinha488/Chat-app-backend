const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.post('/', eventController.createEvent);

router.get('/', eventController.getAllEvents);

router.get('/:id', eventController.getOneEventDetail);

router.put('/:id', eventController.updateEventDetail);

router.delete('/:id', eventController.softDeleteEvent);

router.post('/message',eventController.sendEventMessage);

module.exports = router;