const mongoose = require('mongoose');
const User = require('./user');

// User details schema to store inside click and watch arrays
const userDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Assuming user details are referenced by their ID
    ref: User, // Reference to the User model (adjust as per your model)
    required: true
  },
  actionTime: {
    type: Date,
    default: Date.now // Store when the user clicked or watched the ad
  }
});

const advertisementSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true // Ensure that an image URL is required
  },
  name: {
    type: String,
    required: true // Ensure that the ad has a name
  },
  description: {
    type: String,
    required: true // Ensure that the ad has a description
  },
  click: {
    type: [userDetailSchema], // Array of user details for clicks
    default: []
  },
  watch: {
    type: [userDetailSchema], // Array of user details for watched advertisements
    default: []
  },
  endTime: {
    type: Date, // When the advertisement ends
    required: true
  },
  status: {
    type: Boolean, // Status of the advertisement (active/inactive)
    default: true // Default to active
  },
  isDeleted: {
    type: Boolean,
    default: false // Track soft deletion
  }
});

const Advertisement = mongoose.model('Advertisement', advertisementSchema);

module.exports = Advertisement;
