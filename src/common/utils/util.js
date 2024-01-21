
const jwt = require('jsonwebtoken')
require('dotenv').config()

class Util {
  generateOTP() {
    return `${Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)}`;
  }

  isPasswordValid(password) {
    // Contains uppercase letter
    const uppercaseRegex = /[A-Z]/;

    // Contains numeric digit
    const numericRegex = /\d/;

    // Contains special character
    const specialCharRegex = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;

    return (
      uppercaseRegex.test(password) &&
      numericRegex.test(password) &&
      specialCharRegex.test(password)
    );
  }

  signJWT(data) {
    return jwt.sign(data, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
  }
}

module.exports = new Util();
