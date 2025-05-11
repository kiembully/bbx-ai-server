const express = require('express');
const { check } = require('express-validator');

const emailController = require('../controllers/emails-controller')
const { addToWaitlist } = require("../controllers/emails-controller");

const router = express.Router();


router.post('/invoice', emailController.sendInvoice)

router.post('/verifycode', emailController.sendVerification);

router.post('/contactus', emailController.sendMessegeViaContactUs)

router.post("/waitlist", addToWaitlist);

module.exports = router;