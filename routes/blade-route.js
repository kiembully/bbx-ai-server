const express = require('express');
const checkAuth = require('../middleware/check-auth')
const fileUpload = require('../middleware/file-upload');

const bladeController = require('../controllers/blade-controller')

const router = express.Router();

router.get('/get', bladeController.getBlades);
router.post(
  '/create',
  checkAuth,
  fileUpload.single('image'),
  bladeController.createBlade
);
router.patch(
  '/edit/:id',
  checkAuth,
  fileUpload.single('image'),
  bladeController.editBlade
);

module.exports = router;
