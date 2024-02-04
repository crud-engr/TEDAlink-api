const mongoose = require('mongoose');
const { Schema } = mongoose;

const EnquirySchema = new Schema(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
    },
    schoolOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'SchoolOwner',
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
    },
    fullName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Enquiry', EnquirySchema);

EnquirySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});
