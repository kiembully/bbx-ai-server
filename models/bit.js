const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bitSchema = new Schema({
  Name: { type: String, required: true },
  Type: { type: String, required: true },
  Attack: { type: String, required: true },
  Defense: { type: String, required: true },
  Stamina: { type: String, required: true },
  Burst: { type: String, required: true },
  Dash: { type: String, required: true },
  Weight: { type: String, required: true }
});

module.exports = mongoose.model('Bit', bitSchema);
