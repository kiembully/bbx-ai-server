// models/waitlist.js

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const waitlistSchema = new Schema({
  email: { type: String, required: true, unique: true },
  dateJoined: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Waitlist", waitlistSchema);
