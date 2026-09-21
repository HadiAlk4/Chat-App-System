export interface GroupBanRequest {
  _id?: string;
  groupName: string;
  targetUsername: string;
  targetEmail: string;
  targetRole: string;
  requestedBy: string;
  requestedByRole: string;
  destination: 'group-admin' | 'super-admin';
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string | Date;
  reviewedAt?: string | Date;
  rejectionReason?: string;
}
