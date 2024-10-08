
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate } = require('../utils/authenticateUser');

// Get all quizzes
router.get('/',authenticate, quizController.getQuizzes);
// create quiz question
router.post('/', authenticate, quizController.createQuiz);
// take quiz and store users and quiz info
router.post('/takeQuiz',authenticate, quizController.takeQuizzes);
// Get all quiz by RoomId
router.get('/rid=:roomId',authenticate, quizController.getQuizByRoomId);
//update Quiz by _id
router.put('/:id',authenticate, quizController.updateQuiz);
// Delete a quiz by ID
router.delete('/:id',authenticate, quizController.deleteQuiz);
//Update quiz row
router.put('/updateQuizRow/:id',authenticate, quizController.updateQuizRow)
module.exports = router;