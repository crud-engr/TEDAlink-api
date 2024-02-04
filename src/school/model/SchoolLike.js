const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolLikeSchema = new Schema(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Parent',
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
      },
  },
  {
    timestamps: true,
  },
);

SchoolLikeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const SchoolLike = mongoose.model('SchoolLike', SchoolLikeSchema);
module.exports = SchoolLike;
