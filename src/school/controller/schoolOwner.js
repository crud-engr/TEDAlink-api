const Validator = require('validatorjs');
const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

const Otp = require('../model/SchoolOwnerOtp');
const Util = require('../../common/utils/util');
const SchoolOwnerOtp = require('../model/SchoolOwnerOtp');
const SchoolOwner = require('../model/SchoolOwner');
const { isValidObjectId } = require('mongoose');
const School = require('../model/School');
const Enquiry = require('../../parent/model/Enquiry');
const Admission = require('../../parent/model/Admission');
const SchoolReview = require('../model/SchoolReviews');
const { uploadToCloudinary } = require('../../common/upload');

class SchoolOwnerController {
  async signup(req, res) {
    try {
      const rules = {
        email: 'required|email',
        firstName: 'required|string',
        lastName: 'required|string',
        password: 'required|string',
        confirmPassword: 'required|string',
        phone: 'required|string',
        state: 'required|string',
        userName: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const {
        email,
        firstName,
        lastName,
        password,
        confirmPassword,
        phone,
        state,
        userName,
      } = req.body;

      const emailExist = await SchoolOwner.findOne({ email });
      if (emailExist && emailExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `School owner with ${email} already exists`,
        });
      }
      const phoneExist = await SchoolOwner.findOne({ phone });
      if (phoneExist && phoneExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `School owner with ${phone} already exists`,
        });
      }
      const userNameExist = await SchoolOwner.findOne({ userName });
      if (userNameExist && userNameExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `School owner with ${userName} already exists`,
        });
      }
      const IsEmailVerified = await SchoolOwnerOtp.findOne({ email });
      if (!IsEmailVerified) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid credentials',
        });
      }
      if (
        IsEmailVerified.emailIsVerified === false ||
        IsEmailVerified.userType !== 'school-owner'
      ) {
        return res.status(400).json({
          status: 'failed',
          message: 'School owner is not verified',
        });
      }
      if (!Util.isPasswordValid(password)) {
        return res.status(400).json({
          status: 'failed',
          message: `Password is not strong enough`,
        });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({
          status: 'failed',
          message: `Passwords do not match`,
        });
      }
      const hash = await bcrypt.hash(password, 10);
      const schoolOwner = new SchoolOwner({
        email,
        phone,
        firstName,
        lastName,
        password: hash,
        state,
        userName,
      });
      await schoolOwner.save();
      const schoolOwnerData = {
        _id: schoolOwner._id,
        email: schoolOwner.email,
        userType: schoolOwner.userType,
        phone: schoolOwner.phone,
      };
      const token = Util.signJWT(schoolOwnerData);
      return res.status(201).json({
        status: 'success',
        message: 'School owner successfully created',
        data: {
          token,
          schoolOwner,
        },
      });
    } catch (error) {
      console.log('Create School Owner Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to create school owner',
      });
    }
  }

  async sendSchoolOwnerOTP(req, res) {
    try {
      const rules = {
        email: 'required|email',
        phone: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }
      const { email, phone } = req.body;
      const emailExist = await SchoolOwner.findOne({ email });
      if (emailExist && emailExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Email already exists`,
        });
      }

      const phoneExist = await SchoolOwner.findOne({ phone });
      if (phoneExist && phoneExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Phone already exists`,
        });
      }

      // const otp = Util.generateOTP();
      const otp = '656565';
      console.log('SCHOOL OWNER ACCOUNT ACTIVATION OTP: ', otp);

      // Encrypt otp
      const encryptedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      const emailOtpExist = await Otp.findOne({ email, phone });

      if (!emailOtpExist || emailOtpExist.userType != 'school-onwer') {
        await SchoolOwnerOtp.create({
          email,
          phone,
          expired: false,
          otp: encryptedOtp,
          expiresIn: moment().add('10', 'minutes'),
          userType: 'school-owner',
        });
      }

      if (emailOtpExist && emailOtpExist.userType === 'school-owner') {
        // Upate otp
        await SchoolOwnerOtp.findOneAndUpdate(
          { email, phone },
          {
            $set: {
              expired: false,
              otp: encryptedOtp,
              expiresIn: moment().add('10', 'minutes'),
            },
          },
        );
      }

      return res.status(200).json({
        status: 'success',
        message: 'OTP successfully sent',
      });
    } catch (error) {
      console.log('Send School Owner Otp Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to send otp',
      });
    }
  }

  async verifySchoolOwnerOTP(req, res) {
    try {
      const rules = {
        email: 'required|email',
        otp: 'required|string',
      };
      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const { email, otp } = req.body;
      const emailOtpRecord = await SchoolOwnerOtp.findOne({
        email,
        userType: 'school-owner',
      });
      if (!emailOtpRecord) {
        return res.status(404).json({
          status: 'failed',
          message: 'Invalid Otp',
        });
      }

      // hash incoming otp and verify
      const encryptedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      const foundOtp = await Otp.findOne({
        email,
        otp: encryptedOtp,
        expired: false,
        expiresIn: { $gt: moment().format() },
      });

      if (!foundOtp) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid or expired OTP',
        });
      }

      await SchoolOwnerOtp.findOneAndUpdate(
        { email, otp: foundOtp.otp, expired: false },
        {
          $set: {
            otp: foundOtp.otp,
            email,
            expired: true,
            emailIsVerified: true,
          },
        },
      );

      return res.status(200).json({
        status: 'success',
        message: 'OTP successfully verified',
      });
    } catch (error) {
      console.log('Error Verifying School Owner OTP: ', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to verify otp',
      });
    }
  }

  async login(req, res) {
    try {
      const rules = {
        email: 'required|email',
        password: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }
      const { email, password } = req.body;

      const schoolOwner = await SchoolOwner.findOne({ email });
      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'wrong email or password',
        });
      }

      const validPassword = await bcrypt.compare(
        password,
        schoolOwner.password,
      );
      if (validPassword === false) {
        return res.status(422).json({
          status: 'failed',
          message: `Invalid credentials`,
        });
      }

      const isSchoolOwnerActive = schoolOwner.isActive === true;
      if (!isSchoolOwnerActive) {
        return res.status(403).json({
          status: 'failed',
          message: `Account is not active`,
        });
      }

      const isUserTypeSchoolOwner = schoolOwner.userType === 'school-owner';
      if (!isUserTypeSchoolOwner) {
        return res.status(403).json({
          status: 'failed',
          message: `No permission to access this resource.`,
        });
      }

      const schoolOwnerData = {
        _id: schoolOwner._id,
        email: schoolOwner.email,
        userType: schoolOwner.userType,
        phone: schoolOwner.phone,
      };

      const token = Util.signJWT(schoolOwnerData);
      return res.status(200).json({
        status: 'success',
        message: 'Successfully logged in',
        data: {
          token,
          schoolOwner,
        },
      });
    } catch (error) {
      console.log('School Owner Login Error: ', error);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to login school owner',
      });
    }
  }

  initiatePasswordReset = async (req, res) => {
    try {
      const rules = {
        email: 'required|email',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const { email } = req.body;
      const schoolOwner = await SchoolOwner.findOne({ email });

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner does not exist',
        });
      }

      // const otp = Util.generateOTP();
      const otp = "656565"

      console.log('SCHOOL OWNER PASSWORD RESET OTP: ', otp);

      // hash otp -> otp expires in 10 mins
      const hash = jwt.sign({ otp, email }, process.env.JWT_SECRET_KEY, {
        expiresIn: '10m',
      });

      schoolOwner.resetPasswordToken = hash;
      await schoolOwner.save();

      // Send otp to parent mail
      //   const payload = {
      //     email,
      //     firstName: parent.firstName,
      //     otp,
      //   };

      //   await sendOtpMailToParent(payload);

      return res.status(200).json({
        status: 'success',
        message: 'OTP successfully sent!',
      });
    } catch (error) {
      console.log('Error Sending OTP: ', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to send OTP',
      });
    }
  };

  setNewPassword = async (req, res) => {
    try {
      const rules = {
        password: 'required|string',
        confirmPassword: 'string',
        otp: 'required|string',
        email: 'required|email',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }
      const { password, confirmPassword, otp, email } = req.body;

      const schoolOwner = await SchoolOwner.findOne({ email });

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'Invalid school owner',
        });
      }

      // Verify otp
      const decodedOTP = jwt.verify(
        schoolOwner.resetPasswordToken,
        process.env.JWT_SECRET_KEY,
      );

      if (!decodedOTP) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid OTP',
        });
      }

      // comapre otp and decodedOTP
      if (decodedOTP.otp !== otp) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid OTP',
        });
      }

      if (!Util.isPasswordValid(password)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Password is not strong enough',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          status: 'failed',
          message: 'Passwords do not match',
        });
      }

      // Check if user.password field exists, if not, use the provided password
      if (!schoolOwner.password) {
        schoolOwner.password = await bcrypt.hash(password, 10);
      } else {
        const isMatch = await bcrypt.compare(password, schoolOwner.password);

        if (isMatch) {
          return res.status(400).json({
            status: 'failed',
            message: 'Old and new passwords are the same.',
          });
        }

        schoolOwner.password = await bcrypt.hash(password, 10);
      }

      schoolOwner.lastPasswordChangeDate = Date.now();
      await schoolOwner.save();

      //   const payload = {
      //     email,
      //     firstName: user.firstName,
      //   };

      //   await this.sendUserSuccessPasswordResetMail(payload);

      return res.status(200).json({
        status: 'success',
        message: 'Password successfully reset',
      });
    } catch (error) {
      console.log('Error setting new password:', error.message);
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid or expired OTP',
        });
      } else {
        return res.status(500).json({
          status: 'failed',
          message: 'Unable to set new password',
        });
      }
    }
  };

  getEnquiries = async (req, res) => {
    try {
      const { _id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(_id);

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const enquiries = await Enquiry.find({ schoolOwnerId: _id })
        .sort({
          createdAt: -1,
        })
        .populate({
          path: 'parentId',
          select:
            '-password -createdAt -updatedAt -isActive -isDisabled -userType',
        });

      return res.status(200).json({
        status: 'success',
        message: 'Enquiries retrieved',
        data: {
          enquiries,
        },
      });
    } catch (error) {
      console.log('Error getting enquiries:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to get enquiries',
      });
    }
  };

  async getAdmissions(req, res) {
    try {
      const { _id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(_id);

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School Owner Not Found',
        });
      }

      const admissions = await Admission.find({ schoolOwnerId: _id })
        .sort({
          createdAt: -1,
        })
        .populate({
          path: 'parentId',
          select:
            '-password -createdAt -updatedAt -isActive -isDisabled -userType',
        });

      return res.status(200).json({
        status: 'success',
        message: 'Admissions retrieved',
        data: {
          admissions,
        },
      });
    } catch (error) {
      console.log('Error getting admissions:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to get admissions',
      });
    }
  }

  async getReviews(req, res) {
    try {
      const { _id } = req.schoolOwner;
      const { schoolId } = req.params;
      const schoolOwner = await SchoolOwner.findById(_id);

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School Owner Not Found',
        });
      }

      if (!isValidObjectId(schoolId)) {
        return res.status(404).json({
          status: 'failed',
          message: 'School Not Found',
        });
      }

      // Display reviews owned by school owner
      const schoolByOwner = await School.findOne({ schoolOwner: _id });
      if (!schoolByOwner || schoolByOwner === null) {
        return res.status(400).json({
          status: 'failed',
          message: 'Unable to get school reviews',
        });
      }

      const reviews = await SchoolReview.find({ schoolId })
        .sort({
          createdAt: -1,
        })
        .populate({
          path: 'parentId',
          select:
            '-password -createdAt -updatedAt -isActive -isDisabled -userType',
        })
        .populate({
          path: 'schoolId',
          select: '_id name',
        });

      return res.status(200).json({
        status: 'success',
        message: 'Reviews retrieved',
        data: {
          reviews,
        },
      });
    } catch (error) {
      console.log('Error getting reviews:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to get reviews',
      });
    }
  }

  async updatePassword(req, res) {
    try {
      const rules = {
        oldPassword: 'required|string',
        newPassword: 'required|string',
        confirmPassword: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const { _id } = req.schoolOwner;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      const schoolOwner = await SchoolOwner.findById(_id);

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const isOldPasswordCorrect = await bcrypt.compare(
        oldPassword,
        schoolOwner.password,
      );

      if (!isOldPasswordCorrect) {
        return res.status(400).json({
          status: 'failed',
          message: 'Old password is not correct',
        });
      }

      const isOldPasswordEqualsNewPassword = await bcrypt.compare(
        newPassword,
        schoolOwner.password,
      );
      if (isOldPasswordEqualsNewPassword) {
        return res.status(400).json({
          status: 'failed',
          message: 'Old password is the same as new password',
        });
      }

      if (!Util.isPasswordValid(newPassword)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Password should be strong',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          status: 'failed',
          message: 'Passwords do not match',
        });
      }

      // Hash password + salt
      schoolOwner.password = await bcrypt.hash(newPassword, 10);
      await schoolOwner.save();

      return res.status(200).json({
        status: 'success',
        message: 'Password successfully updated',
      });
    } catch (error) {
      console.log('Error updating password: ', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to update password',
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const { _id } = req.schoolOwner;

      if (req.body.password || req.body.confirmPassword) {
        return res.status(400).json({
          status: 'failed',
          message: 'Please Use Update Password Route.',
        });
      }

      const schoolOwner = await SchoolOwner.findOneAndUpdate(
        { _id },
        req.body,
        {
          new: true,
          runValidators: true,
        },
      );

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Profile Successfully Updated',
        data: {
          schoolOwner,
        },
      });
    } catch (error) {
      console.log('Update School Owner Profile Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to update school owner profile',
      });
    }
  }

  async getDashboard(req, res) {
    try {
      const { _id } = req.schoolOwner;

      const school = await School.findOne({ schoolOwner: _id });
      const admissions = await Admission.countDocuments({
        schoolId: school._id,
      });
      const enquiries = await Enquiry.countDocuments({ schoolId: school._id });
      const reviews = await SchoolReview.countDocuments({
        schoolId: school._id,
      });

      const metrics = {
        views: school?.views || 0,
        admissions: admissions || 0,
        enquiries: enquiries || 0,
        reviews: reviews || 0,
      };

      const subscriptionPlan = req.schoolOwner.plan;
      const schoolName = school?.name;

      return res.status(200).json({
        status: 'success',
        message: 'Dashboard Retrieved',
        data: {
          metrics,
          subscriptionPlan,
          schoolName,
        },
      });
    } catch (error) {
      console.log('Dashboard Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to get dashboard',
      });
    }
  }

  async uploadLogo(req, res) {
    try {
      const rules = {
        logo: 'string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      if (!req.files) {
        return res.status(400).send({
          status: 'failed',
          message: 'No file uploaded',
        });
      }

      const { _id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(_id);
      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const { tempFilePath } = req.files.logo;

      if (!tempFilePath) {
        return res.status(422).send({
          status: 'failed',
          message: 'Cannot process file',
        });
      }

      const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

      const extension = path.extname(req.files.logo.name);
      if (!validExtensions.includes(extension)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid file extension',
        });
      }

      const url = await uploadToCloudinary(tempFilePath);

      return res.status(201).json({
        status: 'success',
        message: 'Logo uploaded successfully',
        url,
      });
    } catch (error) {
      console.log('Upload Image Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to upload image',
      });
    }
  }

  async uploadBanner(req, res) {
    try {
      const rules = {
        banner: 'string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      if (!req.files) {
        return res.status(400).send({
          status: 'failed',
          message: 'No file uploaded',
        });
      }

      const { _id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(_id);
      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const { tempFilePath } = req.files.banner;

      if (!tempFilePath) {
        return res.status(422).send({
          status: 'failed',
          message: 'Cannot process file',
        });
      }

      const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

      const extension = path.extname(req.files.banner.name);
      if (!validExtensions.includes(extension)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid file extension',
        });
      }

      const url = await uploadToCloudinary(tempFilePath);

      return res.status(201).json({
        status: 'success',
        message: 'Banner uploaded successfully',
        url,
      });
    } catch (error) {
      console.log('Upload Image Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to upload image',
      });
    }
  }

  async uploadFacilityImages(req, res) {
    try {
      const rules = {
        facilityImages: 'string|array',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      if (!req.files || !req.files.facilityImages) {
        return res.status(400).send({
          status: 'failed',
          message: 'No file uploaded',
        });
      }

      const { _id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(_id);
      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const tempFileArray = req.files.facilityImages.map((file) => file.tempFilePath);

      if (tempFileArray.length < 1) {
        return res.status(400).send({
          status: 'failed',
          message: 'Cannot process file',
        });
      }

      const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

      for (const file of req.files.facilityImages) {
        const extension = path.extname(file.name);

        if (!validExtensions.includes(extension)) {
          return res.status(400).json({
            status: 'failed',
            message: 'Invalid file extension',
          });
        }
      }

      const urls = await uploadToCloudinary(tempFileArray);

      return res.status(201).json({
        status: 'success',
        message: 'Facility Images uploaded successfully',
        urls,
      });
    } catch (error) {
      console.log('Upload Image Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to upload image',
      });
    }
  }

  async uploadProfileImage(req, res) {
    try {
      const rules = {
        image: 'string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      if (!req.files) {
        return res.status(400).send({
          status: 'failed',
          message: 'No file uploaded',
        });
      }

      const { _id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(_id);
      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const { tempFilePath } = req.files.image;

      // const file = fs.readFileSync(tempFilePath);
      if (!tempFilePath) {
        return res.status(422).send({
          status: 'failed',
          message: 'Cannot process file',
        });
      }

      const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

      const extension = path.extname(req.files.image.name);
      if (!validExtensions.includes(extension)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid file extension',
        });
      }

      const url = await uploadToCloudinary(tempFilePath);

      return res.status(201).json({
        status: 'success',
        message: 'Image uploaded successfully',
        url,
      });
    } catch (error) {
      console.log('Upload Image Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to upload image',
      });
    }
  }
}

module.exports = new SchoolOwnerController();
