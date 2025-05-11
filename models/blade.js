const mongoose = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const bladeSchema = new Schema({
  Name: { type: String, required: true },
  Spin: { type: String, required: true },
  Series: { type: String, required: true },
  Type: { type: String, required: true },
  Attack: { type: String, required: true },
  Defense: { type: String, required: true },
  Stamina: { type: String, required: true },
  Weight: { type: String, required: true },
});

// bladeSchema.plugin(uniqueValidator);
module.exports = mongoose.model('Blade', bladeSchema);
