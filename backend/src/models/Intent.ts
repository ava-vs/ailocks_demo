import { db } from '../models/database';
import { intents, users } from '../db/schema';
import { eq, and, or, isNull, gt, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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
    const [newIntent] = await db.insert(intents).values({
      ...data,
      id: uuidv4()
    }).returning();
    
    const [user] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        city: users.city,
        country: users.country
    }).from(users).where(eq(users.id, data.userId));

    return { ...newIntent, user };
  }

  async findById(id: string) {
    const [intent] = await db.select().from(intents).where(eq(intents.id, id));
    if (!intent) return null;

    const [user] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        city: users.city,
        country: users.country
    }).from(users).where(eq(users.id, intent.userId));

    return { ...intent, user };
  }

  async findUserIntents(userId: string, filters: {
    status?: string;
    type?: string;
    category?: string;
  } = {}) {
    let whereConditions = [eq(intents.userId, userId)];
    
    if (filters.status) whereConditions.push(eq(intents.status, filters.status));
    if (filters.type) whereConditions.push(eq(intents.type, filters.type));
    if (filters.category) whereConditions.push(eq(intents.category, filters.category));

    const intentList = await db.select().from(intents)
      .where(and(...whereConditions))
      .orderBy(sql`${intents.createdAt} DESC`);

    const [user] = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        city: users.city,
        country: users.country
    }).from(users).where(eq(users.id, userId));

    return intentList.map(intent => ({ ...intent, user }));
  }

  async findNearbyIntents(userId: string, filters: {
    radius?: number;
    type?: string;
    category?: string;
  } = {}) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user?.latitude || !user?.longitude) {
      return [];
    }

    let whereConditions = [
        sql`${intents.userId} != ${userId}`,
        eq(intents.status, 'active'),
        or(
            isNull(intents.expiresAt),
            gt(intents.expiresAt, new Date())
        )
    ];

    if (filters.type) whereConditions.push(eq(intents.type, filters.type));
    if (filters.category) whereConditions.push(eq(intents.category, filters.category));

    const intentList = await db.select().from(intents)
      .where(and(...whereConditions))
      .orderBy(sql`${intents.createdAt} DESC`);

    // Get all unique user IDs
    const userIds = [...new Set(intentList.map(i => i.userId))];
    
    // Fetch all users in one query
    const intentUsers = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        latitude: users.latitude,
        longitude: users.longitude,
        city: users.city,
        country: users.country
    }).from(users).where(sql`${users.id} = ANY(${userIds})`);

    // Create a map for quick lookup
    const userMap = new Map(intentUsers.map(u => [u.id, u]));

    const intentsWithUsers = intentList.map(intent => ({
        ...intent,
        user: userMap.get(intent.userId)
    }));

    // Filter by distance if radius is specified
    if (filters.radius) {
      return intentsWithUsers.filter(intent => {
        const intentUser = intent.user;
        if (!intentUser?.latitude || !intentUser?.longitude) return false;
        const distance = this.calculateDistance(
          user.latitude!,
          user.longitude!,
          intentUser.latitude,
          intentUser.longitude
        );
        return distance <= filters.radius!;
      });
    }

    return intentsWithUsers;
  }

  async findByCategory(category: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const intentList = await db.select().from(intents)
      .where(and(
        eq(intents.category, category),
        eq(intents.status, 'active'),
        or(
            isNull(intents.expiresAt),
            gt(intents.expiresAt, new Date())
        )
      ))
      .orderBy(sql`${intents.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Get all unique user IDs
    const userIds = [...new Set(intentList.map(i => i.userId))];
    
    // Fetch all users in one query
    const intentUsers = await db.select({
        id: users.id,
        name: users.name,
        avatar: users.avatar,
        city: users.city,
        country: users.country
    }).from(users).where(sql`${users.id} = ANY(${userIds})`);

    // Create a map for quick lookup
    const userMap = new Map(intentUsers.map(u => [u.id, u]));

    return intentList.map(intent => ({
        ...intent,
        user: userMap.get(intent.userId)
    }));
  }

  async update(id: string, data: UpdateIntentData) {
    const [updatedIntent] = await db.update(intents).set(data).where(eq(intents.id, id)).returning();
    return updatedIntent;
  }

  async delete(id: string) {
    const [deletedIntent] = await db.delete(intents).where(eq(intents.id, id)).returning();
    return deletedIntent;
  }

  async markAsCompleted(id: string) {
    const [updatedIntent] = await db.update(intents).set({ status: 'completed' }).where(eq(intents.id, id)).returning();
    return updatedIntent;
  }

  async markAsCancelled(id: string) {
    const [updatedIntent] = await db.update(intents).set({ status: 'cancelled' }).where(eq(intents.id, id)).returning();
    return updatedIntent;
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