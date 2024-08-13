// room.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: {
    type: String,
    default: {},
    required: true
  },
  episode: {
    type:  mongoose.Schema.Types.Mixed,
    default: {},
    required: true
  },
  message : {
    type: String,
    required: true
  },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
