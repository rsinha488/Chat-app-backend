// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const { default: mongoose } = require("mongoose");
const { getSocket } = require("../../sockets");
const HashTag = require("../models/hashTag");

// async function createHashtag(data) {
//   try {
   
//   } catch (error) {
//     return error;
//   }
// }
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
    let message = {
      _id: msg_id,
      sender: user,
      hashtagStatus: false,
      room: roomId,
      content: content,
      emojiReaction: [],
    };

    // const text = "#123abc! more text #456def, and #789ghi here";
    // const text = "#123abc! more text";
    const match = content.match(/#([a-zA-Z0-9]+)/);
    // let hashtagId = new mongoose.Types.ObjectId();
    if (match?.[1]?.length > 2) {
      //create hashTag
      const createHashTag ={
        hashtagTitle: "#" + match[1],
        roomId,
        hashtagStatus: true,
        sender: user,
        content: content,
        msgId: msg_id,
      }
      let newHashtag = new HashTag(createHashTag);
      const hashTagData = await newHashtag.save();
      
      console.log("Create hash ", hashTagData);
      message = {
        ...message,
        hashtagStatus: true,
        hashtagTitle: "#" + match[1],
        hashtagId: hashTagData._id,
      };
      // console.log(match[1]); //Output: 123abc
    }
    console.log(message);

    // await message.save();

    // Step 2: Push the message ID to the Room's messages array
    let updatedRoom = await Room.findByIdAndUpdate(roomId, {
      $push: { messages: message },
    });

    // req.app.io.on("sendMessage", (user, room, msg) => {
    //   // const data = { user: { ...user }, room: { ...room }, message: msg };
    //   // console.log({ user, room, msg, data });
    //   req.app.io.to(roomId).emit("msgReceived", message);
    // });

    req.app.io.to(roomId).emit("message", message);

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
      status: true,
      data: updatedRoom,
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

    // console.log("msgfound", msgfound);
    // await message.save();

    // Step 2: Push the message ID to the Room's messages array
    await Room.findByIdAndUpdate(roomId, {
      $set: { messages: msgfound },
    });

    // req.app.io.on("sendMessage", (user, room, msg) => {
    //   // const data = { user: { ...user }, room: { ...room }, message: msg };
    //   // console.log({ user, room, msg, data });
    //   req.app.io.to(roomId).emit("msgReceived", message);
    // });
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

// exports.getMessage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Find the user and room
//     // const user = await User.findById({_id: userId});
//     const room = await Room.findById({ _id: id });
//     if (!room) {
//       return res
//         .status(404)
//         .json({ success: false, error: "User or room not found" });
//     }

//     // const message = {
//     //   _id : new mongoose.Types.ObjectId(),
//     //   sender: user,
//     //   room: roomId,
//     //   content: content,
//     // };

//     // await message.save();

//     // Step 2: Push the message ID to the Room's messages array
//     // await Room.findByIdAndUpdate(roomId, {
//     //   $push: { messages: message },
//     // });

//     req.app.io.emit("getRoomUsersList", { roomId: id });
//     // req.app.io.on("sendMessage", (user, room, msg) => {
//     //   // const data = { user: { ...user }, room: { ...room }, message: msg };
//     //   // console.log({ user, room, msg, data });
//     //   req.app.io.to(roomId).emit("msgReceived", message);
//     // });

//     // socket.to(roomId).emit("message", message);

//     res
//       .status(200)
//       .json({
//         success: true,
//         message: "all room messages successfully",
//         data: room.messages,
//       });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
