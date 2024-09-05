const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [
      {
        text: { type: String, required: true },
        // isCorrect: { type: Boolean, required: true },
      },
    ],
    validate: [(val) => val.length >= 2, 'At least two options are required'],
  },
  optionsClickedByUsers: {
    type: Map,
    of: Number,
    default: {},
  },
  totalUserAnswered: {
    type: Number,
    default: 0,
  },
  roomId: {
    type: String,
    required: true,
  },
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
