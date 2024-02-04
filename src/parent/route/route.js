const express = require('express');
const ParentController = require('../controller/parent.js');
const auth = require('../middleware');

const router = express.Router();

router.post('/auth/send-otp', ParentController.sendOTP);
router.post('/auth/verify-otp', ParentController.verifyOTP);
router.post('/auth/signup', ParentController.signup);
router.post('/auth/login', ParentController.login);
router.post('/auth/initiate-password-reset', ParentController.initiatePasswordReset);
router.patch('/auth/set-new-password', ParentController.setNewPassword);

router.get('/schools', auth, ParentController.getSchools);
router.get('/schools/:schoolId', auth, ParentController.getSchool);
router.post('/schools/:schoolId/enquiry', auth, ParentController.sendSchoolEnquiry);
router.post('/schools/:schoolId/apply-for-admission', auth, ParentController.applyForAdmission);
router.post('/schools/:schoolId/review', auth, ParentController.reviewSchool);
router.post('/schools/:schoolId/like', auth, ParentController.toggleLikeSchool);
router.post('/schools/:schoolId/rate', auth, ParentController.rateSchool);
router.patch('/update-password', auth, ParentController.updatePassword);
router.patch('/update-profile', auth, ParentController.updateProfile);

module.exports = router;
