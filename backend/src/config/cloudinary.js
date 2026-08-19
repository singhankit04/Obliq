import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    let resourceType = 'auto';
    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video';
    } else {
      resourceType = 'raw';
    }

    const cleanFileName = originalName ? originalName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'attachment';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'obliq/comments',
        resource_type: resourceType,
        public_id: `${Date.now()}_${cleanFileName}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          fileUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const uploadAvatarToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const cleanFileName = originalName ? originalName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'avatar';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'obliq/avatars',
        resource_type: 'image',
        public_id: `${Date.now()}_${cleanFileName}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' }
        ],
      },
      (error, result) => {
        if (error) return reject(error);
      
        resolve({
          avatarUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Extract Cloudinary public_id from a secure_url if not stored directly
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  // Match after /upload/(v<version>/)? up to the file extension
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return matches ? matches[1] : null;
};

/**
 * Delete a media asset from Cloudinary
 */
export const deleteFromCloudinary = async (publicIdOrUrl, resourceType = 'image') => {
  if (!publicIdOrUrl) return null;
  const publicId = publicIdOrUrl.startsWith('http')
    ? extractPublicIdFromUrl(publicIdOrUrl)
    : publicIdOrUrl;

  if (!publicId) return null;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result;
  } catch (error) {
    console.error(`Failed to delete asset ${publicId} from Cloudinary:`, error);
    return null;
  }
};

export default cloudinary;
