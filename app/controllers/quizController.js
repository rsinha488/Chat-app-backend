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
        .json({ error: "At least two options are required." });
    }

    const quiz = new Quiz({
      question,
      options,
      roomId,
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get all quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Update a quiz by ID
exports.updateQuiz = async (req, res) => {
    try {
        const { question, options, roomId } = req.body;
    
        // Check if at least two options are provided
        if (options.length < 2) {
          return res.status(400).json({ error: 'At least two options are required.' });
        }
    
        const quiz = await Quiz.findByIdAndUpdate(
          req.params.id,
          { question, options, roomId },
          { new: true, runValidators: true }
        );
    
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        res.status(200).json(quiz);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};
// Delete a quiz by ID
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
        res.status(200).json({ message: 'Quiz deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};
// Get all quiz by RoomId
exports.getQuizByRoomId = async (req, res) => {
  try {
    const quiz = await Quiz.find({ roomId: req.params.roomId });
    if (!quiz) return res.status(404).json({ error: "This room has no Quiz yet!" });
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// take quiz
exports.takeQuizzes=async(req,res)=>{
    try {
        const { userId, roomId, questionId, selectedOption } = req.body;
    
        // Validate input
        if (!userId || !roomId || !questionId || !selectedOption) {
          return res.status(400).json({ error: 'All fields are required' });
        }
    
        // Find the quiz question to validate the selected option
        const quiz = await Quiz.findById({_id:questionId});
        if (!quiz) {
          return res.status(404).json({ error: 'Quiz question not found' });
        }
    
        // Check if the selected option exists in the quiz options
        const optionExists = quiz.options.some(option => option.text === selectedOption);
        if (!optionExists) {
          return res.status(400).json({ error: 'Invalid option selected' });
        }
    
        // Find the user and update their quizzesTaken array
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        // Add the quiz attempt to the user's quizzesTaken
        user.quizzesTaken.push({
          roomId,
          questionId,
          selectedOption,
        });
    
        // Save the updated user document
        await user.save();
    
        res.status(200).json({ message: 'Quiz response recorded successfully', user });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }   
}