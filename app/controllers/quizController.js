// quizController.js
const { socketIO } = require("../../sockets");
const Quiz = require("../models/quiz");
const Room = require("../models/room");
const User = require("../models/user");
const cron = require("node-cron");

// const io = socketIO();

//TYPES
// QUIZ_STARTED
// QUIZ_DELETE
// QUIZ_STATUS_UPDATED
// QUIZ_TAKE_QUIZ

//create quiz question
exports.createQuiz = async (req, res) => {
  try {
    const { question, options, roomId } = req.body;

    // Check if at least two options are provided
    if (options.length < 2) {
      return res
        .status(400)
        .json({ success: false, error: "At least two options are required." });
    }

    const room = await Room.findById({ _id: roomId });

    const quiz = new Quiz({
      question,
      options,
      room: {
        id: roomId,
        name: room.name,
        bgImage: room.bgImage,
        textColor: room.primaryTextColor,
        bgColor: room.primaryBgColor,
      },
    });

    await quiz.save();
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get all quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Update a quiz by ID
exports.updateQuiz = async (req, res) => {
  try {
    const { roomId, endTime } = req.body;
    let data;

    const currentTime = new Date();
    const endTime1 = new Date(endTime);
    const timeDifference = endTime1 - currentTime;
    // Only schedule if endTime is in the future
    if (timeDifference <= 0) {
      console.log(`Quiz ${quiz._id} endTime has already passed.`);
      return res.status(400).json({
        success: false,
        error: `Quiz ${quiz._id} endTime has already passed.`,
      });
    }

    if (endTime) {
      data = { roomId, endTime, status: true };
    } else {
      data = { roomId, endTime };
    }
    console.log({ data });
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    console.log({ quiz });
    // //schedule quiz
    if (endTime && quiz) {
      scheduleQuizStatusUpdate(quiz, req);
    }

    if (!quiz)
      return res.status(404).json({ success: false, error: "Quiz not found" });

    //type QUIZ FOR QUIZ
    console.log("update Quiz");
    req.app.io
      .to(roomId)
      .emit("message", { type: "QUIZ_STARTED", roomId, data: quiz });
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Delete a quiz by ID
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz)
      return res.status(404).json({ success: false, error: "Quiz not found" });

    //type QUIZ FOR QUIZ
    req.app.io.to(quiz.roomId).emit("message", {
      type: "QUIZ_DELETE",
      roomId: quiz.roomId,
      data: quiz,
    });

    res
      .status(200)
      .json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get all quiz by RoomId
exports.getQuizByRoomId = async (req, res) => {
  try {
    const quiz = await Quiz.find({ "room.id": req.params.roomId });
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, error: "This room has no Quiz yet!" });
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// take quiz
exports.takeQuizzes = async (req, res) => {
  try {
    const { userId, roomId, quizId, optionsSelected } = req.body;

    if (!userId || !roomId || !quizId || optionsSelected === undefined) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    // Fetch the quiz by quizId and roomId
    const quiz = await Quiz.findOne({ _id: quizId });

    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    // Check if user has already answered this quiz
    const userAnswerIndex = quiz.totalUserAnsweredDetail.findIndex(
      (detail) => detail.userId.toString() === userId
    );

    if (userAnswerIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: "User has already answered this quiz",
      });
    }

    // Update the user's answer details
    quiz.totalUserAnsweredDetail.push({
      userId,
      optionClicked: optionsSelected,
    });

    // Increment the total number of users who answered
    quiz.totalUserAnswered += 1;

    // Update the count of how many times each option has been selected
    if (quiz.optionsClickedByUsers.has(optionsSelected.toString())) {
      quiz.optionsClickedByUsers.set(
        optionsSelected.toString(),
        quiz.optionsClickedByUsers.get(optionsSelected.toString()) + 1
      );
    } else {
      quiz.optionsClickedByUsers.set(optionsSelected.toString(), 1);
    }

    // Save the updated quiz
    await quiz.save();

    // io.to(roomId).emit("takeQuizzes", quiz);

    //type QUIZ FOR QUIZ
    req.app.io
      .to(roomId)
      .emit("message", { type: "QUIZ_TAKE_QUIZ", roomId, data: quiz });

    res
      .status(200)
      .json({ success: true, message: "Answer submitted successfully" });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Function to update quiz status to false
async function updateQuizStatus(quiz, req) {
  try {
    const data = await Quiz.findByIdAndUpdate(
      quiz._id,
      { status: false, completed: true },
      { new: true } // This option returns the updated document
    );
    let quizResult = getQuizStats(quiz._id, quiz.roomId);
    console.log({ quizResult });
    // io.to(quiz.roomId).emit("updateQuizStatus", quiz)
    //type QUIZ FOR QUIZ
    req.app.io.to(quiz.roomId).emit("message", {
      type: "QUIZ_RESULT",
      roomId: quiz.roomId,
      data: quizResult,
    });

    console.log(`Quiz ${quiz._id} status set to false.`);
  } catch (error) {
    console.error("Failed to update quiz status:", error);
  }
}
// const getQuizStats = async (quizId, roomId, req) => {
//   try {
//     // Validate input
//     if (!quizId || !roomId) {
//       throw new Error("Invalid input");
//     }

//     // Fetch the quiz by quizId and roomId
//     const quiz = await Quiz.findOne({ _id: quizId, "room.roomId": roomId });

//     if (!quiz) {
//       throw new Error("Quiz not found");
//     }

//     // Create a stats object to hold option counts and user data
//     const optionStats = {};
//     const usersByOption = {};

//     // Loop through the totalUserAnsweredDetail to calculate stats
//     quiz.totalUserAnsweredDetail.forEach(({ userId, optionClicked }) => {
//       // Count how many users clicked each option
//       optionStats[optionClicked] = (optionStats[optionClicked] || 0) + 1;

//       // Group users by option clicked
//       if (!usersByOption[optionClicked]) {
//         usersByOption[optionClicked] = [];
//       }
//       usersByOption[optionClicked].push(userId);
//     });

//     // Construct the stats data to return
//     const statsData = {
//       quizId: quiz._id,
//       roomId: roomId,
//       question: quiz.question,
//       totalUserAnswered: quiz.totalUserAnswered,
//       optionStats, // e.g., { option1: 5, option2: 3 }
//       usersByOption, // e.g., { option1: [user1, user2], option2: [user3] }
//       optionsClickedByUsers: Array.from(quiz.optionsClickedByUsers.entries()), // Convert Map to Array
//     };

//     return { success: true, data: statsData };
//   } catch (error) {
//     console.error("Error fetching quiz stats:", error);
//     return { success: false, message: error.message };
//   }
// };
const getQuizStats = async (quizId, roomId, req) => {
  try {
    // Validate input
    if (!quizId || !roomId) {
      throw new Error("Invalid input");
    }

    // Fetch the quiz by quizId and roomId
    const quiz = await Quiz.findOne({ _id: quizId, "room.id": roomId });

    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Initialize the stats object to hold option counts and user data
    const optionStats = {};
    const usersByOption = {};

    // Initialize optionStats and usersByOption with all possible options
    quiz.options.forEach((option, index) => {
      optionStats[index] = 0; // Initialize count to zero for each option
      usersByOption[index] = []; // Initialize empty array for each option's users
    });

    // Loop through the totalUserAnsweredDetail to calculate actual stats
    quiz.totalUserAnsweredDetail.forEach(({ userId, optionClicked }) => {
      // Count how many users clicked each option
      optionStats[optionClicked] = (optionStats[optionClicked] || 0) + 1;

      // Group users by the option they clicked
      usersByOption[optionClicked].push(userId);
    });

    // Construct the stats data to return
    const statsData = {
      quizId: quiz._id,
      roomId: roomId,
      question: quiz.question,
      totalUserAnswered: quiz.totalUserAnswered,
      optionStats, // Contains counts for each option
      usersByOption, // Contains user arrays for each option
      optionsClickedByUsers: Array.from(quiz.optionsClickedByUsers.entries()), // Convert Map to Array
    };

    return { success: true, data: statsData };
  } catch (error) {
    console.error("Error fetching quiz stats:", error);
    return { success: false, message: error.message };
  }
};

exports.updateQuizRow = async (req, res) => {
  const { id } = req.params;

  const data = { ...req.body };

  // Prevent updating the _id field
  delete data._id;

  try {
    const quiz = await Quiz.findByIdAndUpdate(
      id, // Use the id directly
      { ...data },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate the data before updating
      }
    );

    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    // Safely access req.body.room.id using optional chaining
    const roomId = req.body?.room?.id;
    if (roomId) {
      req.app.io.to(roomId).emit("message", {
        type: "QUIZ_ROW_UPDATED",
        roomId: roomId,
        data: quiz,
      });
    }

    return res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ===========

// Function to calculate the difference and set the timeout
function scheduleQuizStatusUpdate(quiz, req) {
  const currentTime = new Date();
  const endTime = new Date(quiz.endTime);
  const timeDifference = endTime - currentTime;

  // Only schedule if endTime is in the future
  if (timeDifference > 0) {
    setTimeout(() => updateQuizStatus(quiz, req), timeDifference);
    console.log(
      `Scheduled status update for quiz ${quiz._id} in ${timeDifference}ms.`
    );
  } else {
    console.log(`Quiz ${quiz._id} endTime has already passed.`);
  }
}

// Cron job to check active quizzes every minute
cron.schedule("0 * * * *", async () => {
  console.log("Checking quizzes for scheduling status updates...");

  try {
    // Find all active quizzes with endTime in the future
    const activeQuizzes = await Quiz.find({
      status: true,
      endTime: { $gt: new Date() },
    });

    // Schedule status update for each active quiz
    activeQuizzes.forEach(scheduleQuizStatusUpdate);
  } catch (error) {
    console.error("Error checking quizzes:", error);
  }
});
