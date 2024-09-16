// room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  messages: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  userCount: {
    type: Number,
    default: 0
  },
  favourite: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: ""
  },
  bgImage: {
    type: String,
    default: ""
  },
  primaryBgColor: {
    type: String,
    default: ""
  },
  primaryTextColor: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  // Add other relevant fields
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
