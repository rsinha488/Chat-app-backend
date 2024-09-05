// user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  password: {
    type: String
  },
  image: {
    type: String
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
