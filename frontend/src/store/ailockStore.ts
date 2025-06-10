import { create } from 'zustand';
import { AilockState, AilockMode, Message, Chat, Intent, ContextAction } from '../types';

interface AilockStore extends AilockState {
  // Chat state
  currentChat: Chat | null;
  currentSessionId: string | null;
  messages: Message[];
  streamingMessage: string;
  isConnected: boolean;
  
  // Intents
  intents: Intent[];
  
  // Actions
  setMode: (mode: AilockMode) => void;
  setTyping: (isTyping: boolean) => void;
  setLocation: (location: { latitude: number; longitude: number; city?: string; country?: string }) => void;
  addMessage: (message: Message) => void;
  appendToStreamingMessage: (chunk: string) => void;
  clearStreamingMessage: () => void;
  setChat: (chat: Chat) => void;
  setConnected: (connected: boolean) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  addIntent: (intent: Intent) => void;
  updateContextActions: () => void;
  setContextActions: (actions: ContextAction[]) => void;
}

export const useAilockStore = create<AilockStore>((set, get) => ({
  // Initial state
  currentMode: 'researcher',
  isTyping: false,
  location: undefined,
  contextActions: [],
  currentChat: null,
  currentSessionId: null,
  messages: [],
  streamingMessage: '',
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

  addMessage: (message) => {
    set((state) => ({ 
      messages: [...state.messages, message],
      streamingMessage: '' // Clear streaming message when adding complete message
    }));
  },

  appendToStreamingMessage: (chunk) => {
    set((state) => ({
      streamingMessage: state.streamingMessage + chunk
    }));
  },

  clearStreamingMessage: () => set({ streamingMessage: '' }),

  setChat: (chat) => set({ currentChat: chat }),

  setConnected: (connected) => set({ isConnected: connected }),

  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  addIntent: (intent) => set((state) => ({ 
    intents: [...state.intents, intent] 
  })),

  setContextActions: (actions) => set({ contextActions: actions }),

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
            action: () => {
              // This will be handled by the socket executeAction
              console.log('Search nearby action triggered');
            },
            category: 'research'
          },
          {
            id: 'analyze-trends',
            label: 'Analyze Trends',
            icon: 'TrendingUp',
            action: () => console.log('Analyze trends'),
            category: 'research'
          },
          {
            id: 'find-sources',
            label: 'Find Sources',
            icon: 'BookOpen',
            action: () => console.log('Find sources'),
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
            id: 'brainstorm-ideas',
            label: 'Brainstorm Ideas',
            icon: 'Lightbulb',
            action: () => console.log('Brainstorm ideas'),
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
          },
          {
            id: 'performance-metrics',
            label: 'Performance Metrics',
            icon: 'Activity',
            action: () => console.log('Performance metrics'),
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