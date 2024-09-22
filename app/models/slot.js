const mongoose = require("mongoose");

// Slot Schema
const slotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const Slot = mongoose.model("Slot", slotSchema);

module.exports = Slot;
