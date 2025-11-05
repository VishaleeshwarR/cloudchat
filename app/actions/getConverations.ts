import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversations = async () => {
  const currentUser = await getCurrentUser();

  if (!currentUser?.id) {
    return [];
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: {
        participants: {
          include: { user: true },
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
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return conversations;
  } catch (error) {
    console.error("[GET_CONVERSATIONS_ERROR]", error);
    return [];
  }
};

export default getConversations;
