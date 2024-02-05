const jwt = require('jsonwebtoken');
const SchoolOwner = require('../model/SchoolOwner');
require('dotenv').config();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        status: 'failed',
        message: 'Unauthenticated!',
      });
    }

    const token = req.headers['authorization'];

    //verify the auth user
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const schoolOwner = await SchoolOwner.findById(decoded._id);
    if (!schoolOwner) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid School Owner',
      });
    }
    if (schoolOwner.isDisabled) {
      return res.status(401).json({
        status: 'failed',
        message: 'Your Account Is Disabled',
      });
    }

    if (schoolOwner.userType !== 'school-owner') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not allowed to access this resource!',
      });
    }
    req.schoolOwner = schoolOwner;
    next();
  } catch (error) {
    console.log('Error verify user token: ', error.message)
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'failed',
        message: 'Session Expired. Please Login Again.',
      });
    }
    return res.status(500).json({
      status: 'failed',
      message: 'Unable to verify',
    });
  }
};

module.exports = auth;
