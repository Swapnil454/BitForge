export type DisputeStatus = 'open' | 'under_review' | 'refund_approved' | 'rejected' | 'reopened';

export function mapStatus(backendStatus: string): DisputeStatus {
  if (backendStatus === 'resolved') return 'refund_approved';
  return backendStatus as DisputeStatus;
}
