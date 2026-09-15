export interface ChatMessage {
  _id?: string;
  groupName: string;
  roomName: string;
  senderUserName: string;
  content?: string;
  imageUrl?: string;
  timestamp: string | Date;
}
