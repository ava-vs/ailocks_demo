import { AilockMode } from '../types';
import { LLMMessage } from './UnifiedLLMService';

export interface ContextAction {
  id: string;
  label: string;
  icon: string;
  category: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  followUpActions?: ContextAction[];
}

export class ContextualActionGenerator {
  generateActions(
    mode: AilockMode,
    conversationHistory: LLMMessage[],
    userLocation?: { city?: string; country?: string; latitude?: number; longitude?: number }
  ): ContextAction[] {
    const actions: ContextAction[] = [];

    // Base actions for each mode
    const baseActions = this.getBaseActions(mode);
    actions.push(...baseActions);

    // Context-aware actions based on conversation
    const contextActions = this.getContextualActions(conversationHistory, mode);
    actions.push(...contextActions);

    // Location-based actions
    if (userLocation) {
      const locationActions = this.getLocationActions(userLocation, mode);
      actions.push(...locationActions);
    }

    return actions;
  }

  private getBaseActions(mode: AilockMode): ContextAction[] {
    const baseActions = {
      researcher: [
        {
          id: 'search-nearby',
          label: 'Search Nearby',
          icon: 'MapPin',
          category: 'research',
          description: 'Find relevant information and resources in your area'
        },
        {
          id: 'analyze-trends',
          label: 'Analyze Trends',
          icon: 'TrendingUp',
          category: 'research',
          description: 'Analyze current trends and patterns in your topic'
        },
        {
          id: 'find-sources',
          label: 'Find Sources',
          icon: 'BookOpen',
          category: 'research',
          description: 'Discover reliable sources and references'
        },
        {
          id: 'create-research-plan',
          label: 'Research Plan',
          icon: 'FileText',
          category: 'research',
          description: 'Create a structured research methodology'
        }
      ],
      creator: [
        {
          id: 'create-intent',
          label: 'Create Intent',
          icon: 'Plus',
          category: 'create',
          description: 'Transform ideas into actionable intents'
        },
        {
          id: 'brainstorm-ideas',
          label: 'Brainstorm Ideas',
          icon: 'Lightbulb',
          category: 'create',
          description: 'Generate creative solutions and concepts'
        },
        {
          id: 'design-workflow',
          label: 'Design Workflow',
          icon: 'GitBranch',
          category: 'create',
          description: 'Create step-by-step process flows'
        },
        {
          id: 'generate-content',
          label: 'Generate Content',
          icon: 'FileText',
          category: 'create',
          description: 'Create written content and materials'
        }
      ],
      analyst: [
        {
          id: 'data-analysis',
          label: 'Data Analysis',
          icon: 'BarChart3',
          category: 'analyze',
          description: 'Perform comprehensive data analysis'
        },
        {
          id: 'create-report',
          label: 'Create Report',
          icon: 'FileBarChart',
          category: 'analyze',
          description: 'Generate detailed analytical reports'
        },
        {
          id: 'performance-metrics',
          label: 'Performance Metrics',
          icon: 'Activity',
          category: 'analyze',
          description: 'Track and analyze key performance indicators'
        },
        {
          id: 'compare-options',
          label: 'Compare Options',
          icon: 'Scale',
          category: 'analyze',
          description: 'Analyze and compare different alternatives'
        }
      ]
    };

    return baseActions[mode] || [];
  }

  private getContextualActions(conversationHistory: LLMMessage[], mode: AilockMode): ContextAction[] {
    const actions: ContextAction[] = [];
    const lastMessages = conversationHistory.slice(-5); // Analyze last 5 messages
    const conversationText = lastMessages.map(m => m.content).join(' ').toLowerCase();

    // Detect common patterns and suggest relevant actions
    if (conversationText.includes('help') || conversationText.includes('need')) {
      actions.push({
        id: 'create-help-intent',
        label: 'Create Help Request',
        icon: 'HelpCircle',
        category: 'intent',
        description: 'Create an intent to get help from the community'
      });
    }

    if (conversationText.includes('learn') || conversationText.includes('tutorial')) {
      actions.push({
        id: 'find-learning-resources',
        label: 'Find Learning Resources',
        icon: 'GraduationCap',
        category: 'research',
        description: 'Discover educational materials and tutorials'
      });
    }

    if (conversationText.includes('collaborate') || conversationText.includes('team')) {
      actions.push({
        id: 'find-collaborators',
        label: 'Find Collaborators',
        icon: 'Users',
        category: 'network',
        description: 'Connect with potential collaborators'
      });
    }

    if (conversationText.includes('project') || conversationText.includes('build')) {
      actions.push({
        id: 'create-project-plan',
        label: 'Create Project Plan',
        icon: 'Calendar',
        category: 'create',
        description: 'Structure your project with milestones'
      });
    }

    return actions;
  }

  private getLocationActions(
    location: { city?: string; country?: string; latitude?: number; longitude?: number },
    mode: AilockMode
  ): ContextAction[] {
    const actions: ContextAction[] = [];

    // Always add location insights
    actions.push({
      id: 'location-insights',
      label: 'Location Insights',
      icon: 'Globe',
      category: 'research',
      description: `Get insights specific to ${location.city || 'your area'}`,
      parameters: { location }
    });

    // Mode-specific location actions
    if (mode === 'researcher') {
      actions.push({
        id: 'local-research',
        label: 'Local Research',
        icon: 'MapPin',
        category: 'research',
        description: 'Find local research institutions and resources'
      });
    }

    if (mode === 'creator') {
      actions.push({
        id: 'local-opportunities',
        label: 'Local Opportunities',
        icon: 'Target',
        category: 'create',
        description: 'Discover local business and creative opportunities'
      });
    }

    if (mode === 'analyst') {
      actions.push({
        id: 'local-market-data',
        label: 'Local Market Data',
        icon: 'TrendingUp',
        category: 'analyze',
        description: 'Analyze local market trends and data'
      });
    }

    return actions;
  }

  async executeAction(actionId: string, parameters: any = {}): Promise<ActionExecutionResult> {
    try {
      switch (actionId) {
        case 'create-intent':
          return await this.executeCreateIntent(parameters);
        
        case 'search-nearby':
          return await this.executeSearchNearby(parameters);
        
        case 'analyze-trends':
          return await this.executeAnalyzeTrends(parameters);
        
        case 'brainstorm-ideas':
          return await this.executeBrainstormIdeas(parameters);
        
        case 'data-analysis':
          return await this.executeDataAnalysis(parameters);
        
        case 'location-insights':
          return await this.executeLocationInsights(parameters);
        
        case 'find-collaborators':
          return await this.executeFindCollaborators(parameters);
        
        case 'create-project-plan':
          return await this.executeCreateProjectPlan(parameters);
        
        default:
          return {
            success: false,
            message: `Action ${actionId} is not implemented yet`,
            data: { actionId, parameters }
          };
      }
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
      return {
        success: false,
        message: `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeCreateIntent(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Intent creation wizard initiated. Please provide details about what you need help with.',
      data: {
        wizard: true,
        step: 'title',
        fields: ['title', 'description', 'category', 'type']
      },
      followUpActions: [
        {
          id: 'intent-wizard-next',
          label: 'Continue',
          icon: 'ArrowRight',
          category: 'wizard',
          description: 'Continue with intent creation'
        }
      ]
    };
  }

  private async executeSearchNearby(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Searching for nearby resources and connections...',
      data: {
        searchType: 'nearby',
        radius: parameters.radius || 10,
        results: [
          { type: 'user', name: 'Local Expert', distance: '2.3 km' },
          { type: 'resource', name: 'Research Library', distance: '1.8 km' },
          { type: 'event', name: 'Tech Meetup', distance: '3.1 km' }
        ]
      }
    };
  }

  private async executeAnalyzeTrends(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Analyzing current trends and patterns...',
      data: {
        trends: [
          { topic: 'AI Development', growth: '+45%', timeframe: 'last 6 months' },
          { topic: 'Remote Collaboration', growth: '+23%', timeframe: 'last 3 months' },
          { topic: 'Sustainable Tech', growth: '+67%', timeframe: 'last year' }
        ],
        insights: 'AI development shows strong growth, particularly in collaborative AI systems.'
      }
    };
  }

  private async executeBrainstormIdeas(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Generating creative ideas and solutions...',
      data: {
        ideas: [
          'AI-powered collaboration platform',
          'Location-based skill sharing network',
          'Automated project matching system',
          'Real-time expertise discovery tool'
        ],
        techniques: ['Mind mapping', 'SCAMPER method', 'Design thinking', 'Lateral thinking']
      }
    };
  }

  private async executeDataAnalysis(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Performing comprehensive data analysis...',
      data: {
        metrics: {
          userEngagement: '78%',
          taskCompletion: '92%',
          collaborationRate: '65%'
        },
        recommendations: [
          'Increase user onboarding efficiency',
          'Enhance collaboration features',
          'Optimize task matching algorithms'
        ]
      }
    };
  }

  private async executeLocationInsights(parameters: any): Promise<ActionExecutionResult> {
    const location = parameters.location;
    return {
      success: true,
      message: `Gathering insights for ${location?.city || 'your area'}...`,
      data: {
        location: location,
        insights: [
          'High concentration of tech professionals',
          'Active startup ecosystem',
          'Strong university research presence',
          'Growing AI/ML community'
        ],
        opportunities: [
          'Tech meetups and conferences',
          'Research collaboration opportunities',
          'Startup incubator programs'
        ]
      }
    };
  }

  private async executeFindCollaborators(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Finding potential collaborators in your network...',
      data: {
        collaborators: [
          { name: 'Alex Chen', skills: ['AI/ML', 'Python'], match: '95%' },
          { name: 'Sarah Johnson', skills: ['Design', 'UX'], match: '87%' },
          { name: 'Mike Rodriguez', skills: ['Backend', 'DevOps'], match: '82%' }
        ],
        suggestions: 'Based on your current project needs and skill requirements'
      }
    };
  }

  private async executeCreateProjectPlan(parameters: any): Promise<ActionExecutionResult> {
    return {
      success: true,
      message: 'Creating structured project plan...',
      data: {
        phases: [
          { name: 'Planning', duration: '1 week', tasks: ['Requirements', 'Design', 'Timeline'] },
          { name: 'Development', duration: '4 weeks', tasks: ['Implementation', 'Testing', 'Integration'] },
          { name: 'Launch', duration: '1 week', tasks: ['Deployment', 'Monitoring', 'Documentation'] }
        ],
        milestones: ['MVP Complete', 'Beta Testing', 'Production Launch']
      }
    };
  }
}