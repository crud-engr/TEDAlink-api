const Validator = require('validatorjs');
const crypto = require('crypto');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Parent = require('../model/Parent');
const Otp = require('../model/Otp');
const Util = require('../../common/utils/util');
const School = require('../../school/model/School');
const Admission = require('../model/Admission');
const { isValidObjectId, default: mongoose } = require('mongoose');
const Enquiry = require('../model/Enquiry');
const SchoolReview = require('../../school/model/SchoolReviews');
const SchoolLike = require('../../school/model/SchoolLike');
const SchoolRating = require('../../school/model/SchoolRating');

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
      const emailExist = await Parent.findOne({ email });
      if (emailExist && emailExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Email already exists`,
        });
      }

      const phoneExist = await Parent.findOne({ phone });
      if (phoneExist && phoneExist !== null) {
        return res.status(400).json({
          status: 'failed',
          message: `Phone already exists`,
        });
      }

      const otp = Util.generateOTP();
      // const otp = '656565';
      console.log('USER REGISTRATION OTP: ', otp);

      // Encrypt otp
      const encryptedOtp = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

      const emailOtpExist = await Otp.findOne({ email, phone });

      if (!emailOtpExist || emailOtpExist.userType !== 'parent') {
        await Otp.create({
          email,
          phone,
          expired: false,
          otp: encryptedOtp,
          expiresIn: moment().add('10', 'minutes'),
          userType: 'parent',
        });
      }

      if (emailOtpExist && emailOtpExist.userType === 'parent') {
        // Upate otp
        await Otp.findOneAndUpdate(
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

      const isParentActive = parent.isActive === true;
      if (!isParentActive) {
        return res.status(403).json({
          status: 'failed',
          message: `Account is not active`,
        });
      }

      const isUserTypeParent = parent.userType === 'parent';
      if (!isUserTypeParent) {
        return res.status(403).json({
          status: 'failed',
          message: `No permission to access this resource.`,
        });
      }

      const parentData = {
        _id: parent._id,
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

  async initiatePasswordReset(req, res) {
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
      console.log('PASSWORD RESET OTP: ', otp);

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
  }

  async setNewPassword(req, res) {
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

      const { _id } = req.parent;
      const { oldPassword, newPassword, confirmPassword } = req.body;

      const parent = await Parent.findById(_id);

      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Parent not found',
        });
      }

      const isOldPasswordCorrect = await bcrypt.compare(
        oldPassword,
        parent.password,
      );

      if (!isOldPasswordCorrect) {
        return res.status(400).json({
          status: 'failed',
          message: 'Old password is not correct',
        });
      }

      const isOldPasswordEqualsNewPassword = await bcrypt.compare(
        newPassword,
        parent.password,
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
      parent.password = await bcrypt.hash(newPassword, 10);
      await parent.save();

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
      const { _id } = req.parent;

      if (req.body.password || req.body.confirmPassword) {
        return res.status(400).json({
          status: 'failed',
          message: 'Please Use Update Password Route.',
        });
      }

      const parent = await Parent.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      });

      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Parent not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Parent profile Successfully Updated',
        data: {
          parent,
        },
      });
    } catch (error) {
      console.log('Update Parent Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to update parent',
      });
    }
  }

  // Fetch schools
  async getSchools(req, res) {
    try {
      const schools = await School.find().sort({ createdAt: -1 });

      return res.status(200).json({
        status: 'success',
        message: 'Schools retrieved',
        data: {
          schools,
        },
      });
    } catch (error) {
      console.log('Fetch Schools Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to fetch schools',
      });
    }
  }

  // Fetch school
  async getSchool(req, res) {
    try {
      let { schoolId } = req.params;
      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school ID',
        });
      }
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      const reviews = await SchoolReview.find({ schoolId }).populate(
        'parentId',
      );

      return res.status(200).json({
        status: 'success',
        message: 'School retrieved',
        data: {
          school,
          reviews,
        },
      });
    } catch (error) {
      console.log('Fetch School Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to fetch school',
      });
    }
  }

  async sendSchoolEnquiry(req, res) {
    try {
      const rules = {
        fullName: 'required|string',
        email: 'required|string',
        phone: 'required|string',
        location: 'required|string',
        subject: 'required|string',
        message: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const { schoolId } = req.params;

      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school',
        });
      }

      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      const { fullName, email, phone, location, subject, message } = req.body;

      const equiry = new Enquiry({
        parentId: req.parent?._id,
        schoolId: school?._id,
        schoolOwnerId: school?.schoolOwner,
        userType: req.parent?.userType,
        fullName,
        email,
        phone,
        location,
        subject,
        message,
      });
      await equiry.save();

      // Eventually an email will be sent to school here (school.email)

      return res.status(201).json({
        status: 'success',
        message: 'Enquiry successfully created',
        data: {
          equiry,
        },
      });
    } catch (error) {
      console.log('Create Enquiry Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to send enquiry',
      });
    }
  }

  async applyForAdmission(req, res) {
    try {
      const rules = {
        firstName: 'required|string',
        lastName: 'required|string',
        gender: 'required|string',
        dob: 'required|string',
        placeOfBirth: 'required|string',
        applicantClass: 'required|string',
        residentAddress: 'required|string',
        presentSchool: 'required|string',
        postalCode: 'required|string',
        country: 'required|string',
        state: 'required|string',
        lga: 'required|string',
        relationshipToPupil: 'required|string',
        religion: 'required|string',
        haveDisability: 'required|boolean',
        disabilityDescription: 'string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const { schoolId } = req.params;

      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school',
        });
      }

      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      const {
        firstName,
        lastName,
        gender,
        dob,
        placeOfBirth,
        applicantClass,
        residentAddress,
        presentSchool,
        postalCode,
        country,
        state,
        lga,
        relationshipToPupil,
        religion,
        haveDisability,
        disabilityDescription,
      } = req.body;

      const admission = new Admission({
        parentId: req.parent?._id,
        schoolId: school?._id,
        schoolOwnerId: school?.schoolOwner,
        firstName,
        lastName,
        gender,
        dob,
        placeOfBirth,
        applicantClass,
        residentAddress,
        presentSchool,
        postalCode,
        country,
        state,
        lga,
        relationshipToPupil,
        religion,
        haveDisability,
        disabilityDescription,
      });
      if (
        admission.haveDisability === true &&
        (!admission.disabilityDescription ||
          admission.disabilityDescription === '')
      ) {
        return res.status(400).json({
          status: 'failed',
          message: 'Disability description is required',
        });
      }
      await admission.save();

      // Eventually an email will be sent to school here (school.email)

      return res.status(201).json({
        status: 'success',
        message: 'Admission successfully applied',
        data: {
          admission,
        },
      });
    } catch (error) {
      console.log('Apply Admission Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to apply for admission',
      });
    }
  }

  async reviewSchool(req, res) {
    try {
      const rules = {
        fullName: 'required|string',
        reviewComment: 'required|string',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      const { fullName, reviewComment } = req.body;
      const { schoolId } = req.params;

      if (!isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school',
        });
      }

      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      const parent = await Parent.findById(req.parent._id);
      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Parent not found',
        });
      }

      const schoolReview = await SchoolReview.findOne({
        schoolId,
        parentId: req.parent._id,
      });
      if (schoolReview) {
        return res.status(400).json({
          status: 'failed',
          message: 'Review already created for this school',
        });
      }

      const review = new SchoolReview({
        parentId: req.parent?._id,
        schoolId: school?._id,
        fullName,
        reviewComment,
      });

      await review.save();

      return res.status(201).json({
        status: 'success',
        message: 'Review successfully sent',
        data: {
          review,
        },
      });
    } catch (error) {
      console.log('Review Error:', error.message);
      return res.status(500).json({
        status: 'failed',
        message: 'Unable to review school',
      });
    }
  }

  // Use mongodb transaction
  async toggleLikeSchool(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { schoolId } = req.params;

      if (!mongoose.isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school',
        });
      }

      const school = await School.findById(schoolId).session(session);
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      const parent = await Parent.findById(req.parent._id).session(session);
      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Parent not found',
        });
      }

      const schoolLike = await SchoolLike.findOne({
        schoolId,
        parentId: req.parent._id,
      }).session(session);
      if (schoolLike) {
        // If already liked, unlike the school
        await SchoolLike.findByIdAndDelete(schoolLike._id).session(session);

        // Decrement school likes by 1
        school.likes -= 1;
      } else {
        // If not liked, like the school
        await SchoolLike.create(
          [
            {
              parentId: req.parent?._id,
              schoolId: school?._id,
            },
          ],
          { session },
        );

        // Increment school likes by 1
        school.likes += 1;
      }

      await school.save();
      await session.commitTransaction();

      return res.status(200).json({
        status: 'success',
        message: `School ${schoolLike ? 'unliked' : 'liked'} successfully`,
        data: {
          likes: school.likes,
        },
      });
    } catch (error) {
      console.log('Toggle Like Error:', error.message);
      await session.abortTransaction();

      return res.status(500).json({
        status: 'failed',
        message: 'Unable to toggle like for the school',
      });
    } finally {
      session.endSession();
    }
  }

  async rateSchool(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const rules = {
        ratingValue: 'required|integer|max:5|min:1',
      };

      const validation = new Validator(req.body, rules);

      if (validation.fails()) {
        return res.status(400).json({
          status: 'failed',
          message: 'Validation Errors',
          errors: validation.errors.all(),
        });
      }

      let { ratingValue } = req.body;
      const { schoolId } = req.params;

      ratingValue = Number(ratingValue);

      if (!mongoose.isValidObjectId(schoolId)) {
        return res.status(400).json({
          status: 'failed',
          message: 'Invalid school',
        });
      }

      const school = await School.findById(schoolId).session(session);
      if (!school) {
        return res.status(404).json({
          status: 'failed',
          message: 'School not found',
        });
      }

      const parent = await Parent.findById(req.parent._id).session(session);
      if (!parent) {
        return res.status(404).json({
          status: 'failed',
          message: 'Parent not found',
        });
      }

      const schoolRating = await SchoolRating.findOne({
        schoolId,
        parentId: req.parent._id,
      }).session(session);

      if (schoolRating) {
        return res.status(400).json({
          status: 'failed',
          message: 'School has already been rated',
        });
      }

      await SchoolRating.create(
        [
          {
            parentId: req.parent?._id,
            schoolId: school?._id,
            ratingValue,
          },
        ],
        { session },
      );

      // Update school's average rating
      const previousTotalRatings = school.avgRatings * school.numOfRatings;
      school.numOfRatings += 1;

      if (school.numOfRatings === 1) {
        // If it's the first rating, set avgRatings to the new ratingValue
        school.avgRatings = ratingValue;
      } else {
        // Otherwise, calculate the new average rating
        school.avgRatings =
          (previousTotalRatings + ratingValue) / school.numOfRatings;
      }

      await school.save();
      await session.commitTransaction();

      return res.status(200).json({
        status: 'success',
        message: `School rated successfully`,
        data: {
          avgRatings: school.avgRatings,
        },
      });
    } catch (error) {
      console.log('Rate Error:', error.message);
      await session.abortTransaction();

      return res.status(500).json({
        status: 'failed',
        message: 'Unable to rate school',
      });
    } finally {
      session.endSession();
    }
  }

  async getDashboard(req, res) {
    try {
      /**
       * Returnes schools with highest enquiries order
       * by number of enquiries in descending order
       */
      const topSchools = await School.aggregate([
        {
          $lookup: {
            from: 'enquiries',
            localField: '_id',
            foreignField: 'schoolId',
            as: 'enquiries',
          },
        },
        {
          $project: {
            // Include all fields from the School collection
            school: '$$ROOT',
            // schoolName: '$name',
            numberOfEnquiries: { $size: '$enquiries' },
          },
        },
        {
          $sort: { numberOfEnquiries: -1 },
        },
      ]);

      const schoolMetrics = await School.aggregate([
        {
          $group: {
            _id: {
              $cond: {
                if: {
                  $in: [
                    { $toLower: '$state' },
                    ['lagos', 'kaduna', 'abuja'],
                  ],
                },
                then: '$state', // Group by state for Lagos, Kaduna, and Abuja
                else: 'Other States', // Group other states into a separate category
              },
            },
            totalSchools: { $sum: 1 },
          },
        },
      ]);

      // const topProfessionalDisabilities = await Professional.aggregate([])
      // const topEducators = await Educator.aggregate([])
      // const topCourses = await Course.aggregate([])

      // Add more data based on what you want on the dashboard.

      return res.status(200).json({
        status: 'success',
        message: `Dashboard Retrieved`,
        data: {
          topSchools,
          schoolMetrics
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
}

module.exports = new ParentController();
