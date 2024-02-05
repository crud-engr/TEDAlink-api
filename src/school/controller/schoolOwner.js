const Validator = require('validatorjs');
const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Otp = require('../model/SchoolOwnerOtp');
const Util = require('../../common/utils/util');
const SchoolOwnerOtp = require('../model/SchoolOwnerOtp');
const SchoolOwner = require('../model/SchoolOwner');
const { isValidObjectId } = require('mongoose');
const School = require('../model/School');
const Enquiry = require('../../parent/model/Enquiry');
const Admission = require('../../parent/model/Admission');

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
      // console.log('SCHOOL OWNER ACCOUNT ACTIVATION OTP: ', otp);

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
        id: schoolOwner._id,
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

      const otp = Util.generateOTP();
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
      const { id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(id);

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School owner not found',
        });
      }

      const enquiries = await Enquiry.find({ schoolOwnerId: id })
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
      const { id } = req.schoolOwner;
      const schoolOwner = await SchoolOwner.findById(id);

      if (!schoolOwner) {
        return res.status(404).json({
          status: 'failed',
          message: 'School Owner Not Found',
        });
      }

      const admissions = await Admission.find({ schoolOwnerId: id })
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
}

module.exports = new SchoolOwnerController();
