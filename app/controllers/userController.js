// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const { getSocket } = require("../../sockets");

const usersInRooms = {}; 

// function getUsersBySocketIds(socketIds) {
//   return socketIds.map(id => usersInRooms[id]);
// }

function getUserIdsByRoom(roomId) {
  const data = Object.values(usersInRooms);
  return [...new Set(data.filter((e) => e.roomId === roomId).map((d) => d.userId))];
}

function removeUserIdsFromRoom(item, roomId) {
  const data = Object.values(item);
  return [...new Set(data.filter((e) => e.roomId === roomId).map((d) => d.userId))];
}

exports.subscribeToRoom = async (req, res) => {
  try {
      const socket = getSocket();
      const { userId, roomId } = req.body;

      // Find the user and room
      const user = await User.findById(userId);
      const room = await Room.findById(roomId);

      if (!user || !room) {
          return res.status(404).json({ error: "User or room not found" });
      }

      const previousRoom = usersInRooms[socket.id]; // Get the previous room of the user

      if (previousRoom && previousRoom.roomId !== roomId) {
          req.app.io.to(previousRoom.roomId).emit('MemberUpdate', {
              badges: true,
              roomId: previousRoom.roomId,
              content: `${user.name} has left the room`
          });
          console.log(previousRoom.roomId, socket.id, "left");

          // Remove user from previous room
          delete usersInRooms[socket.id];
          
          // Update the user list and room count for the previous room
          const listUsers = getUserIdsByRoom(previousRoom.roomId);
          const userList = listUsers.length > 0 ? await User.find({ _id: { $in: listUsers } }).exec() : [];

          await Room.updateOne(
              { _id: previousRoom.roomId },
              { $set: { userCount: userList.length } } // Set the userCount
          );
          req.app.io.to(previousRoom.roomId).emit("Room_member_list", {
              roomId: previousRoom.roomId,
              data: userList
          });
          
          socket.leave(previousRoom.roomId); // Leave the previous room
      }

      // Subscribe the user to the new room
      socket.join(roomId);
      usersInRooms[socket.id] = { userId, roomId };

      // Update the user list and room count for the new room
      const listUsers = getUserIdsByRoom(roomId);
      const userList = listUsers.length > 0 ? await User.find({ _id: { $in: listUsers } }).exec() : [];

      await Room.updateOne(
          { _id: roomId },
          { $set: { userCount: userList.length } } // Set the userCount
      );
      req.app.io.to(roomId).emit("Room_member_list", {
          roomId,
          data: userList
      });
      req.app.io.to(roomId).emit("MemberUpdate", {
          badges: true,
          roomId,
          content: `${user.name} has joined`
      });

      // Get all clients in the room
      // const clients = req.app.io.sockets.adapter.rooms.get(roomId) || new Set();
      // const userIds = getUserIdsBySocketIds(Array.from(clients));

      res.status(200).json({ message: "User subscribed to room successfully" });
  } catch (error) {
      console.error("Error subscribing to room:", error);
      res.status(500).json({ error: error.message });
  }
};


exports.createUser = async (req, res) => {
  const data = new User({
    name: req.body.name,
    username: req.body.username,
  });
  console.log({ data });

  try {
    const dataToSave = data.save();
    req.app.io.emit("userCreated", data);
    res.status(200).json(dataToSave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    // const { userId } = req.body;
    const data = await User.find();
    // const data = {
    //   name: "shivam",
    //   active: true,
    // };
    // req.app.io.emit("getUser", data);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSingleUser = async (req, res) => {
  try {
    const { username } = req.params;
    const data = await User.find({ username});
    // const data = {
    //   name: "shivam",
    //   active: true,
    // };
    // req.app.io.emit("getUser", data);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.leaveRoom = async (req, res) => {
  try {
    const { username, roomname } = req.body;

    // Find the user and room
    const user = await User.find({ username });
    const room = await Room.find({ name: roomname });

    if (!user || !room) {
      return res.status(404).json({ error: "User or room not found" });
    }
    //Update userCount in room model
    const result = await Room.updateOne(
      { roomname: roomname },
      {
        $set: {
          userCount: {
            $cond: [
              {
                $gt: [
                  {
                    $subtract: ["$userCount", 1],
                  },
                  0,
                ],
              },
              {
                $subtract: ["$userCount", 1],
              },
              0,
            ],
          },
        },
      }
    );

    console.log("Update Result:", result);
    console.log("socketEvent", socket);
    // Subscribe the user to the room
    socket.join(roomname);
    socket.to(roomname).emit("MemberAdded", {
      id: socket.id,
      room: room,
      user: user,
    });

    // await user.save();

    res.status(200).json({ message: "User subscribed to room successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.unsubscribeFromRoom = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById({_id: userId});
    const room = await Room.findById({_id: roomId});

    if (!user || !room) {
      return res.status(404).json({ error: "User or room not found" });
    }

    const currentRoom = usersInRooms[socket.id]; // Get the current room of the user

    if (currentRoom === roomId) {
      // User is in the room, so proceed to unsubscribe

      // Decrement userCount in room model
      await Room.updateOne(
        { _id: roomId },
        { $inc: { userCount: -1 } } // Decrement userCount by 1
      );

      // Leave the room
      socket.leave(roomId);
      delete usersInRooms[socket.id]; // Remove the user from the usersInRooms tracking

      // Notify other users in the room
      req.app.io.to(roomId).emit('MemberUpdate', {badges:true, content:`${user.name} has left the room`});
      console.log(roomId , socket.id,"leave");

      res.status(200).json({ message: "User unsubscribed from room successfully" });
    } else {
      res.status(400).json({ error: "User is not subscribed to this room" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
