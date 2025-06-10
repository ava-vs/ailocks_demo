import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel, CreateUserData } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

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
    return await this.comparePassword(password, hashedPassword);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userModel.findByEmail(email);
    if (!user) return null;

    const isValid = await this.comparePassword(password, user.password);
    return isValid ? user : null;
  }

  async generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, JWT_SECRET);
    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET);

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      return await this.generateTokens(decoded.userId);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async revokeToken(refreshToken: string) {
    // In production, store revoked tokens in Redis or database
    // For now, we'll just validate the token
    try {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}