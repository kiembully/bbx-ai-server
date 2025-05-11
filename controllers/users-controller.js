const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const HttpError = require('../models/http-error')
const User = require('../models/user');

// helpers
const generateReferralCode = require('../helpers/referral-helper')

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL,
    pass: process.env.GMAIL_PASSWORD,
  }
})

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password')
  } catch (err) {
    const error = new HttpError('Unable to get users, please try again later.', 500)
    return next(error);
  }

  res.status(200).json({users: users.map(user => user.toObject({ getters: true }))})
};

const getUserById = async (req, res, next) => {
  const userId = req.params.uid

  let user;
  try {
    user = await User.findById(userId)
  } catch (err) {
    console.log(err)
    const error = new HttpError('Something went wrong, could not find user.', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find a user for the provided id.', 404);
    return next(error);
  }

  res.status(201).json(
    {
      message: 'Success!',
      user: {
        id: user.toObject({ getters: true }).id,
        name: user.toObject({ getters: true }).name,
        email: user.toObject({ getters: true }).email,
        userType: user.toObject({ getters: true }).userType,
        orders: user.toObject({ getters: true }).orders,
        assignedOrders: user.toObject({ getters: true }).assignedOrders,
        verification: user.toObject({ getters: true }).verification,
        referralCode: user.toObject({ getters: true }).referralCode
      }
    }
  )
};

const getUsersByUserType = async (req, res, next) => {
  const userId = req.params.uid
  
  let users;
  try {
    users = await User.find({ userType: userId }, '-password');
  } catch (err) {
    const error = new HttpError('Unable to get users, please try again later.', 500);
    return next(error);
  }

  res.status(200).json({ users: users.map(user => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid inputs passed, please check your data.', 422)
    return next(error);
  }
  
  const {
    firstname,
    lastname,
    email,
    password,
    type,
    datejoined,
    // lastloggedin,
    // verification,
  } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again later.', 500);
    return next(error)
  }

  if (existingUser) {
    const error = new HttpError('User exists already, please login instead.', 422);
    return next(error)
  }

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash(password, 12)
  } catch (err) {
    const error = new HttpError('Could not create user, please try again later.', 500);
    return next(error)
  }

  const firstTwoLetters = firstname.slice(0, 1).toUpperCase() + lastname.slice(0, 1).toUpperCase()
  const fourRandomNumbers = Math.floor(1000 + Math.random() * 9000).toString()
  const code = `${firstTwoLetters}${fourRandomNumbers}`
  const newVerification = {
    token: Math.floor(100000 + Math.random() * 900000),
    verified: false
  }
  
  const createdUser = new User({
    firstname,
    lastname,
    email,
    password: hashedPassword,
    type,
    orders: [],
    datejoined,
    lastloggedin: datejoined,
    verification: newVerification,
    referralcode: code.toLowerCase(),
    referrals: [],
  })

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again later.', 500);
    return next(error)
  }

  let token
  try {
    token = jwt.sign(
      {
        id: createdUser.id,
        email: createdUser.email,
        firstname: createdUser.firstname,
        lastname: createdUser.lastname,
        verification: createdUser.verification
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '8h' }
    )
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again later.', 500);
    return next(error)
  }

  res.status(201).json(
    {
      message: 'Success!',
      status: 'ok',
      user: {
        // id: createdUser.toObject({ getters: true }).id,
        token: token
      }
    }
  )

  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Email Verification',
    text: `Click the following link to verify your email: ${process.env.PROD_URL}/email-verification?id=${createdUser.id}&token=${createdUser.verification.token}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
      return new HttpError('Error sending verification email!', 500);
    }
    res.status(201).json(
      {
        message: 'Success!',
        user: {
          id: createdUser.toObject({ getters: true }).id,
          firstname: createdUser.toObject({ getters: true }).firstname,
          lastname: createdUser.toObject({ getters: true }).lastname,
          email: createdUser.toObject({ getters: true }).email,
          verification: createdUser.toObject({ getters: true }).verification,
        }
      }
    )
  });
};

const forgot = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid inputs passed, please check your data.', 422);
    return next(error);
  }

  const { email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Password recovery failed, please try again later.', 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError('Email not found in our records. Please try again.', 422);
    return next(error);
  }

  let hashedPassword
  try {
    hashedPassword = await bcrypt.hash('qwe123!@#', 12)
  } catch (err) {
    const error = new HttpError('Could not create user, please try again later.', 500);
    return next(error)
  }

  // Update the user's password
  try {
    existingUser.password = hashedPassword; // Ideally, you should hash the password before saving
    await existingUser.save();
  } catch (err) {
    const error = new HttpError('Updating password failed, please try again later.', 500);
    return next(error);
  }

  // Define the mail options
  const mailOptions = {
    from: process.env.GMAIL,
    to: email,
    subject: 'Password Reset',
    text: `Your new password is: qwe123!@#`,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
      const emailError = new HttpError('Error sending verification email!', 500);
      return next(emailError);
    }

    // Only send the response once the email is successfully sent
    res.status(200).json({
      message: 'Success! Password reset instructions have been sent to your email.',
      status: 'ok',
    });
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError('Logging in failed, please try again later.', 500);
    return next(error)
  }

  if (!existingUser) {
    const error = new HttpError('Invalid credentials.', 401)
    return next(error);
  }

  let isValidPassword = false
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password)
  } catch (err) {
    const error = new HttpError('Could not log you in, please check your credentials and try again.', 500)
    return next(error)
  }

  if (!isValidPassword) {
    const error = new HttpError('Invalid credentials.', 401)
    return next(error);
  }

  let token
  try {
    token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
        type: existingUser.userType,
        // orders: existingUser.orders,
        verification: existingUser.verification
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '8h' }
    )
  } catch (err) {
    const error = new HttpError('Logging in failed, please try again later.', 500);
    return next(error)
  }

  // Update lastLoggedIn field
  try {
    await User.findOneAndUpdate({ email: email }, { $set: { lastLoggedIn: new Date() } });
  } catch (err) {
    const error = new HttpError('Error updating lastLoggedIn.', 500);
    return next(error);
  }

  res.status(200).json(
    {
      message: 'Logged in!',
      status: 'ok',
      user: {
        // id: existingUser.toObject({ getters: true }).id,
        token: token
      }
    }
  )
};

const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError('Invalid inputs passed, please check your data.', 422)
  }

  const {
    name,
    email,
    password,
    userType
    
  } = req.body;
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('Something went wrong, could not update user.', 500);
    return next(error)
  }
  
  user.name = name,
  user.email = email,
  user.password = password,
  user.userType = userType

  try {
    await user.save();
  } catch (err) {
    console.log(err)
    const error = new HttpError('Updating order failed, please try again.', 500);
    return next(error);
  }

  res.status(200).json({
    order: order.toObject({ getters:true }),
    message: 'User successfully updated.'
  });
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  let existingUser;
  try {
    existingUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('Unable to delete users, please try again later.', 500);
    return next(error)
  }

  try {
    await existingUser.deleteOne();
  } catch (err) {
    const error = new HttpError('Unable to delete user could not delete order.', 500);
    return next(error);
  }

  res.status(200).json({message: 'User Deleted.'})
};

const verifyUser = async (req, res, next) => {
  const idFromBody = req.body.id;
  const tokenFromBody = req.body.token;
  
  let existingUser;
  try {
    existingUser = await User.findById(idFromBody)
  } catch (err) {
    const error = new HttpError('Unable to verfiy user, please try again later.', 500);
    return next(error)
  }
  
  if (!existingUser) {
    const error = new HttpError('User not found!', 404);
    return next(error)
  }

  if (existingUser.verification.token !== tokenFromBody) {
    const error = new HttpError('Invalid verification token!', 404);
    return next(error)
  }

  existingUser.verification.token = '';
  existingUser.verification.verified = true;
  
  try {
    await existingUser.save();
  } catch (err) {
    console.log(err)
    const error = new HttpError('Updating order failed, please try again.', 500);
    return next(error);
  }

  let token
  try {
    token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
        verification: existingUser.verification
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '8h' }
    )
  } catch (err) {
    const error = new HttpError('Verifying email failed, please try again later.', 500);
    return next(error)
  }

  res.status(200).json(
    {
      status: 'ok',
      message: 'Email verification success!',
      user: {
        token: token
      }
    }
  )
}

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUsersByUserType = getUsersByUserType;
exports.signup = signup;
exports.login = login;
exports.forgot = forgot;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.verifyUser = verifyUser;