export type ScanStatus = "PENDING" | "SCANNING" | "CLEAN" | "FLAGGED" | "MALICIOUS" | "SCAN_FAILED" | "MANUALLY_REVIEWED";

export type ScanReportPayload = {
  _id: string;
  title: string;
  scanStatus: ScanStatus;
  scanLockedAt?: string;
  virusTotalLink?: string;
  malwareScanDate?: string;
  createdAt: string;
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  malwareScanDetails?: {
    scan_date?: string;
    total_engines?: number;
    malicious_count: number;
    suspicious_count: number;
    harmless_count: number;
    undetected_count: number;
    threat_category?: string;
    basicCheckOnly?: boolean;
  };
  sellerNotifiedAt?: string | null;
};
