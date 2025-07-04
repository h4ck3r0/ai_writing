export enum WritingFormat {
  NOVEL = 'NOVEL',
  SCREENPLAY = 'SCREENPLAY',
  GAME_SCRIPT = 'GAME_SCRIPT'
}

export enum SuggestionType {
  STYLE = 'STYLE',
  PLOT = 'PLOT',
  CHARACTER = 'CHARACTER',
  DIALOGUE = 'DIALOGUE',
  STRUCTURE = 'STRUCTURE'
}

export enum SuggestionStatus {
  PENDING = 'PENDING',
  APPLIED = 'APPLIED',
  REJECTED = 'REJECTED'
}

export enum AIModel {
  GEMINI = 'GEMINI',
  T5 = 'T5',
  HYBRID = 'HYBRID'
}

export interface ISuggestionPosition {
  start: number;
  end: number;
}

export interface ISuggestionMetadata {
  position: ISuggestionPosition;
  context: string;
  originalText: string;
}

export interface AISuggestion {
  id: string;
  text: string;
  type: SuggestionType;
  category: string;
  confidence: number;
  model: AIModel;
  metadata: ISuggestionMetadata;
  status?: SuggestionStatus;
}

export interface DatabaseError extends Error {
  code?: number;
  statusCode?: number;
  status?: number;
  name: string;
  message: string;
  stack?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface SuggestionRequest {
  content: string;
  format: WritingFormat;
  type?: SuggestionType[];
  context?: {
    before: string;
    after: string;
  };
}

export type SuggestionResponse = {
  suggestions: AISuggestion[];
  performance: {
    processingTime: number;
    modelUsed: AIModel;
    tokensUsed: number;
  };
};

// Environment variables types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGODB_URI: string;
      GOOGLE_AI_API_KEY: string;
      T5_MODEL_PATH: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      LOG_LEVEL: string;
      ALLOWED_ORIGINS: string;
    }
  }
}