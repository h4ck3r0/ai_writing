import { WritingFormat } from '../types';
import AIService from '../services/AIService';

describe('AI Service Integration Tests', () => {
  const testContent = "The quick brown fox jumps over the lazy dog.";

  test('Gemini API should return suggestions', async () => {
    try {
      const suggestions = await AIService.getSuggestions(testContent, WritingFormat.NOVEL);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('text');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion.metadata).toHaveProperty('position');
      }
    } catch (error) {
      console.error('Gemini API test failed:', error);
      throw error;
    }
  }, 10000); // Increase timeout for API call

  test('T5 model should return suggestions', async () => {
    try {
      const suggestions = await AIService.getSuggestions(testContent, WritingFormat.NOVEL);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      
      // Find T5 suggestions
      const t5Suggestions = suggestions.filter(s => s.model === 'T5');
      
      if (t5Suggestions.length > 0) {
        const suggestion = t5Suggestions[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('text');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('confidence');
        expect(suggestion.metadata).toHaveProperty('position');
      }
    } catch (error) {
      console.error('T5 model test failed:', error);
      throw error;
    }
  }, 10000);

  test('Should handle invalid input gracefully', async () => {
    const invalidContent = "";
    
    await expect(
      AIService.getSuggestions(invalidContent, WritingFormat.NOVEL)
    ).rejects.toThrow();
  });

  test('Should combine and sort suggestions by confidence', async () => {
    const suggestions = await AIService.getSuggestions(testContent, WritingFormat.NOVEL);
    
    if (suggestions.length > 1) {
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].confidence).toBeGreaterThanOrEqual(suggestions[i + 1].confidence);
      }
    }
  });
});