const express = require('express');
const checkAuth = require('../middleware/check-auth')

const bladeController = require('../controllers/blade-controller')

const router = express.Router();

router.get('/get', bladeController.getBlades);
router.post('/create', checkAuth, bladeController.createBlade);

module.exports = router;
