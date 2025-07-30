// GeminiService.ts
import axios from 'axios';
import { SuggestionType, WritingFormat, AISuggestion, AIModel, SuggestionStatus } from '../types';

export interface IGeminiService {
  getSuggestions(content: string, format: WritingFormat): Promise<AISuggestion[]>;
}

export class GeminiService implements IGeminiService {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || '';
  }

  public getFallbackSuggestions(content: string): AISuggestion[] {
    return [
      {
        id: Math.random().toString(36).slice(2),
        text: 'Consider enhancing this description with more sensory details.',
        type: SuggestionType.STYLE,
        category: 'Style Improvement',
        confidence: 0.9,
        model: AIModel.GEMINI,
        metadata: {
          position: { start: 0, end: content.length },
          context: content,
          originalText: content
        },
        status: SuggestionStatus.PENDING
      }
    ];
  }

  private parseGeminiResponse(text: string, originalContent: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    try {
      const blocks = text.split('\n\n').filter(block => block.trim());
      for (const block of blocks) {
        const lines = block.split('\n').map(line => line.trim());
        const typeMatch = lines.find(l => /type:/i.test(l))?.match(/type:\s*([^$\n]*)/i);
        const originalMatch = lines.find(l => /original text:/i.test(l))?.match(/original text:\s*([^$\n]*)/i);
        const improvedMatch = lines.find(l => /improved version:/i.test(l))?.match(/improved version:\s*([^$\n]*)/i);

        if (typeMatch?.[1] && originalMatch?.[1] && improvedMatch?.[1]) {
          const type = typeMatch[1].trim().toUpperCase();
          const originalText = originalMatch[1].trim();
          const improvedText = improvedMatch[1].trim();
          const validType = Object.values(SuggestionType).includes(type as SuggestionType)
            ? type as SuggestionType
            : SuggestionType.STYLE;
          const start = originalContent.indexOf(originalText);
          if (start !== -1) {
            suggestions.push({
              id: Math.random().toString(36).slice(2),
              text: improvedText,
              type: validType,
              category: 'Gemini Suggestion',
              confidence: 0.85,
              model: AIModel.GEMINI,
              metadata: {
                position: { start, end: start + originalText.length },
                context: originalContent.slice(Math.max(0, start - 50), start + originalText.length + 50),
                originalText
              },
              status: SuggestionStatus.PENDING
            });
          }
        }
      }
      return suggestions;
    } catch {
      return this.getFallbackSuggestions(originalContent);
    }
  }

  async getSuggestions(content: string, format: WritingFormat): Promise<AISuggestion[]> {
    if (!content.trim()) return [];
    try {
      const response = await axios.post(
        this.endpoint,
        {
          contents: [{
            parts: [{
              text: `As a writing assistant, analyze this ${format} text and suggest improvements:

"${content}"

For each suggestion, provide:
1. The specific part that needs improvement
2. A clear explanation of why it should be improved
3. The improved version of that part

Format each suggestion exactly like this:
Type: STYLE/PLOT/CHARACTER/DIALOGUE/STRUCTURE
Original text: [the part to improve]
Improved version: [your improved version]

Give 2-3 specific, actionable suggestions.`
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey
          }
        }
      );
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return this.getFallbackSuggestions(content);
      const suggestions = this.parseGeminiResponse(text, content);
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(content);
    } catch {
      return this.getFallbackSuggestions(content);
    }
  }
}