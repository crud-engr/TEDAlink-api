const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ParentSchema = new Schema(
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
    profileImage: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
    },
    userType: {
      type: String,
      default: 'parent',
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

ParentSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Parent = mongoose.model('Parent', ParentSchema);
module.exports = Parent;
