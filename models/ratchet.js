const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ratchetSchema = new Schema({
  Name: { type: String, required: true },
  Attack: { type: String, required: true },
  Defense: { type: String, required: true },
  Stamina: { type: String, required: true },
  Weight: { type: String, required: true },
});

module.exports = mongoose.model('Ratchet', ratchetSchema);
