const HttpError = require('../models/http-error');
const User = require('../models/user');
const Order = require('../models/order');

const getUsersWithReferralCode = async (req, res, next) => {
  const { coupon, id } = req.query;

  let referrer;
  let referred;
  try {
    referrer = await User.find({ referralCode: coupon.toLowerCase() }, '-password');
    referred = await User.findById(id)
  } catch (err) {
    console.log(err);
    const error = new HttpError('Unable to get users, please try again later.', 500);
    return next(error);
  }

  if (referrer.length === 0) {
    const error = new HttpError('Invalid referral code. No user has the following code.', 404);
    return next(error);
  }

  const foundUser = referrer[0];

  if (id && foundUser._id.toString() === id) {
    const error = new HttpError('Invalid referral code. Cannot refer yourself.', 400);
    return next(error);
  }

  try {
    // Fetch order details for each order in referred.orders
    const draftOrders = await Promise.all(
      referred.orders.map(async (orderId) => {
        const order = await Order.findById(orderId);
        return order;
      })
    );

    // Filter out null values from draftOrders
    const validDraftOrders = draftOrders.filter((order) => order !== null);

    // Check if any order in validDraftOrders has orderStatus with value 'draft'
    if (validDraftOrders.some((order) => order.orderStatus !== 'draft') && referred.orders.length > 0) {
      const error = new HttpError('This code is for first time order only. Referral code not valid.', 400);
      return next(error);
    }
  } catch (err) {
    console.log(err);
    const error = new HttpError('Error applying referral code, please try again later.', 500);
    return next(error);
  }

  res.status(200).json({
    message: 'Valid referral code applied',
    referral: {
      valid: true,
      couponCode: foundUser.referralCode,
      referrerId: foundUser._id
    }
  });
};

exports.getUsersWithReferralCode = getUsersWithReferralCode;
