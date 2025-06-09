import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateIntentData {
  title: string;
  description: string;
  type: string;
  category: string;
  location?: string;
  userId: string;
  expiresAt?: Date;
}

export interface UpdateIntentData {
  title?: string;
  description?: string;
  type?: string;
  category?: string;
  location?: string;
  status?: string;
  expiresAt?: Date;
}

export class IntentModel {
  async create(data: CreateIntentData) {
    return await prisma.intent.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            country: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return await prisma.intent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            country: true
          }
        }
      }
    });
  }

  async findUserIntents(userId: string, filters: {
    status?: string;
    type?: string;
    category?: string;
  } = {}) {
    const where: any = { userId };
    
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;

    return await prisma.intent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findNearbyIntents(userId: string, filters: {
    radius?: number;
    type?: string;
    category?: string;
  } = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true }
    });

    if (!user?.latitude || !user?.longitude) {
      return [];
    }

    const where: any = {
      AND: [
        { userId: { not: userId } },
        { status: 'active' },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    };

    if (filters.type) where.AND.push({ type: filters.type });
    if (filters.category) where.AND.push({ category: filters.category });

    const intents = await prisma.intent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            latitude: true,
            longitude: true,
            city: true,
            country: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter by distance if radius is specified
    if (filters.radius) {
      return intents.filter(intent => {
        if (!intent.user.latitude || !intent.user.longitude) return false;
        const distance = this.calculateDistance(
          user.latitude!,
          user.longitude!,
          intent.user.latitude,
          intent.user.longitude
        );
        return distance <= filters.radius!;
      });
    }

    return intents;
  }

  async findByCategory(category: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    return await prisma.intent.findMany({
      where: {
        AND: [
          { category },
          { status: 'active' },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            country: true
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

  async update(id: string, data: UpdateIntentData) {
    return await prisma.intent.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await prisma.intent.delete({
      where: { id }
    });
  }

  async markAsCompleted(id: string) {
    return await prisma.intent.update({
      where: { id },
      data: { status: 'completed' }
    });
  }

  async markAsCancelled(id: string) {
    return await prisma.intent.update({
      where: { id },
      data: { status: 'cancelled' }
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }
}