import { create } from 'zustand';
import { AilockState, AilockMode, Message, Chat, Intent, ContextAction } from '../types';

interface AilockStore extends AilockState {
  // Chat state
  currentChat: Chat | null;
  messages: Message[];
  isConnected: boolean;
  
  // Intents
  intents: Intent[];
  
  // Actions
  setMode: (mode: AilockMode) => void;
  setTyping: (isTyping: boolean) => void;
  setLocation: (location: { latitude: number; longitude: number; city?: string; country?: string }) => void;
  addMessage: (message: Message) => void;
  setChat: (chat: Chat) => void;
  setConnected: (connected: boolean) => void;
  addIntent: (intent: Intent) => void;
  updateContextActions: () => void;
}

export const useAilockStore = create<AilockStore>((set, get) => ({
  // Initial state
  currentMode: 'researcher',
  isTyping: false,
  location: undefined,
  contextActions: [],
  currentChat: null,
  messages: [],
  isConnected: false,
  intents: [],

  // Actions
  setMode: (mode) => {
    set({ currentMode: mode });
    get().updateContextActions();
  },

  setTyping: (isTyping) => set({ isTyping }),

  setLocation: (location) => {
    set({ location });
    get().updateContextActions();
  },

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  setChat: (chat) => set({ currentChat: chat }),

  setConnected: (connected) => set({ isConnected: connected }),

  addIntent: (intent) => set((state) => ({ 
    intents: [...state.intents, intent] 
  })),

  updateContextActions: () => {
    const { currentMode, location } = get();
    const actions: ContextAction[] = [];

    // Mode-specific actions
    switch (currentMode) {
      case 'researcher':
        actions.push(
          {
            id: 'search-nearby',
            label: 'Search Nearby',
            icon: 'MapPin',
            action: () => console.log('Search nearby'),
            category: 'research'
          },
          {
            id: 'analyze-trends',
            label: 'Analyze Trends',
            icon: 'TrendingUp',
            action: () => console.log('Analyze trends'),
            category: 'research'
          }
        );
        break;
      case 'creator':
        actions.push(
          {
            id: 'create-intent',
            label: 'Create Intent',
            icon: 'Plus',
            action: () => console.log('Create intent'),
            category: 'create'
          },
          {
            id: 'generate-content',
            label: 'Generate Content',
            icon: 'FileText',
            action: () => console.log('Generate content'),
            category: 'create'
          }
        );
        break;
      case 'analyst':
        actions.push(
          {
            id: 'data-analysis',
            label: 'Data Analysis',
            icon: 'BarChart3',
            action: () => console.log('Data analysis'),
            category: 'analyze'
          },
          {
            id: 'create-report',
            label: 'Create Report',
            icon: 'FileBarChart',
            action: () => console.log('Create report'),
            category: 'analyze'
          }
        );
        break;
    }

    // Location-based actions
    if (location) {
      actions.push({
        id: 'location-insights',
        label: 'Location Insights',
        icon: 'Globe',
        action: () => console.log('Location insights'),
        category: 'research'
      });
    }

    set({ contextActions: actions });
  }
}));