export interface JoinRequest 
{
  _id: string;
  groupName: string;
  username: string;
  age: number;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}