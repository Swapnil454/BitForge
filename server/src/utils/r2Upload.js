import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import r2Client, { R2_BUCKET_NAME } from "../config/r2.js";

/**
 * Uploads a file buffer to Cloudflare R2
 * @param {Object} file - The file object from Multer (contains buffer, originalname, mimetype, size)
 * @param {String} productId - The product ID to structure the path
 * @returns {Object} Upload result containing fileKey, fileName, fileSize, fileType, storageProvider
 */
export const uploadToR2 = async (file, productId) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file object provided for R2 upload.");
  }

  const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const timestamp = Date.now();
  const uuid = uuidv4();
  const fileKey = `products/${productId}/${timestamp}-${uuid}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(command);

  return {
    fileKey,
    fileName: safeFilename,
    fileSize: file.size,
    fileType: file.mimetype,
    storageProvider: "r2",
  };
};

/**
 * Deletes a file from Cloudflare R2
 * @param {String} fileKey - The key of the file in R2
 */
export const deleteFromR2 = async (fileKey) => {
  if (!fileKey) return;
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileKey,
    });
    
    await r2Client.send(command);
    console.log(`Successfully deleted ${fileKey} from R2`);
  } catch (error) {
    console.error(`Failed to delete ${fileKey} from R2:`, error);
    throw error;
  }
};
