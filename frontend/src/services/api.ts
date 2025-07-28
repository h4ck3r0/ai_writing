import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { 
  APIResponse, 
  AISuggestion, 
  WritingFormat, 
  SuggestionRequest, 
  SuggestionResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; 

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});


api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;
    if (!config || config.retry === undefined) {
      config.retry = 0;
    }

    if (config.retry >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.retry += 1;
    const delayTime = RETRY_DELAY * config.retry;

    await new Promise(resolve => setTimeout(resolve, delayTime));
    return api.request(config);
  }
);

const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIResponse<unknown>>;
    if (axiosError.response?.data?.error) {
      throw new Error(axiosError.response.data.error);
    }
    if (axiosError.response?.status === 404) {
      throw new Error('API endpoint not found');
    }
    if (axiosError.response?.status === 500) {
      throw new Error('Internal server error');
    }
    throw new Error(axiosError.message || 'Network error occurred');
  }
  throw error;
};

export const writingAPI = {
  getSuggestions: async (request: SuggestionRequest): Promise<AISuggestion[]> => {
    try {
      console.log('Requesting suggestions:', request);
      const response = await api.post<APIResponse<SuggestionResponse>>('/api/ai/suggestions', request);
      console.log('Received response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get suggestions');
      }

      if (!response.data.data?.suggestions) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }

      return response.data.data.suggestions;
    } catch (error) {
      handleApiError(error);
      return []; 
    }
  },

  saveContent: async (content: string, format: WritingFormat): Promise<void> => {
    try {
      const response = await api.post<APIResponse<void>>('/api/writing', { content, format });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to save content');
      }
    } catch (error) {
      handleApiError(error);
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await api.get<APIResponse<{ status: string }>>('/api/ai/health');
      return response.data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

export default {
  writing: writingAPI
};

export const aiFeaturesApi = {
  analyzeThemeConsistency: (content: string) =>
    api.post('/api/ai/analyze-theme', { content }),
  detectForeshadowing: (content: string) =>
    api.post('/api/ai/foreshadowing', { content }),
  analyzeMotivationStakes: (content: string) =>
    api.post('/api/ai/motivation-stakes', { content }),
  analyzeSceneBreakdown: (content: string) =>
    api.post('/api/ai/scene-breakdown', { content }),
  detectGenreCliches: (content: string, genre: string) =>
    api.post('/api/ai/genre-cliches', { content, genre }),
  matchAudienceTone: (content: string, audience: string) =>
    api.post('/api/ai/audience-tone', { content, audience }),
  reviewRevisionHistory: (content: string, previousDraft: string) =>
    api.post('/api/ai/revision-history', { content, previousDraft }),
  interactiveQA: (content: string, question: string) =>
    api.post('/api/ai/interactive-qa', { content, question }),
  suggestTitleLogline: (content: string) =>
    api.post('/api/ai/title-logline', { content }),
};
