import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

interface IParams {
  conversationId?: string;
}

export async function DELETE(
  request: Request,
  { params }: { params: IParams }
) {
  try {
    const currentUser = await getCurrentUser();
    const { conversationId } = params;

    if (!currentUser?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const existingConversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingConversation) {
      return new Response("Invalid ID", { status: 400 });
    }

    // ✅ Check if the user is a participant before deleting
    const isParticipant = existingConversation.participants.some(
      (p) => p.userId === currentUser.id
    );

    if (!isParticipant) {
      return new Response("Unauthorized", { status: 401 });
    }

    const deletedConversation = await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: currentUser.id,
          },
        },
      },
    });

    return new Response(JSON.stringify(deletedConversation), { status: 200 });
  } catch (error) {
    console.error("[CONVERSATION_DELETE_ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
