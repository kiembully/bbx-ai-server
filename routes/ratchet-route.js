const express = require('express');
const ratchetController = require('../controllers/ratchet-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/get', ratchetController.getRatchets);
router.post('/create', checkAuth, ratchetController.addRatchet);

module.exports = router;
