export interface ChatMessage {
  _id?: string;
  groupName: string;
  roomName: string;
  senderUserName: string;
  content: string;
  timestamp: string | Date;
}
