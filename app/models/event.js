// eventSchema.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    default: {},
    required: true
  },
  description : {
    type: String,
  },
  status : {
    type: Boolean,
    default: false
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
  url : {
    type: String,
  },
  endTime: {
    type:Date,
    default:""
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
