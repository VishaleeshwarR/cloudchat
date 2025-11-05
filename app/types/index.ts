import { Conversation, Message, User } from "@prisma/client";

export type FullMessageType = Message & {
  sender: User | null;
  seenRecords: (SeenRecord & { user: User })[];
};

export type FullConversationType = Conversation & {
    users: User[],
    messages: FullMessageType[]
}
