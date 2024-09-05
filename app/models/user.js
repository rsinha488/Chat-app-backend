// user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  password: {
    type: String
  },
  image: {
    type: String
  },
  quizzesTaken: [
    {
      roomId: {
        type: String,
        required: true,
      },
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
      },
      selectedOption: {
        type: String,
        required: true,
      },
    },
  ],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
