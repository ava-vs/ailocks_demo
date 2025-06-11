import { db } from '../models/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, CreateUserData } from '../models/User';
import config from '../config';

export class AuthService {
  private userModel = new UserModel();

  async findUserByEmail(email: string) {
    return await this.userModel.findByEmail(email);
  }

  async findUserById(id: string) {
    return await this.userModel.findById(id);
  }

  async createUser(data: CreateUserData) {
    const hashedPassword = await this.hashPassword(data.password);
    return await this.userModel.create({
      ...data,
      password: hashedPassword
    });
  }

  async updateUserStatus(userId: string, status: string) {
    return await this.userModel.update(userId, { status });
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async generateTokens(user: { id: string, name: string | null, email: string }) {
    const payload = { 
      userId: user.id,
      name: user.name,
      email: user.email
    };
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      if (!decoded.userId) {
        throw new Error('Invalid refresh token');
      }

      const accessToken = jwt.sign({ userId: decoded.userId }, config.jwt.secret, { expiresIn: '15m' });
      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async revokeToken(refreshToken: string) {
    // In a real app, you would add the token to a blacklist (e.g., in Redis)
    // For this demo, we'll just log it.
    console.log(`Token revoked (simulation): ${refreshToken}`);
    return Promise.resolve();
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
}