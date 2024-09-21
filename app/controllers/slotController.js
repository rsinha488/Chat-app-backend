const Slot = require("../models/slot");

exports.createSlot = async (req, res) => {
    try {
      const slot = new Slot(req.body);
      const savedSlot = await slot.save();
      res.status(201).json({ success: true, data: savedSlot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  exports.getAllSlots = async (req, res) => {
    try {
      const slots = await Slot.find({ isDeleted: false });
      res.status(200).json({ success: true, data: slots });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  exports.getSlotById = async (req, res) => {
    try {
      const { id } = req.params;
      const slot = await Slot.findById(id);
  
      if (!slot || slot.isDeleted) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }
  
      res.status(200).json({ success: true, data: slot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  exports.updateSlot = async (req, res) => {
    try {
      const { id } = req.params;
  
      const updatedSlot = await Slot.findByIdAndUpdate(id, req.body, {
        new: true, // Return the updated document
        runValidators: true // Ensure validation
      });
  
      if (!updatedSlot || updatedSlot.isDeleted) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }
  
      res.status(200).json({ success: true, data: updatedSlot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  
  exports.softDeleteSlot = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deletedSlot = await Slot.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  
      if (!deletedSlot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }
  
      res.status(200).json({ success: true, message: 'Slot soft deleted', data: deletedSlot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  exports.restoreSlot = async (req, res) => {
    try {
      const { id } = req.params;
  
      const restoredSlot = await Slot.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
  
      if (!restoredSlot) {
        return res.status(404).json({ success: false, message: 'Slot not found' });
      }
  
      res.status(200).json({ success: true, message: 'Slot restored', data: restoredSlot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
  
  