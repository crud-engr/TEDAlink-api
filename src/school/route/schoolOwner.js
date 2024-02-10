const express = require('express');
const SchoolOwnerController = require('../controller/schoolOwner');
const auth = require('../middleware');
const SchoolController = require('../controller/school');

const router = express.Router();

router.post('/auth/send-otp', SchoolOwnerController.sendSchoolOwnerOTP);
router.post('/auth/verify-otp', SchoolOwnerController.verifySchoolOwnerOTP);
router.post('/auth/signup', SchoolOwnerController.signup);
router.post('/auth/login', SchoolOwnerController.login);
router.post(
  '/auth/initiate-password-reset',
  SchoolOwnerController.initiatePasswordReset,
);
router.patch('/auth/set-new-password', SchoolOwnerController.setNewPassword);

router.get('/schools/enquiries', auth, SchoolOwnerController.getEnquiries);
router.get('/schools/admissions', auth, SchoolOwnerController.getAdmissions);
router.post('/schools', auth, SchoolController.createSchool);
router.get('/schools', auth, SchoolController.getSchools);
router.get('/schools/:schoolId', auth, SchoolController.getSchool);
router.get('/schools/:schoolId/reviews', auth, SchoolOwnerController.getReviews);
router.patch('/schools/:schoolId', auth, SchoolController.updateSchool);
router.delete('/schools/:schoolId', auth, SchoolController.deleteSchool);

module.exports = router;
