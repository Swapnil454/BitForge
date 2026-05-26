import { fileTypeFromBuffer } from 'file-type';
import { PDFDocument } from 'pdf-lib';

const ALLOWED_IDENTITY_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateIdentityDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No documents uploaded." });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ message: "Maximum 5 documents allowed." });
    }

    for (const file of req.files) {
      // 1. Size check
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({ message: `File ${file.originalname} exceeds the 10MB limit.` });
      }

      // 2. Magic bytes check
      const detected = await fileTypeFromBuffer(file.buffer);
      if (!detected || !ALLOWED_IDENTITY_MIME_TYPES.includes(detected.mime)) {
        return res.status(400).json({ message: `Invalid file type for ${file.originalname}. Only JPEG, PNG, and PDF are allowed.` });
      }

      // Enforce extension matches magic bytes
      const fileExt = file.originalname.split('.').pop().toLowerCase();
      const extMap = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'application/pdf': ['pdf']
      };
      if (!extMap[detected.mime].includes(fileExt)) {
        return res.status(400).json({ message: `File extension mismatch for ${file.originalname}. Expected ${detected.mime} format.` });
      }

      // 3. Deep PDF inspection
      if (detected.mime === 'application/pdf') {
        try {
          await PDFDocument.load(file.buffer, { ignoreEncryption: false });
        } catch (err) {
          return res.status(400).json({ message: `Invalid or potentially malicious PDF: ${file.originalname}` });
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error validating identity documents:", error);
    res.status(500).json({ message: "File validation failed." });
  }
};
