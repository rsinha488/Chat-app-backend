const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  status: { type: Boolean, required: true, default: false },
  completed:{ type: Boolean, required: true, default: false },//quiz  completed or not 
  question: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: { type: Date },
  options: {
    type: [
      {
        text: { type: String, required: true },
        // isCorrect: { type: Boolean, required: true },
      },
    ],
    validate: [(val) => val.length >= 2, "At least two options are required"],
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
  totalUserAnsweredDetail: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        optionClicked: { type: Number, default: 0 },
      },
    ],
  },
  roomId: {
    type: String,
    required: true,
  },
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
