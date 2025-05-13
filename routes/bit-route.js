const express = require('express');
const bitController = require('../controllers/bit-controller');
const checkAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/get', bitController.getBits);
router.post('/create', checkAuth, bitController.addBit);
router.patch(
  '/edit/:id',
  checkAuth,
  fileUpload.single('image'),
  bitController.editBit
);


module.exports = router;
