const Validator = require('validatorjs');
const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Parent = require('../model/Parent');
const Otp = require('../model/Otp');
const Util = require('../../common/utils/util');

class ParentController {
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

      const emailExist = await Parent.findOne({ email });
      if (emailExist && emailExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Parent with ${email} already exists`,
        });
      }
      const phoneExist = await Parent.findOne({ phone });
      if (phoneExist && phoneExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Parent with ${phone} already exists`,
        });
      }
      const userNameExist = await Parent.findOne({ userName });
      if (userNameExist && userNameExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Parent with ${userName} already exists`,
        });
      }
      const IsEmailVerified = await Otp.findOne({ email });
      if (!IsEmailVerified) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid credentials',
        });
      }
      if (
        IsEmailVerified.emailIsVerified === false ||
        IsEmailVerified.userType !== 'parent'
      ) {
        return res.status(400).json({
          status: 'failed',
          message: 'Parent is not verified',
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
      const parent = new Parent({
        email,
        phone,
        firstName,
        lastName,
        password: hash,
        state,
        userName,
      });
      await parent.save();
      const parentData = {
        _id: parent._id,
        email: parent.email,
        userType: parent.userType,
        phone: parent.phone,
      };
      const token = Util.signJWT(parentData);
      return res.status(201).json({
        status: 'success',
        message: 'Parent successfully created',
        data: {
          token,
          parent,
        },
      });
    } catch (error) {
      console.log('Create Parent Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to create parent',
      });
    }
  }

  async sendOTP(req, res) {
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

      const otp = Util.generateOTP();
      console.log('OTP: ', otp);

      // Encrypt otp
      const encryptedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      const emailOtpExist = await Otp.findOne({ email });

      if (!emailOtpExist || emailOtpExist.userType != 'parent') {
        await Otp.create({
          email,
          expired: false,
          otp: encryptedOtp,
          expiresIn: moment().add('10', 'minutes'),
          userType: 'parent',
        });
      }

      if (emailOtpExist && emailOtpExist.userType === 'parent') {
        // Upate otp
        await Otp.findOneAndUpdate(
          { email },
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
      console.log('Send Parent Otp Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to send otp',
      });
    }
  }

  async verifyOTP(req, res) {
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
      const emailOtpRecord = await Otp.findOne({
        email,
        userType: 'parent',
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

      await Otp.findOneAndUpdate(
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
      console.log('Error Verifying Parent OTP: ', error.message);
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

      const parent = await Parent.findOne({ email });
      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'wrong email or password',
        });
      }

      const validPassword = await bcrypt.compare(password, parent.password);
      if (validPassword === false) {
        return res.status(422).json({
          status: 'failed',
          message: `Invalid credentials`,
        });
      }

      const isParentActive = await Parent.findOne({ isActive: true });
      if (!isParentActive) {
        return res.status(403).json({
          status: 'failed',
          message: `Account is not active`,
        });
      }

      const isUserTypeParent = await Parent.findOne({ userType: 'parent' });
      if (!isUserTypeParent) {
        return res.status(403).json({
          status: 'failed',
          message: `No permission to access this resource.`,
        });
      }

      const parentData = {
        id: parent._id,
        email: parent.email,
        userType: parent.userType,
        phone: parent.phone,
      };

      const token = Util.signJWT(parentData);
      return res.status(200).json({
        status: 'success',
        message: 'Parent logged in successfully',
        data: {
          token,
          parent,
        },
      });
    } catch (error) {
      console.log('Parent Login Error: ', error);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to login parent',
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
      const parent = await Parent.findOne({ email });

      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Parent does not exist',
        });
      }

      const otp = Util.generateOTP();
      console.log('OTP: ', otp);

      // hash otp -> otp expires in 10 mins
      const hash = jwt.sign({ otp, email }, process.env.JWT_SECRET_KEY, {
        expiresIn: '10m',
      });

      parent.resetPasswordToken = hash;
      await parent.save();

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

      const parent = await Parent.findOne({ email });

      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Invalid parent',
        });
      }

      // Verify otp
      const decodedOTP = jwt.verify(
        parent.resetPasswordToken,
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
      if (!parent.password) {
        parent.password = await bcrypt.hash(password, 10);
      } else {
        const isMatch = await bcrypt.compare(password, parent.password);

        if (isMatch) {
          return res.status(400).json({
            status: 'failed',
            message: 'Old and new passwords are the same.',
          });
        }

        parent.password = await bcrypt.hash(password, 10);
      }

      parent.lastPasswordChangeDate = Date.now();
      await parent.save();

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
}

module.exports = new ParentController();
