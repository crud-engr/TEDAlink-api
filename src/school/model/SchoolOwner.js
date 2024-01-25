const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolOwnerSchema = new Schema(
  {
    firstName: {
      type: String,
      lowercase: true,
    },
    lastName: {
      type: String,
      lowercase: true,
    },
    state: {
      type: String,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    userType: {
      type: String,
      default: 'school-owner',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
    },
    lastPasswordChangeDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

SchoolOwnerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const SchoolOwner = mongoose.model('SchoolOwner', SchoolOwnerSchema);
module.exports = SchoolOwner;
