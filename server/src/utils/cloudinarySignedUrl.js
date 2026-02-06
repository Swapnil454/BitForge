


import cloudinary from "../config/cloudinary.js";

export const generateSignedUrl = (publicId) => {
  return cloudinary.utils.private_download_url(
    publicId,
    "",
    {
      resource_type: "raw",
      expires_at: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
    }
  );
};
