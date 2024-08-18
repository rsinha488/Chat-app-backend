// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const { getSocket } = require("../../sockets");

const usersInRooms = {}; 

exports.subscribeToRoom = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById({_id: userId});
    const room = await Room.findById({_id: roomId});

    if (!user || !room) {
      return res.status(404).json({ error: "User or room not found" });
    }

    const previousRoom = usersInRooms[socket.id]; // Get the previous room of the user

    if (previousRoom && previousRoom !== roomId) {
      socket.leave(previousRoom); // Leave the previous room
      req.app.io.to(previousRoom).emit('MemberUpdate', {badges:true, content:`${user.name} has left the room`});
      console.log(previousRoom , socket.id,"leave")
    }

    //Update userCount in room model
    await Room.updateOne(
      { _id: roomId },
      { $inc: { userCount: 1 } } // Increment userCount by 1
    );
    console.log("Update Result:");
    // Subscribe the user to the room
    socket.join(roomId);
    usersInRooms[socket.id] = roomId;
    socket.userData = user; 
    req.app.io.to(roomId).emit("MemberUpdate", {badges:true, content:`${user.name} has joined`});
    
    // await result.save();
    // console.log("socketEvent", req.app.io.sockets.adapter.rooms.get(roomname));
    // Get the users connected in the room
  //   const d = await res.app.io.in(roomId).fetchSockets();
  //   console.log(d)
  // const roomUsers = req.app.io.sockets.adapter.rooms.get(roomId);
  // const userIds = Array.from(roomUsers?.keys()); // Get the socket IDs in the room
  //   console.log("userIds",userIds)
  // // Convert socket IDs to usernames or other identifying information
  // const usernames = userIds.map((id) => {
  //   const socket = req.app.io.sockets.sockets.get(id);
  //   // console.log("socket====",socket)
  //   return socket.userData; // Assuming you've stored the username in the socket object
  // });

  // console.log(`Users in room "myRoom": ${usernames.join(', ')}`);

    res.status(200).json({ message: "User subscribed to room successfully" });
  } catch (error) {
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
