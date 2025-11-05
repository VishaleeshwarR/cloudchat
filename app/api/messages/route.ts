import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { message, image, conversationId } = body;

    if (!currentUser?.id || !currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ✅ Create new message
    const newMessage = await prisma.message.create({
      data: {
        body: message,
        image: image,
        conversation: {
          connect: { id: conversationId },
        },
        sender: {
          connect: { id: currentUser.id },
        },
      },
      include: {
        sender: true,
        seenRecords: {
          include: {
            user: true,
          },
        },
      },
    });

    // ✅ Mark sender as having "seen" their own message
    await prisma.seenRecord.create({
      data: {
        userId: currentUser.id,
        messageId: newMessage.id,
      },
    });

    // ✅ Update conversation last message timestamp
    const updatedConversation = await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessageAt: new Date(),
      },
      include: {
        participants: {
          include: { user: true },
        },
        messages: {
          include: {
            sender: true,
            seenRecords: { include: { user: true } },
          },
        },
      },
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("[MESSAGES_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
