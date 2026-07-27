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

export default cloudinary;
