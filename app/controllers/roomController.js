// roomController.js
const Room = require("../models/room");

exports.createRoom = async (req, res) => {
  try {
    const { name, image, description } = req.body;
    const newRoom = new Room({ name, image, description });
    const savedRoom = await newRoom.save();
    res.status(201).json({ success: true, data: savedRoom });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRoomsList = async (req, res) => {
  try {
    const roomsList = await Room.find();
    // console.log("Rooms List =",roomsList)
    res.status(200).json({ success: true, data: roomsList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
//
exports.updateRoomRow = async (req, res) => {
  const { id } = req.params;
  const data = { ...req.body };

  // Prevent updating the _id field
  delete data._id;


  try {
    const room = await Room.findByIdAndUpdate(
      id,
      { ...data }, // Spread the data, ensuring _id is not included
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the update operation
      }
    );

    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }
    //type ROOM_ROW_UPDATED FOR Room
    // req.app.io.to(req.body.room.id).emit("message", { type: "ROOM_ROW_UPDATED", roomId: req.body.room.id, data: room });

    return res.status(200).json({ success: true, data: room });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ===========
