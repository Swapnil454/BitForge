import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

dotenv.config();

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("=== 1. DB Aggregation Check ===");
    const agg = await Product.aggregate([
      { $group: { _id: "$scanStatus", count: { $sum: 1 } } }
    ]);
    console.log(agg);
    
    console.log("\n=== 2. Test getMalwareScans with Limit 3 ===");
    const query = { scanStatus: { $ne: "PENDING" } };
    const limit = 3;
    const scans = await Product.find(query)
      .populate("sellerId", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .select("title scanStatus virusTotalLink malwareScanDetails sellerId createdAt malwareScanDate");
    
    console.log(`Found ${scans.length} scans for page 1.`);
    
    let nextCursor = null;
    if (scans.length === limit) {
      const lastScan = scans[scans.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ 
        createdAt: lastScan.createdAt.toISOString(), 
        id: lastScan._id.toString() 
      })).toString('base64');
      console.log(`Generated Cursor: ${nextCursor}`);
      
      console.log("\n=== 3. Test getMalwareScans Page 2 ===");
      const { createdAt, id } = JSON.parse(Buffer.from(nextCursor, 'base64').toString('ascii'));
      const query2 = { scanStatus: { $ne: "PENDING" } };
      query2.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $lt: id } }
      ];
      const scansPage2 = await Product.find(query2)
        .populate("sellerId", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .select("title scanStatus virusTotalLink malwareScanDetails sellerId createdAt malwareScanDate");
      console.log(`Found ${scansPage2.length} scans for page 2.`);
      if(scansPage2.length > 0) {
        console.log(`First item on page 2: ${scansPage2[0].title}`);
      }
    }

    console.log("\n=== 4. Test Sanitized Payload ===");
    if (scans.length > 0) {
      const scanId = scans[0]._id;
      const scanDetails = await Product.findById(scanId)
        .populate("sellerId", "name email")
        .select("title scanStatus scanLockedAt virusTotalLink malwareScanDate createdAt malwareScanDetails");
      
      let sanitizedDetails = null;
      if (scanDetails?.malwareScanDetails) {
        sanitizedDetails = {
          scan_date: scanDetails.malwareScanDetails.scan_date,
          total_engines: scanDetails.malwareScanDetails.total_engines,
          malicious_count: scanDetails.malwareScanDetails.detections?.malicious || 0,
          suspicious_count: scanDetails.malwareScanDetails.detections?.suspicious || 0,
          harmless_count: scanDetails.malwareScanDetails.detections?.harmless || 0,
          undetected_count: scanDetails.malwareScanDetails.detections?.undetected || 0,
          threat_category: scanDetails.malwareScanDetails.threat_category,
          basicCheckOnly: scanDetails.malwareScanDetails.basicCheckOnly
        };
      }
      console.log("Sanitized details:", sanitizedDetails);
      console.log("Is raw VT data leaked?", Object.keys(sanitizedDetails).includes("scans") || Object.keys(sanitizedDetails).includes("detections") ? "YES" : "NO");
    }

    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
};

verify();
