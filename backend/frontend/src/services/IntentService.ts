import { IntentModel, CreateIntentData, UpdateIntentData } from '../models/Intent';

export class IntentService {
  private intentModel = new IntentModel();

  async create(data: CreateIntentData) {
    return await this.intentModel.create(data);
  }

  async findById(id: string) {
    return await this.intentModel.findById(id);
  }

  async getUserIntents(userId: string, filters: {
    status?: string;
    type?: string;
    category?: string;
  } = {}) {
    return await this.intentModel.findUserIntents(userId, filters);
  }

  async getNearbyIntents(userId: string, filters: {
    radius?: number;
    type?: string;
    category?: string;
  } = {}) {
    return await this.intentModel.findNearbyIntents(userId, filters);
  }

  async getByCategory(category: string, page: number = 1, limit: number = 20) {
    return await this.intentModel.findByCategory(category, page, limit);
  }

  async update(id: string, userId: string, data: UpdateIntentData) {
    const intent = await this.intentModel.findById(id);
    if (!intent) {
      throw new Error('Intent not found');
    }

    if (intent.userId !== userId) {
      throw new Error('Access denied: Can only edit your own intents');
    }

    return await this.intentModel.update(id, data);
  }

  async delete(id: string, userId: string) {
    const intent = await this.intentModel.findById(id);
    if (!intent) {
      throw new Error('Intent not found');
    }

    if (intent.userId !== userId) {
      throw new Error('Access denied: Can only delete your own intents');
    }

    return await this.intentModel.delete(id);
  }

  async respondToIntent(intentId: string, userId: string, message: string) {
    const intent = await this.intentModel.findById(intentId);
    if (!intent) {
      throw new Error('Intent not found');
    }

    if (intent.userId === userId) {
      throw new Error('Cannot respond to your own intent');
    }

    if (intent.status !== 'active') {
      throw new Error('Intent is not active');
    }

    // In a real implementation, this would create a chat or notification
    // For now, we'll just return a success response
    return {
      success: true,
      message: 'Response sent successfully',
      intentId,
      responderId: userId
    };
  }

  async markAsCompleted(id: string, userId: string) {
    const intent = await this.intentModel.findById(id);
    if (!intent) {
      throw new Error('Intent not found');
    }

    if (intent.userId !== userId) {
      throw new Error('Access denied: Can only complete your own intents');
    }

    return await this.intentModel.markAsCompleted(id);
  }

  async markAsCancelled(id: string, userId: string) {
    const intent = await this.intentModel.findById(id);
    if (!intent) {
      throw new Error('Intent not found');
    }

    if (intent.userId !== userId) {
      throw new Error('Access denied: Can only cancel your own intents');
    }

    return await this.intentModel.markAsCancelled(id);
  }
}