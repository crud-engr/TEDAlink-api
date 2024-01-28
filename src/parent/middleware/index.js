const jwt = require('jsonwebtoken');
const Parent = require('../model/Parent');
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

    const parent = await Parent.findById(decoded.id);
    if (!parent) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid Parent',
      });
    }
    if (parent.isDisabled) {
      return res.status(401).json({
        status: 'failed',
        message: 'Your Account Is Disabled',
      });
    }

    if (parent.userType !== 'parent') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not allowed to access this resource!',
      });
    }
    req.parent = parent;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'failed',
        message: 'Session Expired. Please Login Again.',
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'failed',
        message: 'Invalid Session. Please Login Again.',
      });
    }
    return res.status(500).json({
      status: 'failed',
      message: 'Unable to verify user',
    });
  }
};

module.exports = auth;
