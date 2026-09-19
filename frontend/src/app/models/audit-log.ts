export interface AuditLog {
  _id?: string;
  timeStamp: string | Date;
  actionPerformed: string;
  target: string;
  performedBy?: string;
}
