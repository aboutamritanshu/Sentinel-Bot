import OpenAI from 'openai';
import logger from '../utils/logger';
import { 
  aiModerationResponseSchema, 
  aiDisputeResponseSchema, 
  aiTicketSummarySchema 
} from '../utils/validation';

export interface AIModerationResponse {
  category: 'toxic' | 'harassment' | 'hate' | 'spam' | 'safe';
  severity: number;
  confidence: number;
}

export interface AIDisputeResponse {
  initiator: 'userA' | 'userB' | 'both';
  severity: number;
  recommendedAction: 'none' | 'warn' | 'timeout' | 'ban';
  reason: string;
}

export interface AITicketSummaryResponse {
  issue: string;
  highlights: string;
  resolution: string;
}

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    });
  }

  async moderateContent(content: string, context: string[] = []): Promise<AIModerationResponse> {
    try {
      const prompt = this.buildModerationPrompt(content, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation AI. Analyze the given message and respond with ONLY a JSON object containing:
            - category: "toxic" | "harassment" | "hate" | "spam" | "safe"
            - severity: number (0-10, where 0 is completely safe and 10 is extremely severe)
            - confidence: number (0-1, your confidence in this assessment)
            
            Be objective and consistent. Consider context provided.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 150,
      });

      const contentResponse = response.choices[0]?.message?.content;
      if (!contentResponse) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(contentResponse);
      const validated = aiModerationResponseSchema.validate(parsed);
      
      if (validated.error) {
        logger.error('AI response validation failed:', validated.error);
        throw new Error('Invalid AI response format');
      }

      return validated.value;
    } catch (error) {
      logger.error('Error in moderateContent:', error);
      
      return {
        category: 'safe',
        severity: 0,
        confidence: 0
      };
    }
  }

  async analyzeDispute(
    conversation: Array<{ author: string; content: string; timestamp: string }>
  ): Promise<AIDisputeResponse> {
    try {
      const prompt = this.buildDisputePrompt(conversation);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are analyzing a dispute between two users. Review the conversation and respond with ONLY a JSON object containing:
            - initiator: "userA" | "userB" | "both" (who primarily initiated the conflict)
            - severity: number (0-10, severity of the conflict)
            - recommendedAction: "none" | "warn" | "timeout" | "ban"
            - reason: string (brief explanation of your decision)
            
            Be fair and objective. Consider the full context of the conversation.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 250,
      });

      const contentResponse = response.choices[0]?.message?.content;
      if (!contentResponse) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(contentResponse);
      const validated = aiDisputeResponseSchema.validate(parsed);
      
      if (validated.error) {
        logger.error('AI dispute response validation failed:', validated.error);
        throw new Error('Invalid AI response format');
      }

      return validated.value;
    } catch (error) {
      logger.error('Error in analyzeDispute:', error);
      
      return {
        initiator: 'both',
        severity: 0,
        recommendedAction: 'none',
        reason: 'Error analyzing dispute'
      };
    }
  }

  async summarizeTicket(
    conversation: Array<{ author: string; content: string; timestamp: string }>
  ): Promise<AITicketSummaryResponse> {
    try {
      const prompt = this.buildTicketSummaryPrompt(conversation);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are summarizing a support ticket conversation. Analyze the entire conversation and respond with ONLY a JSON object containing:
            - issue: string (clear description of the main issue reported)
            - highlights: string (key points and important information from the conversation)
            - resolution: string (how the issue was resolved, or "unresolved" if not resolved)
            
            Be concise but comprehensive. Focus on the most important information.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const contentResponse = response.choices[0]?.message?.content;
      if (!contentResponse) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(contentResponse);
      const validated = aiTicketSummarySchema.validate(parsed);
      
      if (validated.error) {
        logger.error('AI ticket summary response validation failed:', validated.error);
        throw new Error('Invalid AI response format');
      }

      return validated.value;
    } catch (error) {
      logger.error('Error in summarizeTicket:', error);
      
      return {
        issue: 'Error summarizing ticket',
        highlights: 'Unable to process conversation',
        resolution: 'unresolved'
      };
    }
  }

  async detectTopics(messages: string[]): Promise<{ topic: string; confidence: number }[]> {
    try {
      const prompt = `Analyze these messages and identify the main topics being discussed. Return ONLY a JSON array of objects with:
      - topic: string (name of the topic)
      - confidence: number (0-1, how confident you are this is a main topic)
      
      Messages:
      ${messages.join('\n')}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a topic detection AI. Identify the main topics in the given messages.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200,
      });

      const contentResponse = response.choices[0]?.message?.content;
      if (!contentResponse) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(contentResponse);
    } catch (error) {
      logger.error('Error in detectTopics:', error);
      return [];
    }
  }

  private buildModerationPrompt(content: string, context: string[]): string {
    let prompt = `Message to moderate: "${content}"`;
    
    if (context.length > 0) {
      prompt += `\n\nContext (previous messages):\n`;
      context.forEach((msg, index) => {
        prompt += `${index + 1}. "${msg}"\n`;
      });
    }
    
    return prompt;
  }

  private buildDisputePrompt(conversation: Array<{ author: string; content: string; timestamp: string }>): string {
    let prompt = 'Conversation between two users:\n\n';
    
    conversation.forEach(msg => {
      prompt += `[${msg.timestamp}] ${msg.author}: "${msg.content}"\n`;
    });
    
    return prompt;
  }

  private buildTicketSummaryPrompt(conversation: Array<{ author: string; content: string; timestamp: string }>): string {
    let prompt = 'Support ticket conversation:\n\n';
    
    conversation.forEach(msg => {
      prompt += `[${msg.timestamp}] ${msg.author}: "${msg.content}"\n`;
    });
    
    return prompt;
  }
}
