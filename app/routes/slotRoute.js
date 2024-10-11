const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { authenticate } = require('../utils/authenticateUser');

router.post('/', authenticate,  slotController.createSlot);                // Create
router.get('/', authenticate,  slotController.getAllSlots);                // Read All
router.get('/:id', authenticate,  slotController.getSlotById);            // Read One
router.put('/:id', authenticate,  slotController.updateSlot);             // Update
router.delete('/:id', authenticate,  slotController.softDeleteSlot);      // Soft Delete
router.put('/:id/restore', authenticate,  slotController.restoreSlot);    // Restore soft-deleted slot

module.exports = router;