const express = require('express');
const SchoolOwnerController = require('../controller/schoolOwner');
const auth = require('../middleware');
const SchoolController = require('../controller/school');

const router = express.Router();

router.post('/auth/send-otp', SchoolOwnerController.sendSchoolOwnerOTP);
router.post('/auth/verify-otp', SchoolOwnerController.verifySchoolOwnerOTP);
router.post('/auth/signup', SchoolOwnerController.signup);
router.post('/auth/login', SchoolOwnerController.login);
router.post('/auth/initiate-password-reset', SchoolOwnerController.initiatePasswordReset);
router.patch('/auth/set-new-password', SchoolOwnerController.setNewPassword);

router.post('/schools', auth, SchoolController.createSchool);
router.get('/schools', auth, SchoolController.getSchools);
router.get('/school/:schoolId', auth, SchoolController.getSchool);
router.patch('/school/:schoolId', auth, SchoolController.updateSchool);
router.delete('/school/:schoolId', auth, SchoolController.deleteSchool);

module.exports = router;
