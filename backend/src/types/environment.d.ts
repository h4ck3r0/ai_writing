declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      MONGODB_URI: string;
      MONGODB_TEST_URI?: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      GOOGLE_AI_API_KEY: string;
      T5_MODEL_PATH: string;
      T5_MAX_LENGTH: string;
      T5_BATCH_SIZE: string;
      LOG_LEVEL: string;
      LOG_FILE_PATH: string;
      ALLOWED_ORIGINS: string;
      RATE_LIMIT_WINDOW: string;
      RATE_LIMIT_MAX_REQUESTS: string;
    }
  }
}

// This empty export is necessary to make this a module
export {};