export type ChatMessagePayload = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  status?: "sent" | "delivered" | "seen";
  seenAt?: string;
  clientMessageId?: string;
};
