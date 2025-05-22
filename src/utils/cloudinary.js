const cloudinary = require('cloudinary').v2;
const { unlink } = require('fs').promises;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `shaadisetgo/${folder}`,
      use_filename: true,
      unique_filename: true,
      overwrite: true,
      resource_type: 'auto'
    });

    // Delete the local file after upload
    await unlink(filePath);
    return result;
  } catch (error) {
    // Delete the local file in case of error
    await unlink(filePath);
    throw error;
  }
};

exports.removeFromCloudinary = async (publicId) => {
  if (!publicId) return;
  
  try {
    // Extract public_id from URL if full URL is provided
    const id = publicId.includes('cloudinary.com') 
      ? publicId.split('/').slice(-1)[0].split('.')[0]
      : publicId;
      
    await cloudinary.uploader.destroy(id);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}; 