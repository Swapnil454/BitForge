/**
 * VirusTotal Integration for Real Malware Scanning
 * Scans uploaded files for viruses, malware, and security threats
 */

import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const VIRUSTOTAL_API_URL = "https://www.virustotal.com/api/v3";

/**
 * Scan a file using VirusTotal API
 * @param {Buffer} fileBuffer - File buffer to scan
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Scan result with threat status
 */
export async function scanFileWithVirusTotal(fileBuffer, filename) {
  // If no API key is configured, fall back to basic checks
  if (!VIRUSTOTAL_API_KEY) {
    console.warn("VirusTotal API key not configured. Falling back to basic checks.");
    return performBasicFileCheck(fileBuffer, filename);
  }

  try {
    // Calculate file hash for quick lookup
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // First, try to get existing scan results by hash
    const existingReport = await checkFileHashReport(fileHash);
    if (existingReport) {
      return existingReport;
    }

    // If no existing report, upload and scan the file
    const scanResult = await uploadFileForScanning(fileBuffer, filename);
    return scanResult;
    
  } catch (error) {
    console.error("VirusTotal scan error:", error.message);
    
    // On error, fall back to basic checks
    return performBasicFileCheck(fileBuffer, filename);
  }
}

/**
 * Check if file hash already has a VirusTotal report
 * @param {string} fileHash - SHA256 hash of the file
 * @returns {Promise<Object|null>} Existing scan result or null
 */
async function checkFileHashReport(fileHash) {
  try {
    const response = await axios.get(
      `${VIRUSTOTAL_API_URL}/files/${fileHash}`,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY
        },
        timeout: 30000
      }
    );

    if (response.data && response.data.data) {
      const stats = response.data.data.attributes.last_analysis_stats;
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      
      return {
        scanned: true,
        clean: malicious === 0 && suspicious === 0,
        scanDate: new Date(),
        virusTotalId: response.data.data.id,
        detections: {
          malicious: malicious,
          suspicious: suspicious,
          undetected: stats.undetected || 0,
          harmless: stats.harmless || 0
        },
        scanLink: `https://www.virustotal.com/gui/file/${fileHash}`,
        reason: malicious > 0 ? `Detected ${malicious} malicious threats` : 
                suspicious > 0 ? `Detected ${suspicious} suspicious threats` : "Clean"
      };
    }

    return null;
  } catch (error) {
    // 404 means file not found in database - need to upload
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Upload file to VirusTotal for scanning
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Upload and scan result
 */
async function uploadFileForScanning(fileBuffer, filename) {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    // Upload file
    const uploadResponse = await axios.post(
      `${VIRUSTOTAL_API_URL}/files`,
      formData,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 120000 // 2 minutes for large files
      }
    );

    if (!uploadResponse.data || !uploadResponse.data.data) {
      throw new Error("Invalid response from VirusTotal");
    }

    const analysisId = uploadResponse.data.data.id;
    const fileHash = uploadResponse.data.data.id.split('-')[0];

    // Wait a few seconds for initial scan
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get analysis results
    const analysisResponse = await axios.get(
      `${VIRUSTOTAL_API_URL}/analyses/${analysisId}`,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY
        },
        timeout: 30000
      }
    );

    if (analysisResponse.data && analysisResponse.data.data) {
      const stats = analysisResponse.data.data.attributes.stats;
      const malicious = stats.malicious || 0;
      const suspicious = stats.suspicious || 0;
      
      return {
        scanned: true,
        clean: malicious === 0 && suspicious === 0,
        scanDate: new Date(),
        virusTotalId: analysisId,
        detections: {
          malicious: malicious,
          suspicious: suspicious,
          undetected: stats.undetected || 0,
          harmless: stats.harmless || 0
        },
        scanLink: `https://www.virustotal.com/gui/file/${fileHash}`,
        reason: malicious > 0 ? `Detected ${malicious} malicious threats` : 
                suspicious > 0 ? `Detected ${suspicious} suspicious threats` : "Clean"
      };
    }

    // If scan is still in progress, mark as pending
    return {
      scanned: true,
      clean: true, // Assume clean until proven otherwise
      scanDate: new Date(),
      virusTotalId: analysisId,
      scanPending: true,
      reason: "Scan in progress"
    };

  } catch (error) {
    console.error("VirusTotal upload error:", error.message);
    throw error;
  }
}

/**
 * Perform basic file safety checks (fallback when VirusTotal unavailable)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @returns {Object} Basic scan result
 */
function performBasicFileCheck(fileBuffer, filename) {
  try {
    // Check file size
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileBuffer.length > maxSize) {
      return {
        scanned: true,
        clean: false,
        scanDate: new Date(),
        reason: "File too large (max 500MB)",
        basicCheckOnly: true
      };
    }
    
    // Check for suspicious file extensions
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
      '.dll', '.sys', '.com', '.scr', '.pif', '.app', '.deb', '.rpm'
    ];
    
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (suspiciousExtensions.includes(ext)) {
      return {
        scanned: true,
        clean: false,
        scanDate: new Date(),
        reason: "Suspicious file extension detected",
        basicCheckOnly: true
      };
    }
    
    // Check file magic numbers (basic file type validation)
    const magicNumbers = {
      pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
      zip: [0x50, 0x4B, 0x03, 0x04], // PK..
      exe: [0x4D, 0x5A] // MZ
    };
    
    // Prevent executable uploads
    if (fileBuffer.length >= 2) {
      const firstBytes = [fileBuffer[0], fileBuffer[1]];
      if (firstBytes[0] === 0x4D && firstBytes[1] === 0x5A) {
        return {
          scanned: true,
          clean: false,
          scanDate: new Date(),
          reason: "Executable file detected",
          basicCheckOnly: true
        };
      }
    }
    
    return {
      scanned: true,
      clean: true,
      scanDate: new Date(),
      reason: "Basic checks passed (no VirusTotal scan)",
      basicCheckOnly: true
    };
  } catch (error) {
    console.error("Basic file check error:", error);
    return {
      scanned: false,
      clean: false,
      scanDate: new Date(),
      reason: "Security check failed",
      basicCheckOnly: true
    };
  }
}

/**
 * Get scan report by analysis ID
 * Useful for checking status of pending scans
 * @param {string} analysisId - VirusTotal analysis ID
 * @returns {Promise<Object>} Current scan status
 */
export async function getScanReport(analysisId) {
  if (!VIRUSTOTAL_API_KEY) {
    return { error: "VirusTotal API key not configured" };
  }

  try {
    const response = await axios.get(
      `${VIRUSTOTAL_API_URL}/analyses/${analysisId}`,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY
        },
        timeout: 30000
      }
    );

    if (response.data && response.data.data) {
      const status = response.data.data.attributes.status;
      const stats = response.data.data.attributes.stats;
      
      return {
        status: status, // "queued", "in-progress", "completed"
        stats: stats,
        completed: status === "completed"
      };
    }

    return { error: "Invalid response" };
  } catch (error) {
    console.error("Get scan report error:", error.message);
    return { error: error.message };
  }
}
