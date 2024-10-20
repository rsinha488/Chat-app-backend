const mongoose = require('mongoose');
const User = require('./user');
const moment = require('moment')

// User details schema to store inside click and watch arrays
const userDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference the User model by ID
    ref: User,
    required: true,
  },
  actionTime: {
    type: String,
    default: new moment(new Date()), // Store the action time
  },
});

// Slot details schema to embed inside the selectedSlots array
const slotDetailSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId, // Reference the Slot model by ID
    required: true,
  },
  name: {
    type: String,
    required: true, 
  },
});

const advertisementSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true, // Ensure that an image URL is required
  },
  name: {
    type: String,
    required: true, // Ensure that the ad has a name
  },
  description: {
    type: String,
    required: true, // Ensure that the ad has a description
  },
  click: {
    type: [userDetailSchema], // Array of user details for clicks
    default: [],
  },
  watch: {
    type: [userDetailSchema], // Array of user details for watched advertisements
    default: [],
  },
  endTime: {
    type: String, // When the advertisement ends
  },
  status: {
    type: Boolean, // Status of the advertisement (active/inactive)
    default: true, // Default to active
  },
  selectedSlots: {
    type: [slotDetailSchema], // Embedding slot objects with _id and name
    default: [], // Default to an empty array
  },
  isDeleted: {
    type: Boolean,
    default: false, // Track soft deletion
  },
});

// Middleware to update status if the end time has passed
advertisementSchema.pre('save', function (next) {
  if (this.endTime && this.endTime < Date.now()) {
    this.status = false;
  }
  next();
});

advertisementSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const endTime = update.endTime || this.getQuery().endTime;

  if (endTime && endTime < Date.now()) {
    this.getUpdate().status = false;
  }
  next();
});
// // Middleware to update status if end time has passed on find
// advertisementSchema.pre('find', async function (next) {
//   const docs = await this.model.find(this.getQuery());

//   const currentTime = Date.now();
//   docs.forEach(async (doc) => {
//     if (doc.endTime && doc.endTime < currentTime && doc.status === true) {
//       // Update the status in the database if the endTime has passed
//       await this.model.updateOne({ _id: doc._id }, { status: false });
//     }
//   });

//   next();
// });



const Advertisement = mongoose.model('Advertisement', advertisementSchema);

module.exports = Advertisement;
