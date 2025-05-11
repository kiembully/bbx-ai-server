const { validationResult } = require("express-validator");
const User = require("../models/user");
const Waitlist = require("../models/waitlist");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const nodemailer = require("nodemailer");
const HttpError = require("../models/http-error");

const emailContent = (data, email) =>
  `<table><tr><th style=text-align:left>Invoice Email<td style=padding-left:10px>${email}<tr><th style=text-align:left>User ID<td style=padding-left:10px>${data.creator}<tr><th style=text-align:left>Order ID<td style=padding-left:10px>${data.id}<tr><th style=text-align:left>Payment Mode<td style=padding-left:10px>${data.paymentMethod}<tr><th style=text-align:left>discount<td style=padding-left:10px>${data.discount}<tr><th style=text-align:left>price<td style=padding-left:10px>${data.price}<tr><th style=text-align:left>price after discount<td style=padding-left:10px>${data.discountedPrice}<tr><th style=text-align:left>amount to pay<td style=padding-left:10px>${data.bill}<tr><th style=text-align:left>balance<td style=padding-left:10px>${data.balance}</table>`;
const contactusContent = (data, from) =>
  `<h2>Via Contact Us</h2><p><strong>First Name:</strong> ${data.firstname}<p><strong>Last Name:</strong> ${data.lastname}<p><strong>Email:</strong> ${from}<p><strong>Message:</strong> ${data.message}.`;
const waitlistContent = (email) =>
  `<h2>New Client Joined the Waitlist</h2>
  <p><strong>Email:</strong> ${email}</p>`

let transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendInvoice = async (req, res, next) => {
  const {
    creator,
    id,
    discount,
    price,
    discountedPrice,
    paymentMethod,
    bill,
    balance,
    email,
  } = req.body;

  const output = emailContent(
    {
      creator,
      id,
      discount,
      price,
      discountedPrice,
      paymentMethod,
      bill,
      balance,
      email,
    },
    email
  );

  const mailOptions = {
    from: email,
    to: process.env.GMAIL,
    subject: "Client Requesting Invoice",
    html: output,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({
        status: "error",
        message: "Error requesting PayPal invoice. Please try again later.",
      });
    } else {
      res.json({ status: "ok", message: "Email sent successfully" });
    }
  });
};

const sendMessegeViaContactUs = async (req, res, next) => {
  const { from, data } = req.body;

  const output = contactusContent(data, from);

  const mailOptions = {
    from,
    to: "support@cleversally.com",
    subject: "Service Inquiry - Contact Us",
    html: output,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).json({ message: "Error sending email" });
    } else {
      res.json({ message: "Email sent successfully" });
    }
  });
};

// Route to send verification email
const sendVerification = async (req, res, next) => {
  const { email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Unable to access users, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("User not found!", 404);
    return next(error);
  }

  const verificationToken = Math.floor(100000 + Math.random() * 900000);

  existingUser.verification.token = verificationToken;
  existingUser.verification.verified = false;

  try {
    await existingUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong, please try again.", 500);
    return next(error);
  }

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: "Email Verification",
    text: `Click the following link to verify your email: ${process.env.PROD_URL}/email-verification?id=${existingUser.id}&token=${verificationToken}`,
  };

  let token;
  try {
    token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
        verification: existingUser.verification,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "8h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Verifying email failed, please try again later.",
      500
    );
    return next(error);
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return new HttpError("Error sending verification email!", 500);
    }

    // res.status(200).send('Verification email sent');// Send a single response after the email has been sent
    res.status(200).json({
      status: "ok",
      message: "Email verification code sent!",
      user: {
        token: token,
      },
    });
  });
};

const addToWaitlist = async (req, res, next) => {
  const { email } = req.body;

  // Check if email already exists in the waitlist
  let existingWaitlistEntry;
  try {
    existingWaitlistEntry = await Waitlist.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Unable to access waitlist, please try again later.",
      500
    );
    return next(error);
  }

  if (existingWaitlistEntry) {
    const error = new HttpError("Email already on the waitlist.", 400);
    return next(error);
  }

  // Add new email to the waitlist
  const newWaitlistEntry = new Waitlist({ email });

  try {
    await newWaitlistEntry.save();
  } catch (err) {
    const error = new HttpError(
      "Failed to add email to the waitlist, please try again.",
      500
    );
    return next(error);
  }

  // Send email notification to customer service
  const output = waitlistContent(email);

  const mailOptions = {
    from: process.env.GMAIL,
    to: "cs.cleversally@gmail.com",
    subject: "New Client Joined Waitlist",
    html: output,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending waitlist notification email:", error);
      return res.status(500).json({
        status: "error",
        message: "Error sending waitlist notification email.",
      });
    } else {
      res.json({ status: "ok", message: "Email added to waitlist and notification sent." });
    }
  });
};

exports.sendInvoice = sendInvoice;
exports.sendVerification = sendVerification;
exports.sendMessegeViaContactUs = sendMessegeViaContactUs;
exports.addToWaitlist = addToWaitlist;
