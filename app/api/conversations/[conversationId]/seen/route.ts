import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

interface IParams {
  conversationId?: string;
}

export async function POST(
  request: Request,
  { params }: { params: IParams }
) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId } = params;

    if (!currentUser?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ✅ Fetch the conversation and its messages
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          include: {
            sender: true,
            seenRecords: {
              include: { user: true },
            },
          },
        },
        participants: {
          include: { user: true },
        },
      },
    });

    if (!conversation) {
      return new Response("Invalid conversation ID", { status: 400 });
    }

    // ✅ Get the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    if (!lastMessage) {
      return new Response("No messages found", { status: 200 });
    }

    // ✅ Check if already seen by user
    const alreadySeen = await prisma.seenRecord.findFirst({
      where: {
        userId: currentUser.id,
        messageId: lastMessage.id,
      },
    });

    if (!alreadySeen) {
      await prisma.seenRecord.create({
        data: {
          userId: currentUser.id,
          messageId: lastMessage.id,
        },
      });
    }

    // ✅ Re-fetch updated message
    const updatedMessage = await prisma.message.findUnique({
      where: { id: lastMessage.id },
      include: {
        sender: true,
        seenRecords: {
          include: { user: true },
        },
      },
    });

    return new Response(JSON.stringify(updatedMessage), { status: 200 });
  } catch (error) {
    console.error("[SEEN_POST_ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
