


import cloudinary from "../config/cloudinary.js";

export const generateSignedUrl = (publicId, filename = null) => {
  const options = {
    resource_type: "raw",
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
