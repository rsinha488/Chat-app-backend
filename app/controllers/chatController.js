// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const { default: mongoose } = require("mongoose");
const { getSocket } = require("../../sockets");
const HashTag = require("../models/hashTag");
const moment = require("moment");

exports.sendMessage = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId, content, parent = false } = req.body;

    // Find the user and room
    const user = await User.findById({ _id: userId });
    const room = await Room.findById({ _id: roomId });
    if (!user || !room) {
      return res
        .status(404)
        .json({ success: false, error: "User or room not found" });
    }
    let msg_id = new mongoose.Types.ObjectId();
    const createdOn = new moment(new Date()); // Get the current date and time

    let message = {
      _id: msg_id,
      sender: user,
      hashtagStatus: false,
      room: roomId,
      content: content,
      parent : parent ? parent : false,
      emojiReaction: [],
      createdOn: createdOn, // Add createdOn attribute
      report: false,
      hide: false,
      reportedBy: [],
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
        // console.log("existingHashtag ", existingHashtag);
        let newHashtag = new HashTag(createHashTag);
        const hashTagData = await newHashtag.save();

        // console.log("Create hash ", hashTagData);
        message = {
          ...message,
          hashtagStatus: true,
          hashtagTitle: "#" + match[1],
          hashtagId: hashTagData._id,
        };
      }
      // console.log(match[1]); //Output: 123abc
    }

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
          // console.log("foundExit", foundExit);
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
// exports.getMessage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { page = 1, limit = 20 } = req.query; // Default to page 1, limit 20

//     // Use aggregation pipeline to find and filter the messages
//     const roomMessages = await Room.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(id) } }, // Match the room by ID
//       { $unwind: "$messages" }, // Unwind the messages array
//       {
//         $lookup: {
//           from: "messages", // Assuming the messages are stored in a separate collection
//           localField: "messages",
//           foreignField: "_id",
//           as: "messageDetails",
//         },
//       },
//       { $unwind: "$messageDetails" }, // Unwind the message details
//       {
//         $match: {
//           $or: [
//             { "messageDetails.report": { $exists: false } },  // Messages where 'report' doesn't exist
//             { "messageDetails.report": { $ne: true } }        // Messages where 'report' is not true
//           ],
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           messages: { $push: "$messageDetails" },  // Group back the filtered messages
//         },
//       },
//       {
//         $project: {
//           messages: {
//             $slice: ["$messages", (page - 1) * limit, parseInt(limit, 10)], // Apply pagination
//           },
//         },
//       },
//     ]);

//     if (!roomMessages.length) {
//       return res.status(404).json({ success: false, error: "Room not found or no messages available" });
//     }

//     // Calculate total messages for pagination info
//     const totalMessagesCount = await Room.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(id) } },
//       { $project: { messageCount: { $size: "$messages" } } },
//     ]);

//     const totalMessages = totalMessagesCount.length ? totalMessagesCount[0].messageCount : 0;
//     const totalPages = Math.ceil(totalMessages / limit);

//     req.app.io.emit("getRoomUsersList", { roomId: id });

//     res.status(200).json({
//       success: true,
//       message: "All room messages successfully retrieved",
//       data: roomMessages[0].messages,
//       page: parseInt(page, 10),
//       totalPages,
//       totalMessages,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// exports.getMessage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { page = 1, limit = 20 } = req.query; // Default to page 1, limit 20

//     // Find the room by ID
//     const room = await Room.findById(id).populate({
//       path: "messages",
//       match: {
//         $or: [
//           { report: { $exists: false } },   // Messages where 'report' field doesn't exist
//           { report: { $ne: true } }         // Messages where 'report' is not true
//         ]
//       },
//       options: {
//         sort: { _id: -1 }, // Sort by newest messages first
//         skip: (page - 1) * limit,
//         limit: parseInt(limit, 10),
//       },
//     });

//     if (!room) {
//       return res.status(404).json({ success: false, error: "Room not found" });
//     }

//     // Get total number of messages for pagination info
//     const totalMessages = await Room.aggregate([
//       { $match: { _id: room._id } },
//       { $project: { messageCount: { $size: "$messages" } } },
//     ]);

//     const totalPages = Math.ceil(totalMessages[0].messageCount / limit);

//     req.app.io.emit("getRoomUsersList", { roomId: id });

//     res.status(200).json({
//       success: true,
//       message: "All room messages successfully retrieved",
//       data: room.messages,
//       page: parseInt(page, 10),
//       totalPages,
//       totalMessages: totalMessages[0].messageCount,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

exports.getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query; // Default to page 1, limit 20

    // Find the room by ID (no filtering done in the query)
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, error: "Room not found" });
    }

    // Filter the messages to exclude those with hide: true
    const filteredMessages = room.messages.reverse().filter(
      (message) => message.hide !== true
    );

    // Paginate the filtered messages
    const startIndex = (page - 1) * limit;
    const paginatedMessages = filteredMessages.slice(
      startIndex,
      startIndex + parseInt(limit, 10)
    );

    // Get total number of messages for pagination info
    const totalMessages = filteredMessages.length;
    const totalPages = Math.ceil(totalMessages / limit);

    // Emit an event to get the room users list
    req.app.io.emit("getRoomUsersList", { roomId: id });

    res.status(200).json({
      success: true,
      message: "All room messages successfully retrieved",
      data: paginatedMessages.reverse(),
      page: parseInt(page, 10),
      totalPages,
      totalMessages,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.hideMessage = async (req, res) => {
  const { roomId, messageId } = req.body;

  // Validate that roomId and messageId are valid ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(roomId) ||
    !mongoose.Types.ObjectId.isValid(messageId)
  ) {
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

    // If the "hide" attribute is missing, initialize it
    if (room.messages[messageIndex].hide === undefined) {
      room.messages[messageIndex].hide = true; // Initialize and set to true
    } else {
      // Set the "hide" attribute to true if it already exists
      room.messages[messageIndex].hide = true;
    }

    // Mark the modified field to ensure it's saved
    room.markModified(`messages.${messageIndex}.hide`);

    // Save the updated room document
    await room.save();

    // Emit the updated message with type 'remove' to the socket
    req.app.io.emit("message", {
      ...room.messages[messageIndex],
      type: "remove",
    });

    res.status(200).json({
      success: true,
      message: "Message hidden successfully",
      data: room.messages,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// exports.hideMessage = async (req, res) => {
//   const { roomId, messageId } = req.body;

//   // Validate that roomId and messageId are valid ObjectIds
//   if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(messageId)) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid room or message ID",
//     });
//   }

//   try {
//     // Find the room and the specific message
//     const room = await Room.findById(roomId);

//     if (!room) {
//       return res.status(404).json({
//         success: false,
//         message: "Room not found",
//       });
//     }

//     // Find the message inside the room's messages array
//     const messageIndex = room.messages.findIndex(
//       (msg) => msg._id.toString() == messageId
//     );

//     if (messageIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Message not found",
//       });
//     }

//     // Check if the message already has the report attribute
//     if (!room.messages[messageIndex].hasOwnProperty('hide')) {
//       room.messages[messageIndex].hide = false; // Initialize if not present
//     }

//     // Set the "hide" attribute of the message to true
//     room.messages[messageIndex].hide = true;

//     req.app.io.emit("message", { ...room.messages[messageIndex], type: "remove"})
//     // Save the updated room document
//     const roomD=await room.save();

//     res.status(200).json({
//       success: true,
//       message: "Message hidden successfully",
//       data:roomD?.messages
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };
exports.hideMsgAndBanUser = async (req, res) => {
  const { roomId, messageId, userId, endTime } = req.body;
  console.log("PAram", roomId, messageId, userId, endTime);
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
    console.log("try");
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
    user.blockedEndTime = moment(endTime).valueOf(); // Set the specified endTime
    user.status = true; // Set user status to true (banned)
    // console.log({ ...user, type: "ban"},"...user")
    req.app.io.emit("overall_notification", { ...user?._doc, type: "ban" });
    console.log(messageIndex);
    console.log(
      "HI",
      user?.blockedEndTime,
      user?.blockedEndTime - new moment(new Date()).valueOf(),
      new moment(endTime) - new moment(new Date())
    );
    // Save the updated room and user
    await room.save();
    await user.save();

    // Schedule a job to unblock the user when blockedEndTime passes
    setTimeout(async () => {
      const currentUser = await User.findById(userId);
      if (new moment(new Date()).valueOf() >= currentUser.blockedEndTime) {
        currentUser.status = false; // Unblock the user by setting status to false
        currentUser.blockedEndTime = null; // Clear the blockedEndTime
        await currentUser.save();
      }
    }, user?.blockedEndTime - new moment(new Date()).valueOf()); // Schedule timeout based on remaining ban time

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
  if (
    !mongoose.Types.ObjectId.isValid(roomId) ||
    !mongoose.Types.ObjectId.isValid(messageId)
  ) {
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
    if (!room.messages[messageIndex].hasOwnProperty("report")) {
      room.messages[messageIndex].report = false; // Initialize if not present
    }

    if (!room.messages[messageIndex].hasOwnProperty("reportedBy")) {
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
    // await room.save();
    let updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        // $push: { messages: room.messages[messageIndex] },

        $set: { [`messages.${messageIndex}`]: room.messages[messageIndex] },
      },
      { new: true } // Returns the updated document
    );
    res.status(200).json({
      success: true,
      message: "Message reported successfully",
      data: {
        messageId: room.messages[messageIndex]._id,
        report: room.messages[messageIndex].report,
        reportedBy: room.messages[messageIndex].reportedBy,
        me: room.messages[messageIndex],
      },
      updatedData: updatedRoom,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
