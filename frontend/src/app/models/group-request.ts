export interface GroupRequest 
{
    _id?: string;
    groupName: string;
    groupDescription: string;
    minAge: number;
    themeColor: 'light' | 'dark';
    creatorUserName: string;
    creatorEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    createdAt?: string;
    reviewedAt?: string;  
}
