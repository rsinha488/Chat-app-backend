const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
router.post('/', slotController.createSlot);                // Create
router.get('/', slotController.getAll);                // Read All
router.get('/:id', slotController.getSlotById);            // Read One
router.put('/:id', slotController.updateSlot);             // Update
router.delete('/:id', slotController.softDeleteSlot);      // Soft Delete
router.put('/:id/restore', slotController.restoreSlot);    // Restore soft-deleted slot