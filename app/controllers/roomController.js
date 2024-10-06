// roomController.js
const Room = require("../models/room");

exports.createRoom = async (req, res) => {
  try {
    const { name, image, description } = req.body;
    // Check if a room with the same name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res
        .status(400)
        .json({ success: false, error: "Room name already exists" });
    }

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

// exports.getRoomMessages = async (req, res) => {
//   const {roomId}=req.params;
//   const {status}=req.query
//   try {
//     const roomsMsgList = await Room.findById({roomId});
//     console.log("Rooms Msg List =", roomsMsgList);
//     res.status(200).json({
//       success: true,
//       data: { messages: roomsMsgList.messages, roomId: roomsMsgList._id },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
exports.getRoomMessages = async (req, res) => {
  const { roomId } = req.params; // Extract roomId from the route parameter
  const { status } = req.query; // Extract status from query parameters

  try {
    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // If status is 'true', filter messages where `report: true`
    let filteredMessages;
    if (status === "true") {
      filteredMessages = room.messages.filter(
        (message) => message.report == true
      );
    }
    // If status is 'false', simply return all messages without any filtering
    else {
      filteredMessages = room.messages;
    }
    // Sort messages by createdOn in descending order (latest first)
    filteredMessages.sort(
      (a, b) => new Date(b.createdOn) - new Date(a.createdOn)
    );

    // Respond with filtered messages and roomId
    res.status(200).json({
      success: true,
      data: { messages: filteredMessages, roomId: room._id },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
