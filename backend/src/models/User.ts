import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  status?: string;
}

export class UserModel {
  async create(data: CreateUserData) {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        avatar: data.avatar
      }
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        chatParticipants: {
          include: {
            chat: true
          }
        },
        intents: {
          where: {
            status: 'active'
          }
        }
      }
    });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id: string, data: UpdateUserData) {
    return await prisma.user.update({
      where: { id },
      data
    });
  }

  async updateLocation(id: string, location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }) {
    return await prisma.user.update({
      where: { id },
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country
      }
    });
  }

  async findNearby(userId: string, radiusKm: number) {
    const user = await this.findById(userId);
    if (!user?.latitude || !user?.longitude) {
      return [];
    }

    // Simple distance calculation (for production, use PostGIS or similar)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { latitude: { not: null } },
          { longitude: { not: null } },
          { status: { not: 'offline' } }
        ]
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        latitude: true,
        longitude: true,
        city: true,
        country: true,
        status: true
      }
    });

    // Filter by distance (simplified calculation)
    return users.filter(u => {
      if (!u.latitude || !u.longitude) return false;
      const distance = this.calculateDistance(
        user.latitude!,
        user.longitude!,
        u.latitude,
        u.longitude
      );
      return distance <= radiusKm;
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

  async delete(id: string) {
    return await prisma.user.delete({
      where: { id }
    });
  }
}