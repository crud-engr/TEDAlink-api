// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const SchoolRatingSchema = new Schema(
//   {
//     parentId: {
//       type: Schema.Types.ObjectId,
//       ref: 'Parent',
//     },
//     schoolId: {
//       type: Schema.Types.ObjectId,
//       ref: 'School',
//     },
//     ratingValue: {
//       type: Number,
//       default: 0
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// SchoolRatingSchema.set('toJSON', {
//   transform: (doc, ret) => {
//     delete ret.__v;
//     return ret;
//   },
// });

// const SchoolRating = mongoose.model('SchoolRating', SchoolRatingSchema);
// module.exports = SchoolRating;
