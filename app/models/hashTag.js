// hashtag.js
const mongoose = require("mongoose");

const hashtagSchema = new mongoose.Schema({
  hashtagTitle: {
    type: String,
    required: true,
    unique: true,
  },
  //Active or inactive hashTag
  hashtagStatus: {
    type: Boolean,
    default: false,
  },
  roomId: {
    type: String,
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: [],
  },
  sender: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  msgId: {
    type: String,
    required: true,
  },
  messages: [
    {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  ],
});

const HashTag = mongoose.model("HashTag", hashtagSchema);

module.exports = HashTag;
