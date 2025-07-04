import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AIService from '../services/AIService';
import { WritingFormat, ApiResponse, SuggestionRequest, SuggestionResponse } from '../types';

const router = Router();

// Middleware to validate request body
const validateSuggestionRequest = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  body('format')
    .isIn(Object.values(WritingFormat))
    .withMessage('Invalid format specified')
];

/**
 * POST /api/ai/suggestions
 * Get AI suggestions for the provided content
 */
router.post('/suggestions', validateSuggestionRequest, async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { content, format } = req.body as SuggestionRequest;
    
    // Additional input validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content cannot be empty'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Content is too long',
        message: 'Please limit content to 5000 characters'
      });
    }

    // Get suggestions from AI service
    const suggestions = await AIService.getSuggestions(content, format);
    const processingTime = Date.now() - startTime;

    // Log performance metrics
    const performanceData = {
      processingTime,
      contentLength: content.length,
      suggestionsCount: suggestions.length,
      format
    };
    console.log('AI Performance:', performanceData);

    // Return response
    const response: ApiResponse<SuggestionResponse> = {
      success: true,
      data: {
        suggestions,
        performance: {
          processingTime,
          modelUsed: 'HYBRID',
          tokensUsed: Math.ceil(content.length / 4)
        }
      }
    };

    return res.json(response);

  } catch (error: any) {
    console.error('Error in /api/ai/suggestions:', error);
    
    // Handle specific error types
    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(error.response.status).json({
        success: false,
        error: 'AI API authentication failed',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'AI service is currently unavailable',
        message: 'Please try again later'
      });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        error: 'AI service timed out',
        message: 'Please try with shorter content or try again later'
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    });
  }
});

/**
 * GET /api/ai/health
 * Check AI services health status
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const testContent = "The quick brown fox jumps over the lazy dog.";
    
    // Test both AI services
    const suggestions = await AIService.getSuggestions(testContent, WritingFormat.NOVEL);
    const processingTime = Date.now() - startTime;

    const geminiWorking = suggestions.some(s => s.model === 'GEMINI');
    const t5Working = suggestions.some(s => s.model === 'T5');

    return res.json({
      success: true,
      status: 'healthy',
      models: {
        gemini: geminiWorking,
        t5: t5Working
      },
      performance: {
        processingTime,
        suggestionsGenerated: suggestions.length
      }
    });

  } catch (error: any) {
    console.error('AI Health Check Failed:', error);

    const isGeminiError = error.message?.includes('Gemini');
    const isT5Error = error.message?.includes('T5');

    return res.status(503).json({
      success: false,
      status: 'unhealthy',
      models: {
        gemini: !isGeminiError,
        t5: !isT5Error
      },
      error: {
        message: process.env.NODE_ENV === 'development' ? error.message : 'Service health check failed',
        code: error.code
      }
    });
  }
});

export default router;