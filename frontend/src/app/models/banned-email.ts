export interface BannedEmail {
  _id?: string;
  email: string;
  username?: string;
  bannedAt?: string | Date;
  reason?: string;
}
