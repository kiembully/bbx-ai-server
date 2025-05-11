const express = require('express');
const bitController = require('../controllers/bit-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/get', bitController.getBits);
router.post('/create', checkAuth, bitController.addBit);

module.exports = router;
