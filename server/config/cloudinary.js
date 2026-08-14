/**
 * Cloudinary Integration Helper
 * Handles image uploads and permanent deletions on Cloudinary
 */
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mufina',
  api_key: process.env.CLOUDINARY_API_KEY || '116367496164882',
  api_secret: process.env.CLOUDINARY_API_SECRET || '1TqfhxCkqrZWlTE0Ot3DwE0uD98'
});

/**
 * Upload an image (base64 string, file path, or URL) to Cloudinary
 * @param {string} fileInput - Image base64 string, data URL, or file path
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{imageUrl: string, publicId: string}>}
 */
const uploadToCloudinary = async (fileInput, folder = 'mufina_artistry') => {
  try {
    if (!fileInput) return { imageUrl: '', publicId: '' };

    // If it's already a Cloudinary URL or plain local relative path and not a new upload/base64:
    if (typeof fileInput === 'string' && fileInput.startsWith('http') && fileInput.includes('cloudinary.com')) {
      // Extract publicId if possible or return as is
      const parts = fileInput.split('/');
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split('.')[0];
      const folderName = parts[parts.length - 2];
      const publicId = folderName && folderName !== 'upload' ? `${folderName}/${filename}` : filename;
      return { imageUrl: fileInput, publicId };
    }

    // Upload new image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(fileInput, {
      folder: folder,
      resource_type: 'auto'
    });

    return {
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error.message);
    throw new Error('Cloudinary image upload failed: ' + error.message);
  }
};

/**
 * Permanently delete an image from Cloudinary using its public ID
 * @param {string} publicId - Cloudinary image public ID
 * @returns {Promise<boolean>}
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return true;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`🗑️ Cloudinary Delete Result for ${publicId}:`, result);
    return result.result === 'ok' || result.result === 'not found';
  } catch (error) {
    console.error(`❌ Cloudinary Delete Error for ${publicId}:`, error.message);
    throw new Error('Cloudinary image deletion failed: ' + error.message);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary
};
