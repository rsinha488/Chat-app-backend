const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({

  status: { type: Boolean, required: true, default: false },
  completed: { type: Boolean, required: true, default: false }, //quiz  completed or not
  question: {
    type: String,
    required: true,
    trim: true,
  },
  endTime: { type: String, default: "" },
  bgImage: { type: String, default: "" },
  options: {
    type: [
      {
        text: { type: String, required: true },
        bgColor: { type: String },
        textColor: { type: String },
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
  room: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    bgColor: {
      type: String,
    },
    bgImage: {
      type: String,
    },
    textColor: {
      type: String,
    },
  },
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
