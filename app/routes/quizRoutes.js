
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Get all quizzes
router.get('/',quizController.getQuizzes);
// create quiz question
router.post('/', quizController.createQuiz);
// take quiz and store users and quiz info
router.post('/takeQuiz',quizController.takeQuizzes);
// Get all quiz by RoomId
router.get('/:roomId',quizController.getQuizByRoomId);
//update Quiz by _id
router.put('/:id',quizController.updateQuiz);
// Delete a quiz by ID
router.delete('/:id',quizController.deleteQuiz);
module.exports = router;