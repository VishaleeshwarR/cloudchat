import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversationById = async (conversationId: string) => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    return null;
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participants: {
          include: {
            user: true, // 👈 loads full user info for each participant
          },
        },
        messages: {
          include: {
            sender: true,
            seenRecords: {
              include: { user: true },
            },
          },
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error("[GET_CONVERSATION_BY_ID_ERROR]", error);
    return null;
  }
};

export default getConversationById;
