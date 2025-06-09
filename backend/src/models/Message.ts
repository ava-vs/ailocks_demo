import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateMessageData {
  content: string;
  type: string;
  senderId: string;
  chatId: string;
  metadata?: string;
}

export class MessageModel {
  async create(data: CreateMessageData) {
    return await prisma.message.create({
      data,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        chat: true
      }
    });
  }

  async findChatMessages(chatId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    return await prisma.message.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
  }

  async update(id: string, data: Partial<CreateMessageData>) {
    return await prisma.message.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await prisma.message.delete({
      where: { id }
    });
  }

  async getMessageCount(chatId: string) {
    return await prisma.message.count({
      where: { chatId }
    });
  }

  async searchMessages(chatId: string, query: string) {
    return await prisma.message.findMany({
      where: {
        AND: [
          { chatId },
          {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}