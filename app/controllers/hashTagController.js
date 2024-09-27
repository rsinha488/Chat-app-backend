// roomController.js
const { default: mongoose } = require("mongoose");
const { getSocket } = require("../../sockets");
const HashTag = require("../models/hashTag");
const Room = require("../models/room");
const User = require("../models/user");

exports.getHashTag = async (req, res) => {
  try {
    const { roomId,hashtagId } = req.params;
    const quizzes = await HashTag.findOne({
      roomId: roomId,
      _id:hashtagId
    });
    // console.log({ quizzes });
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHashTagList = async (req, res) => {
    try {
        const {roomId}=req.params;
      const hashtagList = await HashTag.find({roomId});
      res.status(200).json({ success: true, data: hashtagList });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };


  exports.sendHashtagMessage = async (req, res) => {
    try {
      const socket = getSocket();
      const { userId, roomId, hashtagId, content } = req.body;
  
      // Find the user and room
      const user = await User.findById({ _id: userId });
      const room = await Room.findById({ _id: roomId });
      if (!user || !room) {
        return res
          .status(404)
          .json({ success: false, error: "User or room not found" });
      }
      let msg_id = new mongoose.Types.ObjectId();
      let message = {
        _id: msg_id,
        sender: user,
        room: room,
        hashtagId: hashtagId,
        content: content,
        emojiReaction: [],
      };
  
        
  
      // Step 2: Push the message ID to the Room's messages array
      let updatedHashtag = await HashTag.findByIdAndUpdate(hashtagId, {
        $push: { messages: message },
      });
  
    
      req.app.io.to(hashtagId).emit("hashtagMessage", {
        type: "UPDATED_HASHTAG",
        hashtagId: hashtagId,
        roomId:roomId,
        data: updatedHashtag,
      });
  
      res.status(200).json({
        success: true,
        message: "Message sent successfully",
        data: updatedHashtag,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };