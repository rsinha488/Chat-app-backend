// eventSchema.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    default: {},
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  url: {
    type: String,
  },
  endTime: {
    type: Date,
    default: "",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  messages: [
    {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  ],
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
