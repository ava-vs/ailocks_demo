import * as bcrypt from 'bcryptjs';
import { UserModel, CreateUserData, UpdateUserData } from '../models/User';

export class UserService {
  private userModel = new UserModel();

  async create(data: CreateUserData) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await this.userModel.create({
      ...data,
      password: hashedPassword,
    });
  }

  async findById(id: string) {
    return await this.userModel.findById(id);
  }

  async findByEmail(email: string) {
    return await this.userModel.findByEmail(email);
  }

  async update(id: string, data: UpdateUserData) {
    return await this.userModel.update(id, data);
  }

  async updateLocation(id: string, location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  }) {
    return await this.userModel.updateLocation(id, location);
  }

  async updateStatus(id: string, status: string) {
    return await this.userModel.update(id, { status });
  }

  async getNearbyUsers(userId: string, radiusKm: number) {
    return await this.userModel.findNearby(userId, radiusKm);
  }

  async delete(id: string) {
    return await this.userModel.delete(id);
  }
}