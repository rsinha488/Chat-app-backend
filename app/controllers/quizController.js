// quizController.js
const Quiz = require("../models/quiz");
const User = require("../models/user");
//create quiz question
exports.createQuiz = async (req, res) => {
  try {
    const { question, options, roomId } = req.body;

    // Check if at least two options are provided
    if (options.length < 2) {
      return res
        .status(400)
        .json({ success:false,error: "At least two options are required." });
    }

    const quiz = new Quiz({
      question,
      options,
      roomId,
    });

    await quiz.save();
    res.status(201).json({success:true,data:quiz});
  } catch (error) {
    res.status(500).json({success:false, error: error.message });
  }
};
// Get all quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json({success:true,data:quizzes});
  } catch (error) {
    res.status(500).json({success:false, error: error.message });
  }
};
// Update a quiz by ID
exports.updateQuiz = async (req, res) => {
    try {
        const { question, options, roomId } = req.body;
    
        // Check if at least two options are provided
        if (options.length < 2) {
          return res.status(400).json({ success:false,error: 'At least two options are required.' });
        }
    
        const quiz = await Quiz.findByIdAndUpdate(
          req.params.id,
          { question, options, roomId },
          { new: true, runValidators: true }
        );
    
        if (!quiz) return res.status(404).json({success:false, error: 'Quiz not found' });
        res.status(200).json({success:true,data:quiz});
      } catch (error) {
        res.status(500).json({success:false, error: error.message });
      }
};
// Delete a quiz by ID
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({success:false, error: 'Quiz not found' });
        res.status(200).json({ success:true,message: 'Quiz deleted successfully' });
      } catch (error) {
        res.status(500).json({ success:false,error: error.message });
      }
};
// Get all quiz by RoomId
exports.getQuizByRoomId = async (req, res) => {
  try {
    const quiz = await Quiz.find({ roomId: req.params.roomId });
    if (!quiz) return res.status(404).json({success:false, error: "This room has no Quiz yet!" });
    res.status(200).json({success:true,data:quiz});
  } catch (error) {
    res.status(500).json({success:false, error: error.message });
  }
};

// take quiz
exports.takeQuizzes=async(req,res)=>{
  try {
    const { userId, roomId, quizId, optionsSelected } = req.body;

    if (!userId || !roomId || !quizId || optionsSelected === undefined) {
      return res.status(400).json({ success:false,message: "Invalid input" });
    }

    // Fetch the quiz by quizId and roomId
    const quiz = await Quiz.findOne({ _id: quizId, roomId });

    if (!quiz) {
      return res.status(404).json({success:false, message: "Quiz not found" });
    }

    // Check if user has already answered this quiz
    const userAnswerIndex = quiz.totalUserAnsweredDetail.findIndex(
      (detail) => detail.userId.toString() === userId
    );

    if (userAnswerIndex !== -1) {
      return res.status(400).json({ success:false,message: "User has already answered this quiz" });
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

    res.status(200).json({ success:true,message: "Answer submitted successfully" });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ success:false, message: "Server error" });
  } 
}