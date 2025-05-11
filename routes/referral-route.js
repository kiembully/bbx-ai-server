const express = require('express');
const { check } = require('express-validator');

const referralController = require('../controllers/referrals-controller')
const router = express.Router();

router.get('/:referralCode', referralController.getUsersWithReferralCode);


module.exports = router;