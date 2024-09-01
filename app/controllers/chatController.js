// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const { default: mongoose } = require("mongoose");
const { getSocket } = require("../../sockets");

exports.sendMessage = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId, content } = req.body;

    // Find the user and room
    const user = await User.findById({ _id: userId });
    const room = await Room.findById({ _id: roomId });
    if (!user || !room) {
      return res.status(404).json({ error: "User or room not found" });
    }

    const message = {
      _id: new mongoose.Types.ObjectId(),
      sender: user,
      hashtagStatus: false,
      room: roomId,
      content: content,
      emojiReaction: [],
    };

    // await message.save();

    // Step 2: Push the message ID to the Room's messages array
    await Room.findByIdAndUpdate(roomId, {
      $push: { messages: message },
    });

    // req.app.io.on("sendMessage", (user, room, msg) => {
    //   // const data = { user: { ...user }, room: { ...room }, message: msg };
    //   // console.log({ user, room, msg, data });
    //   req.app.io.to(roomId).emit("msgReceived", message);
    // });

    req.app.io.to(roomId).emit("message", message);

    res
      .status(200)
      .json({ message: "Message sent successfully", status: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendEmojiReaction = async (req, res) => {
  try {
    const socket = getSocket();
    const { sender, roomId, msgId, emoji } = req.body;

    // Find the user and room
    const room = await Room.findById({ _id: roomId });
    if (!room) {
      return res.status(404).json({ error: "User or room not found" });
    }

    const msgfound = room.messages.map((message) => {
      if (message._id.toString() === msgId) {
        let foundExit = message?.emojiReaction?.filter((e) => e.sender._id.toString() === sender._id.toString());
        if (foundExit?.length > 0) {
          console.log("foundExit",foundExit)
          return {
            ...message,
            emojiReaction: message.emojiReaction.map((e) => {
            if (e.sender._id.toString() === sender._id.toString()) {
              return {...foundExit[0],emoji};
            } else {
              return e;
            }
          })
          }
        } else {
          return {
            ...message,
            emojiReaction: message?.emojiReaction ? [...message?.emojiReaction, { sender, emoji }] : [{ sender, emoji }],
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
    const newMsg = msgfound.filter((e) => e._id.toString() === msgId)
    req.app.io.to(roomId).emit("message", {type: 2, msgId,data: newMsg[0]});

    res
      .status(200)
      .json({ message: "Emoji sent successfully", status: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the user and room
    // const user = await User.findById({_id: userId});
    const room = await Room.findById({ _id: id });
    if (!room) {
      return res.status(404).json({ error: "User or room not found" });
    }

    // const message = {
    //   _id : new mongoose.Types.ObjectId(),
    //   sender: user,
    //   room: roomId,
    //   content: content,
    // };

    // await message.save();

    // Step 2: Push the message ID to the Room's messages array
    // await Room.findByIdAndUpdate(roomId, {
    //   $push: { messages: message },
    // });

    req.app.io.emit("getRoomUsersList", {roomId:id})
    // req.app.io.on("sendMessage", (user, room, msg) => {
    //   // const data = { user: { ...user }, room: { ...room }, message: msg };
    //   // console.log({ user, room, msg, data });
    //   req.app.io.to(roomId).emit("msgReceived", message);
    // });

    // socket.to(roomId).emit("message", message);

    res
      .status(200)
      .json({ message: "all room messages successfully", data: room.messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
