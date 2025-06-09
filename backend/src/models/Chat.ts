import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateChatData {
  name?: string;
  mode: string;
  creatorId: string;
}

export interface UpdateChatData {
  name?: string;
  mode?: string;
}

export class ChatModel {
  async create(data: CreateChatData) {
    return await prisma.chat.create({
      data: {
        name: data.name,
        mode: data.mode,
        participants: {
          create: {
            userId: data.creatorId,
            role: 'admin'
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
  }

  async findById(id: string) {
    return await prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    });
  }

  async findUserChats(userId: string) {
    return await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                status: true
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });
  }

  async update(id: string, data: UpdateChatData) {
    return await prisma.chat.update({
      where: { id },
      data: {
        ...data,
        lastActivity: new Date()
      }
    });
  }

  async addParticipant(chatId: string, userId: string, role: string = 'member') {
    return await prisma.chatParticipant.create({
      data: {
        chatId,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            status: true
          }
        }
      }
    });
  }

  async removeParticipant(chatId: string, userId: string) {
    return await prisma.chatParticipant.delete({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });
  }

  async isParticipant(chatId: string, userId: string) {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });
    return !!participant;
  }

  async isAdmin(chatId: string, userId: string) {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId
        }
      }
    });
    return participant?.role === 'admin';
  }

  async delete(id: string) {
    return await prisma.chat.delete({
      where: { id }
    });
  }

  async updateLastActivity(id: string) {
    return await prisma.chat.update({
      where: { id },
      data: {
        lastActivity: new Date()
      }
    });
  }
}