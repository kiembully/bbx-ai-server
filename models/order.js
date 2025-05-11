const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for the payment details
const paymentSchema = new Schema({
  method: { type: String, enum: ["partial", "full"], required: true },
  bill: { type: Number, required: true },
  balance: { type: Number, required: true },
  email: { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "invoice", "unpaid", "validating" ,"partial", "paid", "refunded", "disputed"],
    required: true,
  },
  datestamp: { type: Date, required: true },
  tid: { type: String, default: "" },
  invoiceurl: { type: String, default: "" },
  bank: { type: String, default: "" },
});

// Define the schema for the state details
const stateSchema = new Schema({
  status: {
    type: String,
    enum: ["draft", "open", "inprogress", "completed", "cancelled", "revision"],
    required: true,
  }, writer: { type: String, default: "" },
  datestamp: { type: Date, required: true },
});

const fileSchema = new Schema({
  originalName: { type: String },
  path: { type: String },
});

// Define the main schema
const orderSchema = new Schema({
  uid: { type: String, default: "" },
  oid: { type: String, default: "" },
  servicetype: { type: String, required: true },
  level: { type: String, required: true },
  papertype: { type: String, required: true },
  subject: { type: String, required: true },
  spacing: { type: String, required: true },
  format: { type: String, required: true },
  pagenumber: { type: Number, required: true },
  timezone: { type: String, required: true },
  deadline: { type: Date, required: true },
  details: { type: String, required: true },
  source: { type: Number, required: true },
  clientfiles: [fileSchema],
  speakersnote: { type: Number, default: 0 },
  chartnumber: { type: Number, default: 0 },
  optionalChoices: { type: [String], default: [] },
  payment: [paymentSchema],
  gross: { type: Number, required: true },
  net: { type: Number, required: true },
  state: [stateSchema],
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

// const mongoose = require('mongoose');

// const Schema = mongoose.Schema;

// const orderSchema = new Schema({
//   orderID: { type: String },
//   typeOfService: { type: String, required: true },
//   otherTypeOfService: { type: String },
//   subject: { type: String, required: true },
//   totalPage: { type: Number, required: true },
//   topic: { type: String, required: true },
//   details: { type: String, required: true },
//   sources: { type: Number, required: true },
//   academicLevel: { type: Number, required: true },
//   formatStyle: { type: Number, required: true },
//   paperType: { type: Number, required: true },
//   spacing: { type: Number, required: true },
//   otherSpacing: { type: String },
//   optionalNeeds: {
//     chart: { type: Boolean, required: true },
//     plagiarism: { type: Boolean, required: true },
//     abstract: { type: Boolean, required: true }
//   },
//   clientFiles: [
//     {
//       originalName: { type: String },
//       path: { type: String },
//     }
//   ],
//   writerFiles: [
//     {
//       originalName: { type: String },
//       path: { type: String },
//     }
//   ],
//   totalChart: { type: Number, required: true },
//   timezone: { type: Number, required: true },
//   deadline: { type: String, required: true },
//   deadlineInPh: { type: String, required: true },
//   orderStatus: { type: String, required: true },
//   writer: { type: String },
//   isFullyPaid: { type: Boolean, required: true },
//   discount: { type: Number },
//   coupon: { type: String },
//   price: { type: Number, required: true },
//   discountedPrice: { type: Number, required: true },
//   paymentDiscount: { type: Number },
//   creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
//   transactionLog: [
//     {
//       timestamp: { type: String },
//       action: { type: String },
//       status: { type: String },
//       paymentStatus: { type: Boolean },
//       writer: { type: String },
//       price: { type: Number },
//       operatedBy: { type: String }
//     }
//   ],
//   paymentDetails: [
//     {
//       timestamp: { type: String },
//       orderId: { type: String },
//       transactionId: { type: String },
//       bank: { type: String },
//       paymentType: { type: Number },
//       amount: { type: Number },
//       balance: { type: Number },
//       invoiceUrl: { type: String },
//       paymentStatus: { type: Number }
//     }
//   ],
//   invoiceAddress: { type: String }
// })

// module.exports = mongoose.model('Order', orderSchema);
