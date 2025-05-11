const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const Order = require("../models/order");
const User = require("../models/user");

const HttpError = require("../models/http-error");
const mongoose = require("mongoose");

const nodemailer = require("nodemailer");
const convertDraftOrder = require("../helpers/order-helper");
const { sendInvoiceEmail } = require("../helpers/email-helper");
// const updateReferredUserOrders = require('../helpers/referral-helper');

const emailContent = (data, email) =>
  `<table><tr><th style=text-align:left>Invoice Email<td style=padding-left:10px>${email}<tr><th style=text-align:left>User ID<td style=padding-left:10px>${data.creator}<tr><th style=text-align:left>Order ID<td style=padding-left:10px>${data.id}<tr><th style=text-align:left>Payment Mode<td style=padding-left:10px>${data.method}<tr><th style=text-align:left>discount<td style=padding-left:10px>${data.discount}<tr><th style=text-align:left>price<td style=padding-left:10px>${data.price}<tr><th style=text-align:left>price after discount<td style=padding-left:10px>${data.discountedPrice}<tr><th style=text-align:left>amount to pay<td style=padding-left:10px>${data.bill}<tr><th style=text-align:left>balance<td style=padding-left:10px>${data.balance}</table>`;

let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

function getFileInfo(files) {
  const fileInfo = files.map((file) => ({
    originalName: file.originalname,
    path: file.path,
  }));

  return fileInfo;
}

function getTransactionLogInfo(logs) {
  const logInfo = logs.map((log) => ({
    timestamp: log.timestamp,
    action: log.action,
    status: log.status,
  }));

  console.log(logInfo);
  return logInfo;
}

const getOrderById = async (req, res, next) => {
  const orderId = req.params.oid;

  let order;
  try {
    order = await Order.findById(orderId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not find such order.",
      500,
    );
    return next(error);
  }

  if (!order) {
    const error = new HttpError(
      "Could not find a order for the provided id.",
      404,
    );
    return next(error);
  }

  res.json({ status: "ok", order: order.toObject({ getters: true }) });
};

const getOrdersByUserId = async (req, res, next) => {
  const userID = req.params.uid;
  let orders;

  try {
    orders = await Order.find({ uid: userID });
  } catch (err) {
    const error = next(
      new HttpError("Fetching orders failed, please try again later.", 404),
    );
    return next(error);
  }

  if (!orders || orders.length === 0) {
    // const error = next(new HttpError('Could not find a orders for the provided id.', 404))
    // return next(error)
    return res.status(404).json({
      status: "error",
      message: "No orders available.",
    });
  }

  res.json({
    status: "ok",
    orders: orders.map((order) => order.toObject({ getters: true })),
  });
};

const getOrdersByWriter = async (req, res, next) => {
  const writerID = req.params.uid;
  let orders;

  try {
    orders = await Order.find({ writer: writerID });
  } catch (err) {
    const error = next(
      new HttpError("Fetching orders failed, please try again later.", 404),
    );
    return next(error);
  }

  if (!orders || orders.length === 0) {
    const error = next(
      new HttpError("Could not find a orders for the provided id.", 404),
    );
    return next(error);
  }

  res.json({
    orders: orders.map((order) => order.toObject({ getters: true })),
  });
};

const getAllOrders = async (req, res, next) => {
  const { orderStatus, writer, creator, oid } = req.query;

  let orders;
  try {
    if (Object.keys(req.query).length > 0) {
      const queryParameters = {};
      if (orderStatus !== undefined) queryParameters.orderStatus = orderStatus;
      // dapat ma utilize din kahit undefined yung writer for open orders ng writers
      if (writer !== undefined) {
        if (writer === "") {
          queryParameters.writer = { $in: [writer, undefined] };
        } else {
          queryParameters.writer = writer;
        }
      }
      if (creator !== undefined) queryParameters.creator = creator;
      if (oid !== undefined) queryParameters.oid = oid;

      orders = await Order.find(queryParameters);
    } else {
      orders = await Order.find();
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Unable to get orders, please try again later.",
      500,
    );
    return next(error);
  }

  res
    .status(200)
    .json({
      status: "ok",
      message: "Order successfully fetched.",
      orders: orders.map((order) => order.toObject({ getters: true }))
    });
};

const createOrder = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const {
    uid,
    servicetype,
    level,
    papertype,
    subject,
    spacing,
    format,
    pagenumber,
    timezone,
    deadline,
    details,
    source,
    speakersnote,
    chartnumber,
    gross,
    net,
  } = req.body;

  const payment = JSON.parse(req.body.payment);
  const state = JSON.parse(req.body.state);
  const optionalChoices = JSON.parse(req.body.optionalChoices);

  let newOrderID;
  try {
    const lastOrder = await Order.findOne({}, {}, { sort: { oid: -1 } }).exec();
    if (lastOrder) {
      const lastOrderID = lastOrder.oid;
      const prefix = "CS"; // You can adjust the prefix based on your logic
      const orderNumber = parseInt(lastOrderID.substring(2)) + 1;
      newOrderID = `${prefix}${orderNumber.toString().padStart(4, "0")}`;
    } else {
      newOrderID = "CS2501";
    }
  } catch (err) {
    const error = new HttpError("Error generating Order ID.", 500);
    return next(error);
  }

  const createdOrder = new Order({
    uid,
    oid: newOrderID,
    servicetype,
    level,
    papertype,
    subject,
    spacing,
    format,
    pagenumber,
    timezone,
    deadline,
    details,
    source,
    clientfiles: getFileInfo(req.files),
    speakersnote,
    chartnumber,
    optionalChoices,
    payment,
    gross,
    net,
    state,
  });

  let user;
  try {
    user = await User.findById(uid);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Creating order failed, please try again.",
      500,
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdOrder.save({ session: sess });
    user.orders.push(createdOrder);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating order failed, please try again.",
      500,
    );
    return next(error);
  }

  // Send a confirmation email if the order status is 'invoice'
  if (createdOrder.payment.some((s) => s.status === "invoice")) {
    const output = emailContent(
      {
        creator: createdOrder.uid,
        id: createdOrder.oid,
        discount: "", // this is where referrals and coupons should go
        price: `$${createdOrder.gross}`,
        discountedPrice: `$${createdOrder.net}`,
        paymentDiscount: `${createdOrder.payment[0].method}`,
        bill: `$${createdOrder.payment[0].bill}`,
        balance: `$${createdOrder.payment[0].balance}`,
      },
      createdOrder.payment[0].email,
    );

    const mailOptions = {
      from: process.env.GMAIL,
      to: `${user.email}, ${process.env.GMAIL}`,
      subject: "Order Confirmation",
      html: output,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Error sending email and creating order" });
      } else {
        res.status(201).json({
          message: "Order successfully created and email sent successfully.",
          order: createdOrder,
        });
      }
    });
  }

  res.status(201).json({
    status: "ok",
    message: "Order successfully created.",
    order: createdOrder,
  });
};

const updateOrder = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const {
    uid,
    oid,
    servicetype,
    level,
    papertype,
    subject,
    spacing,
    format,
    pagenumber,
    timezone,
    deadline,
    details,
    source,
    speakersnote,
    chartnumber,
    optionalChoices,
    gross,
    net,
    state,
    payment,
  } = req.body;
  const incomingState = JSON.parse(state)
  const incomingPayment = JSON.parse(payment)
  const incomingChoices = JSON.parse(optionalChoices)
  const id = req.params.id;

  let order;
  try {
    order = await Order.findById(id);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  (order.uid = uid),
  (order.oid = oid),
  (order.servicetype = servicetype),
  (order.subject = subject),
  (order.pagenumber = pagenumber),
  (order.details = details),
  (order.source = source),
  (order.level = level),
  (order.format = format),
  (order.papertype = papertype),
  (order.spacing = spacing),
  (order.optionalChoices = incomingChoices),
  (order.chartnumber = chartnumber),
  (order.timezone = timezone),
  (order.deadline = deadline),
  (order.speakersnote = speakersnote),
  (order.gross = gross),
  (order.net = net),
  (order.state = order.state.concat(incomingState[0])),
  (order.payment = order.payment.concat(incomingPayment[0])),
    // (order.discount = discount),
    // (order.coupon = coupon),
    // (order.price = price),
    // (order.discountedPrice = discountedPrice),
    // (order.paymentDiscount = paymentDiscount),
    // (order.creator = creator),
    // (order.writer = writer),
    // (order.transactionLog = order.transactionLog.concat(transactionLog)),
    // // order.paymentDetails = order.paymentDetails.concat(paymentDetails,
    // (order.invoiceAddress = invoiceAddress),
  (order.clientFiles = getFileInfo(req.files));

  try {
    await order.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Updating order failed, please try again.",
      500,
    );
    return next(error);
  }

  res.status(200).json({
    status: "ok",
    order: order.toObject({ getters: true }),
    message: "Order successfully updated.",
  });
};

const updateOrderPayment = async (req, res, next) => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  // Extract `oid` from the URL params and new payment data from the request body
  const { oid } = req.params; // Order ID from URL params
  const newPayment = req.body; // New payment details from the request body

  let order;
  try {
    // Find the order by `oid`
    order = await Order.findOne({ oid });
    if (!order) {
      return next(new HttpError("Order not found", 404));
    }
  } catch (err) {
    console.log(err)
    return next(new HttpError("Something went wrong, could not update order.", 500));
  }

  // Update the newPayment balance if status is 'partial' or 'full'
  if (newPayment.status === 'partial') {
    newPayment.balance -= newPayment.bill;
  }
  if (newPayment.status === 'paid') {
    newPayment.balance -= newPayment.bill;
    newPayment.bill -= newPayment.bill;
  }


  try {
    // Append the new payment object to the `payment` array
    order.payment.push(newPayment);

    // Save the updated order
    await order.save();
  } catch (err) {
    console.log(err)
    return next(new HttpError("Updating order payment failed, please try again.", 500));
  }

  // if (newPayment.status === 'full' || newPayment.status === 'partial') {
  //   try {
  //     await sendInvoiceEmail(newPayment.email, oid, newPayment.invoiceurl);
  //   } catch (err) {
  //     console.log(err);
  //     return next(new HttpError("Payment updated, but failed to send email notification.", 500));
  //   }
  // }

  // Respond with the updated order
  res.status(200).json({
    status: "ok",
    order: order.toObject({ getters: true }), // Convert to plain object with `id` getter
    message: "Payment successfully updated.",
  });
};

const updateOrderStatus = async (req, res, next) => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  // Extract `oid` from the URL params and new payment data from the request body
  const { oid } = req.params; // Order ID from URL params
  const newOrderState = req.body; // New payment details from the request body

  let order;
  try {
    // Find the order by `oid`
    order = await Order.findOne({ oid });
    if (!order) {
      return next(new HttpError("Order not found", 404));
    }
  } catch (err) {
    console.log(err)
    return next(new HttpError("Something went wrong, could not update order.", 500));
  }
  try {
    // Append the new payment object to the `payment` array
    order.state.push(newOrderState);

    // Save the updated order
    await order.save();
  } catch (err) {
    console.log(err)
    return next(new HttpError("Updating order status failed, please try again.", 500));
  }

  // if (newPayment.status === 'full' || newPayment.status === 'partial') {
  //   try {
  //     await sendInvoiceEmail(newPayment.email, oid, newPayment.invoiceurl);
  //   } catch (err) {
  //     console.log(err);
  //     return next(new HttpError("Payment updated, but failed to send email notification.", 500));
  //   }
  // }

  // Respond with the updated order
  res.status(200).json({
    status: "ok",
    order: order.toObject({ getters: true }), // Convert to plain object with `id` getter
    message: "Order status successfully updated.",
  });
};

const updateOrderPaymentDetails = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const { paymentDetails, transactionLog, orderStatus } = req.body;
  const orderId = req.params.oid;

  let order;
  try {
    order = await Order.findById(orderId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  (order.orderStatus = orderStatus),
    (order.paymentDetails = order.paymentDetails.concat(paymentDetails)),
    (order.transactionLog = order.transactionLog.concat(transactionLog));

  try {
    await order.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Updating order failed, please try again.",
      500,
    );
    return next(error);
  }

  res.status(200).json({
    order: order.toObject({ getters: true }),
    message: "Order successfully updated.",
  });
};

const updateWriterOrderFiles = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const { writerFiles } = req.body;
  const orderId = req.params.oid;

  let order;
  try {
    order = await Order.findById(orderId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  const newWriterFiles = getFileInfo(req.files);
  order.writerFiles = order.writerFiles.concat(newWriterFiles);

  try {
    await order.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  res.status(200).json({
    order: order.toObject({ getters: true }),
    message: "Order successfully updated.",
  });
};

const updateClientrOrderFiles = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const { clientFiles } = req.body;
  const orderId = req.params.oid;

  let order;
  try {
    order = await Order.findById(orderId);
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  const newClientFiles = getFileInfo(req.files);
  order.clientFiles = order.clientFiles.concat(newClientFiles);

  try {
    await order.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  res.status(200).json({
    order: order.toObject({ getters: true }),
    message: "Order successfully updated.",
  });
};

const updateOrderByAssignedWriter = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed, please check your data.", 422);
  }

  const { writer, transactionLog } = req.body;
  const orderId = req.params.oid;

  let order;
  try {
    order = await Order.findById(orderId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  order.writer = writer;
  order.transactionLog = order.transactionLog.concat(transactionLog);

  let user; // check relation between order and user
  try {
    user = await User.findById(order.writer);
  } catch (err) {
    const error = new HttpError(
      "Creating order failed, please try again.",
      500,
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find Writer for provided id.", 404);
    return next(error);
  }
  // Check if the order is already assigned to the writer
  // prevent duplicate entries of assigned orders to writers
  if (user.assignedOrders.includes(order._id)) {
    const error = new HttpError(
      "Order is already assigned to the writer.",
      422,
    );
    return next(error);
  }

  // get previous writer
  let previousUsers;
  try {
    previousUsers = await User.find({ assignedOrders: order._id }).distinct(
      "_id",
    );
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update order.",
      500,
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    // Remove the order from the assignedOrders of all users
    for (const id of previousUsers) {
      const assignedUser = await User.findById(id);
      if (assignedUser) {
        assignedUser.assignedOrders = assignedUser.assignedOrders.filter(
          (assignedOrderId) =>
            assignedOrderId.toString() !== order._id.toString(),
        );
        await assignedUser.save({ session: sess });
      }
    }
    // Pull out the order._id from assignedOrders of users identified by orderAssignedUserIds
    await User.updateMany(
      { _id: { $in: previousUsers } },
      { $pull: { assignedOrders: order._id } },
      { session: sess },
    );

    await order.save({ session: sess });
    user.assignedOrders.push(order);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      "Updating order failed, please try again.",
      500,
    );
    return next(error);
  }

  res.status(200).json({
    order: order.toObject({ getters: true }),
    message: "Order successfully updated.",
  });
};

const deleteOrder = async (req, res, next) => {
  const orderId = req.params.oid;
  let order;

  try {
    order = await Order.findById(orderId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete order.",
      500,
    );
    return next(error);
  }

  // check if order id exist
  if (!order) {
    const error = new HttpError("Could not find order for this id.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await order.deleteOne({ session: sess });
    order.creator.orders.pull(order);
    await order.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete order.",
      500,
    );
    return next(error);
  }

  res.status(200).json({ message: "order Deleted." });
};

exports.getOrderById = getOrderById;
exports.getOrdersByUserId = getOrdersByUserId;
exports.getOrdersByWriter = getOrdersByWriter;
exports.getAllOrders = getAllOrders;
exports.createOrder = createOrder;
exports.updateOrder = updateOrder;
exports.updateOrderPayment = updateOrderPayment;
exports.updateOrderStatus = updateOrderStatus;
exports.updateOrderPaymentDetails = updateOrderPaymentDetails;
exports.updateOrderByAssignedWriter = updateOrderByAssignedWriter;
exports.deleteOrder = deleteOrder;
exports.updateWriterOrderFiles = updateWriterOrderFiles;
exports.updateClientrOrderFiles = updateClientrOrderFiles;
