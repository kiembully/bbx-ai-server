const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minLength: 8 },
  type: { type: String, required: true }, // client | writer| admin | superadmin
  orders: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Orders' }],
  datejoined: { type: String },
  lastloggedin: { type: String },
  verification: {
    token: { type: String },
    verified: { type: Boolean }
  },
  referralcode: { type: String },
  referrals: [{ type: mongoose.Types.ObjectId, ref: 'ReferredOrder' }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);