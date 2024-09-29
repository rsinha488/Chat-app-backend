// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const Quiz = require("../models/quiz");
const { getSocket } = require("../../sockets");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const Event = require("../models/event");
const HashTag = require("../models/hashTag");

const usersInRooms = {};
const JWT_SECRET = process.env.JWT_SECRET || "ruchi_jwt_secret"; // Store this securely in environment variables
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1d"; // Token expiry duration

exports.createUser = async (req, res) => {
  const { userName, firstName, lastName, image, password, isAdmin } = req.body;
  console.log(
    req.body,
    userName,
    firstName,
    lastName,
    image,
    password,
    isAdmin
  );

  // Check if password is provided
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: "Password is required" });
  }
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const data = new User({
    userName: userName,
    firstName: firstName,
    lastName: lastName,
    image: image,
    isAdmin: isAdmin ? isAdmin : false,
    password: hashedPassword,
  });
  console.log({ data });

  try {
    const dataToSave = data.save();

    // JWT token creation with expiry
    const token = jwt.sign(
      { userId: dataToSave._id, userName: dataToSave.userName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(200).json({ success: true, data: dataToSave, token });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.userLogin = async (req, res) => {
  const { userName, password } = req.body;

  try {
    if (!userName || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({ userName });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, userName: user.userName },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Send response with token
    res.status(200).json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

function getUserIdsByRoom(roomId) {
  const data = Object.values(usersInRooms);
  return [
    ...new Set(data.filter((e) => e.roomId === roomId).map((d) => d.userId)),
  ];
}

function removeUserIdsFromRoom(item, roomId) {
  const data = Object.values(item);
  return [
    ...new Set(data.filter((e) => e.roomId === roomId).map((d) => d.userId)),
  ];
}

exports.subscribeToRoom = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById(userId);
    const room = await Room.findById(roomId);

    if (!user || !room) {
      return res
        .status(404)
        .json({ success: false, error: "User or room not found" });
    }

    const previousRoom = usersInRooms[socket.id]; // Get the previous room of the user

    if (previousRoom && previousRoom.roomId !== roomId) {
      req.app.io.to(previousRoom.roomId).emit("MemberUpdate", {
        badges: true,
        roomId: previousRoom.roomId,
        content: `${user.name} has left the room`,
      });
      console.log(previousRoom.roomId, socket.id, "left");

      // Remove user from previous room
      delete usersInRooms[socket.id];

      // Update the user list and room count for the previous room
      const listUsers = getUserIdsByRoom(previousRoom.roomId);
      const userList =
        listUsers.length > 0
          ? await User.find({ _id: { $in: listUsers } }).exec()
          : [];

      await Room.updateOne(
        { _id: previousRoom.roomId },
        { $set: { userCount: userList.length } } // Set the userCount
      );
      req.app.io.to(previousRoom.roomId).emit("Room_member_list", {
        roomId: previousRoom.roomId,
        data: userList,
      });

      socket.leave(previousRoom.roomId); // Leave the previous room
    }

    // Subscribe the user to the new room
    socket.join(roomId);
    usersInRooms[socket.id] = { userId, roomId };

    // Update the user list and room count for the new room
    const listUsers = getUserIdsByRoom(roomId);
    const userList =
      listUsers.length > 0
        ? await User.find({ _id: { $in: listUsers } }).exec()
        : [];

    await Room.updateOne(
      { _id: roomId },
      { $set: { userCount: userList.length } } // Set the userCount
    );
    req.app.io.to(roomId).emit("Room_member_list", {
      roomId,
      data: userList,
    });
    req.app.io.to(roomId).emit("MemberUpdate", {
      badges: true,
      roomId,
      content: `${user.userName} has joined`,
    });

    //Find active quiz
    let quiz = await Quiz.find({
      "room.id": roomId,
      status: true,
    });
    console.log({ quiz });
    let quizData;
    if (quiz) quizData = quiz[0];

    if (quizData?.endTime) {
      const currentTime = new Date();
      const endTime = new Date(quizData?.endTime);
      const timeDifference = endTime - currentTime;
      // Only schedule if endTime is in the future
      if (timeDifference > 0) {
        console.log("QUIZ_STARTED" + roomId + "quiz started" + quizData);
        //type QUIZ FOR QUIZ
        req.app.io.to(roomId).emit("message", {
          type: "QUIZ_STARTED",
          roomId,
          data: quizData ? quizData : "",
        });
      }
    }

    // const quiz = await Quiz.findOne({
    //   'room.id' : roomId,
    //   status: false
    // });

    //type QUIZ FOR QUIZ
    // console.log("update quiz")
    // req.app.io.to(roomId).emit("message", { type: "QUIZ_STARTED", roomId, data: quiz });

    res.status(200).json({
      success: true,
      message: "User subscribed to room successfully",
    });
  } catch (error) {
    console.error("Error subscribing to room:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get user details by ID
exports.getUserDetail = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Exclude sensitive information like password from the response
    const userDetail = {
      _id: user._id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      // Add other fields you want to expose
    };

    res.status(200).json({ success: true, data: userDetail });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update user details by ID
exports.updateUserDetail = async (req, res) => {
  const { userId } = req.params; // Assuming _id is passed as a URL parameter
  const { userName, firstName, lastName, image, password, isAdmin, status } =
    req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (userName) user.userName = userName;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (image) user.image = image;
    user.isAdmin = isAdmin;
    if (status) user.status = status;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    req.app.io.emit("userUpdated", updatedUser);

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const data = await User.find().select("-password");
    res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.leaveRoom = async (req, res) => {
  try {
    const { username, roomname } = req.body;

    // Find the user and room
    const user = await User.find({ username });
    const room = await Room.find({ name: roomname });

    if (!user || !room) {
      return res
        .status(404)
        .json({ success: false, error: "User or room not found" });
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

    res
      .status(200)
      .json({ success: true, message: "User subscribed to room successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.unsubscribeFromRoom = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById({ _id: userId });
    const room = await Room.findById({ _id: roomId });

    if (!user || !room) {
      return res
        .status(404)
        .json({ success: false, error: "User or room not found" });
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
      req.app.io.to(roomId).emit("MemberUpdate", {
        badges: true,
        content: `${user.name} has left the room`,
      });
      console.log(roomId, socket.id, "leave");

      res.status(200).json({
        success: true,
        message: "User unsubscribed from room successfully",
      });
    } else {
      res
        .status(400)
        .json({ success: false, error: "User is not subscribed to this room" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.subscribeToEvent = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById(userId);

    // const event = await Event.findById(roomId);

    const previousRoom = usersInRooms[socket.id]; // Get the previous room of the user

    if (previousRoom && previousRoom.roomId !== roomId) {
      req.app.io.to(previousRoom.roomId).emit("MemberUpdate", {
        badges: true,
        roomId: previousRoom.roomId,
        content: `${user.name} has left the room`,
      });
      console.log(previousRoom.roomId, socket.id, "left");

      // Remove user from previous room
      delete usersInRooms[socket.id];

      // Update the user list and room count for the previous room
      const listUsers = getUserIdsByRoom(previousRoom.roomId);
      const userList =
        listUsers.length > 0
          ? await User.find({ _id: { $in: listUsers } }).exec()
          : [];
    }
    req.app.io.to(roomId).emit("Room_member_list", {
      roomId,
      data: userList,
    });
    req.app.io.to(roomId).emit("MemberUpdate", {
      badges: true,
      roomId,
      content: `${user.userName} has joined`,
    });
    res.status(200).json({
      success: true,
      message: "User subscribed to room successfully",
    });
  } catch (error) {
    console.error("Error subscribing to room:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.subscribeToHashTag = async (req, res) => {
  try {
    const socket = getSocket();
    const { userId, roomId } = req.body;

    // Find the user and room
    const user = await User.findById(userId);
    // const hashtag = await HashTag.findById(roomId);

    const previousRoom = usersInRooms[socket.id]; // Get the previous room of the user

    if (previousRoom && previousRoom.roomId !== roomId) {
      req.app.io.to(previousRoom.roomId).emit("MemberUpdate", {
        badges: true,
        roomId: previousRoom.roomId,
        content: `${user.name} has left the room`,
      });
      console.log(previousRoom.roomId, socket.id, "left");

      // Remove user from previous room
      delete usersInRooms[socket.id];

      // Update the user list and room count for the previous room
      const listUsers = getUserIdsByRoom(previousRoom.roomId);
      const userList =
        listUsers.length > 0
          ? await User.find({ _id: { $in: listUsers } }).exec()
          : [];
    }
    req.app.io.to(roomId).emit("Room_member_list", {
      roomId,
      data: userList,
    });
    req.app.io.to(roomId).emit("MemberUpdate", {
      badges: true,
      roomId,
      content: `${user.userName} has joined`,
    });
    res.status(200).json({
      success: true,
      message: "User subscribed to room successfully",
    });
  } catch (error) {
    console.error("Error subscribing to room:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
