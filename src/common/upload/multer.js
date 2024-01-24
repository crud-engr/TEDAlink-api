const multer = require('multer');
const sharp = require('sharp');

// Multer Storage
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image. Please upload only images.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadSchoolImages = upload.fields([
  { name: 'logo', maxCount: 1 }, // logo field can process 1 image.
  { name: 'facilityImages', maxCount: 3 }, // facilityImages field can process 3 images.
  { name: 'banner', maxCount: 1 }, // banner field can process 1 image.
]);

upload.single('logo'); // this field can accept single image
upload.single('banner'); // this field can accept single image
upload.array('facilityImages', 3); // this field can accept multiple images (req.files)

exports.resizeSchoolImages = async (req, res, next) => {
  // If no images were uploaded
  if (!req.files.logo || !req.files.facilityImages || !req.files.banner) return next();

  req.body.banner = `school-${Date.now()}-banner.jpeg`;
  req.body.logo = `school-${Date.now()}-logo.jpeg`;
  req.body.banner = `school-${Date.now()}-banner.jpeg`;

  // Resize banner Image
  const bannerOutput =  sharp(req.files.banner[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 });
    // .toFile(`public/img/tours/${req.body.banner}`);

  // Resize facility images
  req.body.facilityImages = [];

  await Promise.all(
    req.files.facilityImages.map(async (file, i) => {
      // Generate a unique filename for each image.
      const filename = `school-${Date.now()}-${i + 1}.jpeg`;

      // Process the image
      const output =  sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        // .toFile(`public/img/schools/${filename}`);

      req.body.facilityImages.push(filename);

    //   Maybe upload to cloudinary here
    }),
  );
  next();
};
