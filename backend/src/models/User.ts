import { db } from '../models/database';
import { users } from '../db/schema';
import { eq, and, not, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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
    const [newUser] = await db.insert(users).values({
      ...data,
      id: uuidv4()
    }).returning();
    return newUser;
  }

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async update(id: string, data: UpdateUserData) {
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async updateLocation(id: string, location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }) {
    const [updatedUser] = await db.update(users).set({
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      country: location.country
    }).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async findNearby(userId: string, radiusKm: number) {
    const user = await this.findById(userId);
    if (!user?.latitude || !user?.longitude) {
      return [];
    }

    const allUsers = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        latitude: users.latitude,
        longitude: users.longitude,
        city: users.city,
        country: users.country,
        status: users.status,
    }).from(users).where(and(
        not(eq(users.id, userId)),
        isNotNull(users.latitude),
        isNotNull(users.longitude),
        not(eq(users.status, 'offline'))
    ));

    // Filter by distance (simplified calculation)
    return allUsers.filter(u => {
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
    const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning();
    return deletedUser;
  }
}