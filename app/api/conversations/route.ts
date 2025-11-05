import prisma from "@/app/libs/prismadb";
import getCurrentUser from "@/app/actions/getCurrentUser";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // ✅ Fetch all conversations where the current user is a participant
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
          include: {
            user: true, // Include full user info for participants
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
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return new Response(JSON.stringify(conversations), { status: 200 });
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id || !currentUser?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { userId, isGroup, members, name } = body;

    if (isGroup && (!members || members.length < 2 || !name)) {
      return new Response("Invalid group data", { status: 400 });
    }

    if (isGroup) {
      const newConversation = await prisma.conversation.create({
        data: {
          name,
          isGroup: true,
          participants: {
            create: [
              ...members.map((member: { id: string }) => ({
                userId: member.id,
              })),
              { userId: currentUser.id },
            ],
          },
        },
        include: {
          participants: { include: { user: true } },
          messages: true,
        },
      });

      return new Response(JSON.stringify(newConversation), { status: 200 });
    }

    // 🟢 For one-on-one conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [currentUser.id, userId] },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    if (existingConversation) {
      return new Response(JSON.stringify(existingConversation), { status: 200 });
    }

    const newConversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: currentUser.id }, { userId }],
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: true,
      },
    });

    return new Response(JSON.stringify(newConversation), { status: 200 });
  } catch (error) {
    console.error("[CONVERSATIONS_POST]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
