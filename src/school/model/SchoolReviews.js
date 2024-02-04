const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolReviewSchema = new Schema(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
      },
    reviewComment: {
      type: String,
    },
    fullName: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

SchoolReviewSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const SchoolReview = mongoose.model('SchoolReview', SchoolReviewSchema);
module.exports = SchoolReview;
