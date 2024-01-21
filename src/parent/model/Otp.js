const mongoose = require('mongoose');
const { Schema } = mongoose;

const OtpSchema = new Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    expiresIn: Date,
    expired: {
      type: Boolean,
      default: false,
    },
    emailIsVerified: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Otp', OtpSchema);

OtpSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});
