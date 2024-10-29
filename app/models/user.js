// user.js
const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: String,
  image: String,
  message: String,
  _id: mongoose.Schema.Types.ObjectId
});

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  status:{
    type: Boolean,
    default: false //TEMPORARY_BLOCKED, BLOCKED
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
  previousId: {
    type: String
  },
  image: {
    type: String
  },
  isAdmin:{
    type:Boolean,
    default:false
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
  blockedEndTime:{
    type:Date,
    default:""
  },
  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  requests: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      }
    }
  ],
  blockedEndTime: {
    type: String,
    default: ""
  },
  badges:[badgeSchema]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
