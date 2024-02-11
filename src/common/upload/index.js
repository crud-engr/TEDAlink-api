const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

exports.uploadToCloudinary = async (filePath) => {
  try {
    if (Array.isArray(filePath)) {
      const uploadPromises = filePath.map(async (singlePath) => {
        // Upload each file to Cloudinary
        const result = await cloudinary.uploader.upload(singlePath);

        // Log the Cloudinary response
        // console.log('Result: ', result);

        // Return the public URL of the uploaded file
        return result.secure_url;
      });

      // Wait for all uploads to complete
      const urls = await Promise.all(uploadPromises);

      return urls;
    } else if (typeof filePath === 'string') {
      // Upload the single file to Cloudinary
      const result = await cloudinary.uploader.upload(filePath);
      return result.secure_url;
    } else {
      // Handle other cases or throw an error
      console.error('Unsupported file path type:', typeof filePath);
      // You might want to throw an error or handle it in another way
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    // Handle the error appropriately (e.g., throw it or return a default value)
    throw new Error('Unable to uplaod file')
  }
};


// exports.uploadToCloudinary = async (filePath) => {
//   try {
//     if (Array.isArray(filePath)) {
//       const uploadPromises = filePath.map(async (path) => {
//         // Upload each file to Cloudinary
//         const result = await cloudinary.uploader.upload(path);

//         // Log the Cloudinary response
//         // console.log('Result: ', result);

//         // Return the public URL of the uploaded file
//         return result.secure_url;
//       });

//       // Wait for all uploads to complete
//       const urls = await Promise.all(uploadPromises);

//       return urls;
//     }

//     if (filePath instanceof Object) {
//       // Upload the file to Cloudinary
//       const result = await cloudinary.uploader.upload(filePath);

//       // Log the Cloudinary response
//       // console.log('Result: ', result);

//       // Return the public URL of the uploaded file
//       return result.secure_url;
//     }
//   } catch (error) {
//     console.error('Error uploading file:', error);
//   }
// };