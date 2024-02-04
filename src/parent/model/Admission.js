const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdmissionSchema = new Schema(
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
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    dob: {
      type: String,
      required: true,
    },
    placeOfBirth: {
      type: String,
      required: true,
    },
    applicantClass: {
      type: String,
      required: true,
    },
    residentAddress: {
      type: String,
      required: true,
    },
    presentSchool: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    lga: {
      type: String,
      required: true,
    },
    relationshipToPupil: {
      type: String,
      required: true,
    },
    religion: {
      type: String,
      required: true,
    },
    haveDisability: {
      type: Boolean,
      required: true,
    },
    disabilityDescription: {
      type: String,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model('Admission', AdmissionSchema);

AdmissionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});
