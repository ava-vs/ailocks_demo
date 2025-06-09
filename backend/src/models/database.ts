import { PrismaClient } from '@prisma/client';

class DatabaseWrapper {
  private prisma: PrismaClient | null = null;
  private fallbackStore: Map<string, any> = new Map();
  private useFallback = false;

  async initialize() {
    try {
      console.log('🔄 Initializing Prisma Client...');
      this.prisma = new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      });

      // Test connection
      await this.prisma.$connect();
      console.log('✅ Prisma Client connected successfully');
      
    } catch (error) {
      console.warn('⚠️ Prisma initialization failed, using fallback mode:', error.message);
      this.useFallback = true;
      this.initializeFallbackStore();
    }
  }

  private initializeFallbackStore() {
    console.log('🔄 Initializing fallback in-memory store...');
    
    // Initialize with demo data
    this.fallbackStore.set('users', new Map([
      ['demo-user-1', {
        id: 'demo-user-1',
        email: 'demo@ailocks.com',
        password: '$2a$10$rOJ0H8F8JGJKjB8JGJKjBO8BjKjBOJK0H8F8JGJKjB8JGJKjB8JG', // "demo123"
        name: 'Demo User',
        status: 'online',
        latitude: 40.7128,
        longitude: -74.0060,
        city: 'New York',
        country: 'USA',
        createdAt: new Date()
      }]
    ]));

    this.fallbackStore.set('ailockSessions', new Map());
    this.fallbackStore.set('chats', new Map());
    this.fallbackStore.set('messages', new Map());
    this.fallbackStore.set('intents', new Map());
    
    console.log('✅ Fallback store initialized with demo data');
  }

  get client(): any {
    if (this.useFallback) {
      return this.createFallbackClient();
    }
    return this.prisma!; // Non-null assertion since we know it's initialized if not using fallback
  }

  private createFallbackClient() {
    return {
      user: {
        findUnique: async ({ where, include }: any) => {
          const users = this.fallbackStore.get('users');
          let user = null;
          
          if (where.id) user = users.get(where.id);
          if (where.email) {
            for (const [id, u] of users.entries()) {
              if ((u as any).email === where.email) {
                user = u;
                break;
              }
            }
          }
          
          // If include is specified, add empty arrays for relations
          if (user && include) {
            const userObj = user as any;
            user = { ...userObj };
            if (include.chatParticipants) (user as any).chatParticipants = [];
            if (include.intents) (user as any).intents = [];
          }
          
          return user;
        },
        
        create: async ({ data }: any) => {
          const users = this.fallbackStore.get('users');
          const id = 'user_' + Date.now();
          const user = { ...data, id, createdAt: new Date() };
          users.set(id, user);
          return user;
        },

        update: async ({ where, data }: any) => {
          const users = this.fallbackStore.get('users');
          const user = users.get(where.id);
          if (user) {
            Object.assign(user, data);
            users.set(where.id, user);
          }
          return user;
        },

        findMany: async ({ where, select }: any) => {
          const users = this.fallbackStore.get('users');
          const result: any[] = [];
          
          for (const [id, user] of users.entries()) {
            let include = true;
            
            if (where?.AND) {
              // Simple AND logic for demo
              for (const condition of where.AND) {
                if (condition.id?.not && (user as any).id === condition.id.not) include = false;
                if (condition.status?.not && (user as any).status === condition.status.not) include = false;
              }
            }
            
            if (include) {
              if (select) {
                const selectedUser: any = {};
                Object.keys(select).forEach(key => {
                  if (select[key]) selectedUser[key] = (user as any)[key];
                });
                result.push(selectedUser);
              } else {
                result.push(user);
              }
            }
          }
          
          return result;
        },

        delete: async ({ where }: any) => {
          const users = this.fallbackStore.get('users');
          const user = users.get(where.id);
          if (user) {
            users.delete(where.id);
          }
          return user;
        }
      },

      ailockSession: {
        create: async ({ data }: any) => {
          const sessions = this.fallbackStore.get('ailockSessions');
          const id = 'session_' + Date.now();
          const session = { ...data, id, createdAt: new Date(), lastActivity: new Date() };
          sessions.set(id, session);
          return session;
        },

        findFirst: async ({ where }: any) => {
          const sessions = this.fallbackStore.get('ailockSessions');
          for (const [id, session] of sessions.entries()) {
            if ((session as any).userId === where.userId && (session as any).isActive) {
              return session;
            }
          }
          return null;
        },

        update: async ({ where, data }: any) => {
          const sessions = this.fallbackStore.get('ailockSessions');
          const session = sessions.get(where.id);
          if (session) {
            Object.assign(session, data);
            sessions.set(where.id, session);
          }
          return session;
        }
      },

      intent: {
        create: async ({ data }: any) => {
          const intents = this.fallbackStore.get('intents');
          const id = 'intent_' + Date.now();
          const intent = { ...data, id, createdAt: new Date() };
          intents.set(id, intent);
          return intent;
        },

        findMany: async ({ where }: any) => {
          const intents = this.fallbackStore.get('intents');
          const result: any[] = [];
          for (const [id, intent] of intents.entries()) {
            if (!where || !where.userId || (intent as any).userId === where.userId) {
              result.push(intent);
            }
          }
          return result;
        }
      },

      $connect: async () => {
        console.log('✅ Fallback client connected');
      },

      $disconnect: async () => {
        console.log('✅ Fallback client disconnected');
      }
    };
  }

  async disconnect() {
    if (this.prisma && !this.useFallback) {
      await this.prisma.$disconnect();
    }
  }
}

export const database = new DatabaseWrapper();
export default database; 