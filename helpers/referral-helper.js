const User = require('../models/user');

const generateReferralCode = (name) => {
  const firstTwoLetters = name.slice(0, 2).toUpperCase()
  const fourRandomNumbers = Math.floor(1000 + Math.random() * 9000).toString()
  const referralCode = `${firstTwoLetters}${fourRandomNumbers}`
  return referralCode.toLowerCase()
}

const updateReferredUserOrders = async (coupon, orderId, session) => {
  if (coupon) {
    const referrer = await User.findOne({ referralCode: coupon.toLowerCase() }, '-password');

    if (referrer) {
      referrer.referredOrders.push(orderId);
      await referrer.save({ session });
    }
  }
};

module.exports = generateReferralCode
module.exports = updateReferredUserOrders