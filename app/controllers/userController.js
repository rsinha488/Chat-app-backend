// userController.js
const User = require("../models/user");
const Room = require("../models/room");
const Quiz = require("../models/quiz");
const { getSocket } = require("../../sockets");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const Event = require("../models/event");
const HashTag = require("../models/hashTag");
const { default: mongoose } = require("mongoose");

const usersInRooms = {};
const JWT_SECRET = process.env.JWT_SECRET || "ruchi_jwt_secret"; // Store this securely in environment variables
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1d"; // Token expiry duration

const ObjectId = mongoose.Types.ObjectId;

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
    // Find all users, excluding the password field
    let users = await User.find().select("-password");

    const currentTime = new Date();

    // Loop through each user and update the status if blockedEndTime has passed
    users = await Promise.all(users.map(async (user) => {
      if (user.blockedEndTime && user.blockedEndTime < currentTime) {
        // If the blockedEndTime has passed, set the status to false
        user.status = false;
        user.blockedEndTime = null;  // Reset blockedEndTime as it has passed
        await user.save();  // Save the updated user document
      }
      return user;
    }));

    // Send the updated users list in the response
    res.status(200).json({ success: true, data: users });
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
    const room = await Room.findById(roomId);

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
      req.app.io.to(previousRoom.roomId).emit("Room_member_list", {
        roomId: previousRoom.roomId,
        data: userList,
      });

      socket.leave(previousRoom.roomId);
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
exports.sendFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!ObjectId.isValid(senderId) || !ObjectId.isValid(receiverId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid sender or receiver ID",
    });
  }
  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if request already exists
    const existingRequest = receiver.requests.find(
      (request) => request.userId.toString() === senderId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request already sent",
      });
    }

    // Add friend request to receiver's requests array
    receiver.requests.push({ userId: senderId });
    await receiver.save();

    res.status(200).json({
      success: true,
      message: "Friend request sent",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  const { userId, requestId } = req.body;

  try {
    const user = await User.findById(userId);

    const request = user.requests.id(requestId);
    console.log(request);
    if (!request || request.status !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Request not found or already processed",
      });
    }

    // Update request status to accepted
    request.status = "accepted";
    await user.save();

    // Add sender to user's friends list
    const sender = await User.findById(request.userId);
    user.friends.push(sender._id);
    sender.friends.push(user._id);

    await user.save();
    await sender.save();

    res.status(200).json({
      success: true,
      message: "Friend request accepted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.blockUser = async (req, res) => {
  const { blockerId, blockedId, endTime } = req.body;

  try {
    const blocker = await User.findById(blockerId);
    const blocked = await User.findById(blockedId);

    if (!blocked) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if the user is already blocked
    if (blocker.blockedUsers.includes(blockedId)) {
      return res
        .status(400)
        .json({ success: false, message: "User is already blocked" });
    }

    // Add blocked user to blocker's blockedUsers array
    blocker.blockedUsers.push(blockedId);

    // Set blockedEndTime and status
    blocked.blockedEndTime = endTime;
    blocked.status = true; // Status true indicates the user is blocked

    // Save both users
    await blocker.save();
    await blocked.save();

    res
      .status(200)
      .json({ success: true, message: "User successfully blocked" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getFriendList = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate(
      "friends",
      "userName firstName lastName image"
    );

    if (!user) {
      return res.status(404).json({success: false,
      message: "User not found"});
    }

    res.status(200).json({
      success: true,
      friends: user.friends,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.getFriendRequests = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate(
      "requests.userId",
      "userName firstName lastName image"
    );

    if (!user) {
      return res.status(404).json({success: false,
      message: "User not found"});
    }

    const pendingRequests = user.requests.filter(
      (request) => request.status === "pending"
    );

    res.status(200).json({
      success: true,
      requests: pendingRequests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
exports.rejectFriendRequest = async (req, res) => {
  const { userId, requestId } = req.body;

  try {
    const user = await User.findById(userId);

    const request = user.requests.id(requestId);
    if (!request || request.status !== "pending") {
      return res.status(404).json({success: false,
      message: "Request not found or already processed"});
    }

    // Update request status to rejected
    request.status = "rejected";
    await user.save();

    res.status(200).json({success: true,
      message: "Friend request rejected"});
  } catch (err) {
    res.status(500).json({success: false,
      message: "Server error"});
  }
};

exports.unblockUser = async (req, res) => {
  const { blockerId, blockedId } = req.body;

  try {
    const blocker = await User.findById(blockerId);
    const blocked = await User.findById(blockedId);

    if (!blocked) {
      return res.status(404).json({ success: false, message: "Blocked user not found" });
    }

    // Check if the user is actually blocked
    if (!blocker.blockedUsers.includes(blockedId)) {
      return res.status(400).json({ success: false, message: "User is not blocked" });
    }

    // Remove the blocked user from blocker's blockedUsers array
    blocker.blockedUsers = blocker.blockedUsers.filter(id => id.toString() !== blockedId);

    // Reset the blocked user's blockedEndTime and status
    blocked.blockedEndTime = null;
    blocked.status = false;

    // Save both users
    await blocker.save();
    await blocked.save();

    res.status(200).json({ success: true, message: "User successfully unblocked" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

