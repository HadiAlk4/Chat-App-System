export interface AccountDeletionRequest {
  _id?: string;
  username: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string | Date;
  reviewedAt?: string | Date;
  rejectionReason?: string;
}
