const express = require('express');
const ratchetController = require('../controllers/ratchet-controller');
const checkAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/get', ratchetController.getRatchets);
router.post('/create', checkAuth, ratchetController.addRatchet);
router.patch(
  '/edit/:id',
  checkAuth,
  fileUpload.single('image'),
  ratchetController.editRatchet
);

module.exports = router;
