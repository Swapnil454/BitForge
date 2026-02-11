


import cloudinary from "../config/cloudinary.js";

/**
 * Generate signed URL for authenticated Cloudinary resources
 * Used for secure, time-limited access to purchased products
 * 
 * @param {string} publicId - Cloudinary public_id of the file
 * @param {string} filename - Optional filename for download
 * @returns {string} Signed URL with 5-minute expiration
 */
export const generateSignedUrl = (publicId, filename = null) => {
  const options = {
    resource_type: "raw",
    type: "authenticated",  // 🔐 Must match upload type
    expires_at: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
    attachment: true, // Force download instead of display
  };

  // Add filename if provided
  if (filename) {
    options.attachment = filename;
  }

  return cloudinary.utils.private_download_url(
    publicId,
    "",
    options
  );
};
