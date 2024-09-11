// quizController.js
const { socketIO } = require("../../sockets");
const Quiz = require("../models/quiz");
const User = require("../models/user");
const cron = require("node-cron");

const io=socketIO();

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

    const quiz = new Quiz({
      question,
      options,
      roomId,
    });

    await quiz.save();
    res.status(201).json({ success: true, data:quiz });
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
    const { question, options, roomId, endTime } = req.body;

    // Check if at least two options are provided
    if (options.length < 2) {
      return res
        .status(400)
        .json({ success: false, error: "At least two options are required." });
    }
    let data;
    if (endTime) {
      data = { question, options, roomId, endTime, status: true };
    } else {
      data = { question, options, roomId, endTime };
    }

    const quiz = await Quiz.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    // //schedule quiz
    if (endTime && quiz) {
      scheduleQuizStatusUpdate(quiz);
    }

    if (!quiz)
      return res.status(404).json({ success: false, error: "Quiz not found" });
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
    const quiz = await Quiz.find({ roomId: req.params.roomId });
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
    const quiz = await Quiz.findOne({ _id: quizId, roomId });

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

    io.to(roomId).emit("takeQuizzes", quiz)

    res
      .status(200)
      .json({ success: true, message: "Answer submitted successfully" });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Function to update quiz status to false
async function updateQuizStatus(quiz) {
  try {
    await Quiz.findByIdAndUpdate(quiz._id, { status: false, completed: true });
    
    io.to(quiz.roomId).emit("updateQuizStatus", quiz)
   
    console.log(`Quiz ${quiz._id} status set to false.`);
  } catch (error) {
    console.error('Failed to update quiz status:', error);
  }
}

// Function to calculate the difference and set the timeout
function scheduleQuizStatusUpdate(quiz) {
  const currentTime = new Date();
  const endTime = new Date(quiz.endTime);
  const timeDifference = endTime - currentTime;

  // Only schedule if endTime is in the future
  if (timeDifference > 0) {
    setTimeout(() => updateQuizStatus(quiz), timeDifference);
    console.log(`Scheduled status update for quiz ${quiz._id} in ${timeDifference}ms.`);
  } else {
    console.log(`Quiz ${quiz._id} endTime has already passed.`);
  }
}

// Cron job to check active quizzes every minute
cron.schedule('0 * * * *', async () => {
  console.log('Checking quizzes for scheduling status updates...');

  try {
    // Find all active quizzes with endTime in the future
    const activeQuizzes = await Quiz.find({ status: true, endTime: { $gt: new Date() } });

    // Schedule status update for each active quiz
    activeQuizzes.forEach(scheduleQuizStatusUpdate);
  } catch (error) {
    console.error('Error checking quizzes:', error);
  }
});