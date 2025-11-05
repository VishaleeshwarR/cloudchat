import prisma from "@/app/libs/prismadb";

const getMessages = async (conversationId: string) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      include: {
        sender: true,
        seenRecords: {
          include: {
            user: true, // 👈 includes users who have seen this message
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  } catch (error) {
    console.error("[GET_MESSAGES_ERROR]", error);
    return [];
  }
};

export default getMessages;
