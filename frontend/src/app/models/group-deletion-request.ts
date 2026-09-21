export interface GroupDeletionRequest {
  _id?: string;
  groupName: string;
  requestedBy: string;
  requestedByRole: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string | Date;
  reviewedAt?: string | Date;
  rejectionReason?: string;
}
