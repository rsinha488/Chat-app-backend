// roomController.js
const Room = require('../models/room');

exports.createRoom = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newRoom = new Room({ name, description });
    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
