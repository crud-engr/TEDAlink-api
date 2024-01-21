const express = require('express');
const ParentController = require('../controller/controller');

const router = express.Router();

router.post('/auth/send-otp', ParentController.sendOTP);
router.post('/auth/verify-otp', ParentController.verifyOTP);
router.post('/auth/signup', ParentController.signup);
router.post('/auth/login', ParentController.login);
router.post('/auth/initiate-password-reset', ParentController.initiatePasswordReset);
router.patch('/auth/set-new-password', ParentController.setNewPassword);

module.exports = router;
