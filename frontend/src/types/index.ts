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

// Re-export for backward compatibility
export type ApiResponse<T = any> = APIResponse<T>;