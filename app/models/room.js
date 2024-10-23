// room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  messages: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  fontFamily: {
    // type: mongoose.Schema.Types.Mixed,
    // default: {}
    type: mongoose.Schema.Types.ObjectId,  // Reference to User's _id
    // ref: 'Theme'
  },
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
