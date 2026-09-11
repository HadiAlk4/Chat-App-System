export interface RoomRequest {
  _id?: string;
  groupName: string;
  roomName: string;
  username: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | Date;
  reviewedAt?: string | Date;
  rejectionReason?: string;
  rejectReason?: string;
}
