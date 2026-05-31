import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import r2Client, { R2_BUCKET_NAME } from "../config/r2.js";

/**
 * Generates a pre-signed URL for downloading a file from Cloudflare R2
 * @param {String} fileKey - The R2 key of the file
 * @param {String} filename - Optional filename for the download
 * @returns {String} The signed URL
 */
export const getR2SignedDownloadUrl = async (fileKey, filename) => {
  if (!fileKey) {
    throw new Error("Missing fileKey for R2 download.");
  }

  const params = {
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  };

  if (filename) {
    // Force the browser to download the file with the correct name
    params.ResponseContentDisposition = `attachment; filename="${filename}"`;
  }

  const command = new GetObjectCommand(params);

  // URL expires in 5 minutes (300 seconds)
  const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  return signedUrl;
};

/**
 * Fetches a file from Cloudflare R2 into memory (Buffer)
 * Used primarily for small files that need to be watermarked
 * @param {String} fileKey - The R2 key of the file
 * @returns {Buffer} The file data buffer
 */
export const fetchR2FileToBuffer = async (fileKey) => {
  if (!fileKey) {
    throw new Error("Missing fileKey for R2 fetch.");
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
  });

  const response = await r2Client.send(command);
  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
};
