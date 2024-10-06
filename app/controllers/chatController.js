// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const { default: mongoose } = require("mongoose");
const { getSocket } = require("../../sockets");
const HashTag = require("../models/hashTag");

exports.sendMessage = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId, content } = req.body;

    // Find the user and room
    const user = await User.findById({ _id: userId });
    const room = await Room.findById({ _id: roomId });
    if (!user || !room) {
      return res
        .status(404)
        .json({ success: false, error: "User or room not found" });
    }
    let msg_id = new mongoose.Types.ObjectId();
    const createdOn = new Date(); // Get the current date and time
    let message = {
      _id: msg_id,
      sender: user,
      hashtagStatus: false,
      room: roomId,
      content: content,
      emojiReaction: [],
      createdOn: createdOn, // Add createdOn attribute
    };

    // const text = "#123abc! more text #456def, and #789ghi here";
    // const text = "#123abc! more text";
    const match = content.match(/#([a-zA-Z0-9]+)/);
    // let hashtagId = new mongoose.Types.ObjectId();
    if (match?.[1]?.length > 2) {
      //create hashTag
      const createHashTag = {
        hashtagTitle: "#" + match[1],
        roomId,
        hashtagStatus: true,
        sender: user,
        content: content,
        msgId: msg_id,
      };
      // Check if a Hastag with the same name already exists
      const existingHashtag = await HashTag.findOne({
        roomId,
        hashtagTitle: createHashTag?.hashtagTitle,
      });
      if (!existingHashtag) {
        console.log("existingHashtag ", existingHashtag);
        let newHashtag = new HashTag(createHashTag);
        const hashTagData = await newHashtag.save();
  
        console.log("Create hash ", hashTagData);
        message = {
          ...message,
          hashtagStatus: true,
          hashtagTitle: "#" + match[1],
          hashtagId: hashTagData._id,
        };
        
      }
      // console.log(match[1]); //Output: 123abc
    }
    console.log(message);


    // Step 2: Push the message ID to the Room's messages array
    let updatedRoom = await Room.findByIdAndUpdate(roomId, {
      $push: { messages: message },
    });

    req.app.io.to(roomId).emit("message", message);

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      status: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sendEmojiReaction = async (req, res) => {
  try {
    const socket = getSocket();
    const { sender, roomId, msgId, emoji } = req.body;

    // Find the user and room
    const room = await Room.findById({ _id: roomId });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, error: "User or room not found" });
    }

    const msgfound = room.messages.map((message) => {
      if (message._id.toString() === msgId) {
        let foundExit = message?.emojiReaction?.filter(
          (e) => e.sender._id.toString() === sender._id.toString()
        );
        if (foundExit?.length > 0) {
          console.log("foundExit", foundExit);
          return {
            ...message,
            emojiReaction: message.emojiReaction.map((e) => {
              if (e.sender._id.toString() === sender._id.toString()) {
                return { ...foundExit[0], emoji };
              } else {
                return e;
              }
            }),
          };
        } else {
          return {
            ...message,
            emojiReaction: message?.emojiReaction
              ? [...message?.emojiReaction, { sender, emoji }]
              : [{ sender, emoji }],
          };
        }
      } else {
        return message;
      }
    });

    // Step 2: Push the message ID to the Room's messages array
    await Room.findByIdAndUpdate(roomId, {
      $set: { messages: msgfound },
    });

    const newMsg = msgfound.filter((e) => e._id.toString() === msgId);
    //type EMOJI FOR EMOJI
    req.app.io
      .to(roomId)
      .emit("message", { type: "EMOJI", msgId, data: newMsg[0] });

    res.status(200).json({
      success: true,
      message: "Emoji sent successfully",
      status: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query; // Default to page 1, limit 20

    // Find the room by ID
    const room = await Room.findById(id).populate({
      path: "messages",
      options: {
        sort: { _id: -1 }, // Sort by newest messages first
        skip: (page - 1) * limit,
        limit: parseInt(limit, 10),
      },
    });

    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    // Get total number of messages for pagination info
    const totalMessages = await Room.aggregate([
      { $match: { _id: room._id } },
      { $project: { messageCount: { $size: "$messages" } } },
    ]);

    const totalPages = Math.ceil(totalMessages[0].messageCount / limit);

    req.app.io.emit("getRoomUsersList", { roomId: id });

    res.status(200).json({
      success: true,
      message: "All room messages successfully retrieved",
      data: room.messages,
      page: parseInt(page, 10),
      totalPages,
      totalMessages: totalMessages[0].messageCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.hideMessage = async (req, res) => {
  const { roomId, messageId } = req.body;

  // Validate that roomId and messageId are valid ObjectIds
  if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room or message ID",
    });
  }

  try {
    // Find the room and the specific message
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Find the message inside the room's messages array
    const messageIndex = room.messages.findIndex(
      (msg) => msg._id.toString() == messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Set the "hide" attribute of the message to true
    room.messages[messageIndex].hide = true;

    // Save the updated room document
    await room.save();

    res.status(200).json({
      success: true,
      message: "Message hidden successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.hideMsgAndBanUser = async (req, res) => {
  const { roomId, messageId, userId, endTime } = req.body;

  // Validate roomId, messageId, and userId as ObjectId
  if (
    !mongoose.Types.ObjectId.isValid(roomId) ||
    !mongoose.Types.ObjectId.isValid(messageId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid room, message, or user ID",
    });
  }

  try {
    // Find the room and the user
    const room = await Room.findById(roomId);
    const user = await User.findById(userId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find the message inside the room's messages array
    const messageIndex = room.messages.findIndex(
      (msg) => msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Set the "hide" attribute of the message to true
    room.messages[messageIndex].hide = true;

    // Update user's ban status and blockedEndTime
    user.blockedEndTime = new Date(endTime); // Set the specified endTime
    user.status = true; // Set user status to true (banned)

    // Save the updated room and user
    await room.save();
    await user.save();

    // Schedule a job to unblock the user when blockedEndTime passes
    setTimeout(async () => {
      const currentUser = await User.findById(userId);
      if (new Date() >= currentUser.blockedEndTime) {
        currentUser.status = false; // Unblock the user by setting status to false
        currentUser.blockedEndTime = null; // Clear the blockedEndTime
        await currentUser.save();
      }
    }, new Date(endTime) - new Date()); // Schedule timeout based on remaining ban time

    res.status(200).json({
      success: true,
      message: "Message hidden and user banned successfully",
      status: true,
      user: userId,
      messageId: messageId,
      blockedEndTime: endTime,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.reportMessage = async (req, res) => {
  const { roomId, messageId, userId } = req.body;

  // Validate that roomId and messageId are valid ObjectIds
  if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room or message ID",
    });
  }

  try {
    // Find the room
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // Find the index of the message inside the room's messages array
    const messageIndex = room.messages.findIndex(
      (msg) => msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if the message already has the report attribute
    if (!room.messages[messageIndex].hasOwnProperty('report')) {
      room.messages[messageIndex].report = false; // Initialize if not present
    }
    
    if (!room.messages[messageIndex].hasOwnProperty('reportedBy')) {
      room.messages[messageIndex].reportedBy = []; // Initialize if not present
    }

    // Check if the user has already reported this message
    if (room.messages[messageIndex].reportedBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "Message already reported by this user",
      });
    }

    // Update the report status and add the userId to reportedBy
    room.messages[messageIndex].report = true;
    room.messages[messageIndex].reportedBy.push(userId);

    // Save the updated room document
    await room.save();
    // let updatedRoom = await Room.findByIdAndUpdate(roomId, {
    //   $push: { messages: room.messages[messageIndex] },
    // });
    res.status(200).json({
      success: true,
      message: "Message reported successfully",
      data: {
        messageId: room.messages[messageIndex]._id,
        report: room.messages[messageIndex].report,
        reportedBy: room.messages[messageIndex].reportedBy,
        me:room.messages[messageIndex]
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};







