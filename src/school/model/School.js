const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolSchema = new Schema(
  {
    schoolOwner: {
      type: Schema.Types.ObjectId,
      ref: 'SchoolOwner',
    },
    name: {
      type: String,
    },
    category: {
      type: String,
    },
    type: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    lga: {
      type: String,
    },
    website: {
      type: String,
    },
    logo: {
      type: String,
    },
    banner: {
      type: String,
    },
    curriculums: {
      type: Array,
      default: [],
    },
    programsOffered: {
      type: Array,
      default: [],
    },
    scholarships: {
      type: Array,
      default: [],
    },
    awards: {
      type: Array,
      default: [],
    },
    facilityImages: {
      type: Array,
      default: [],
    },
    admissionRequirements: {
      type: Array,
      default: [],
    },
    accountNumber: {
      type: String,
    },
    accountName: {
      type: String,
    },
    bankName: {
      type: String,
    },
    admissionProcedures: {
      type: Array,
      default: [],
    },
    subjectOffered: {
      type: Array,
      default: [],
    },
    extracurriculumActivities: {
      type: Array,
      default: [],
    },
    videoUrl: {
      type: String,
    },
    history: {
      type: String,
    },
    securityMeasure: {
      type: String,
    },
    about: {
      type: String,
    },
    schoolFeeDiscount: {
      type: Number,
    },
    minimumSchoolFee: {
      type: Number,
    },
    maximumSchoolFee: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    latitude: {
      type: Number,
    },
    applicationFee: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    academicYear: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

SchoolSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const School = mongoose.model('School', SchoolSchema);
module.exports = School;
