
import { SuggestionType, WritingFormat, AISuggestion } from '../types';
import { GeminiService, IGeminiService } from './GeminiService';
import { T5Service, IT5Service } from './T5Service';

class AIService {

rewriting
  async rewriteDialogue(content: string, format: WritingFormat): Promise<AISuggestion[]> {
    const suggestions = await this.getSuggestions(content, format);
    return suggestions.filter(s => s.type === 'DIALOGUE');
  }


  async adaptGenre(content: string, genre: string): Promise<AISuggestion[]> {
    const prompt = `${content}\n\nRewrite for genre: ${genre}`;
    const suggestions = await this.getSuggestions(prompt, WritingFormat.NOVEL);
    return suggestions;
  }


  async analyzeCharacterArc(content: string, character: string): Promise<AISuggestion[]> {
    const prompt = `Analyze the arc of character "${character}" in the following:\n${content}`;
    const suggestions = await this.getSuggestions(prompt, WritingFormat.NOVEL);
    return suggestions.filter(s => s.type === 'CHARACTER');
  }

  async detectPlotHoles(content: string): Promise<AISuggestion[]> {
    const prompt = `Find plot holes or inconsistencies in:\n${content}`;
    const suggestions = await this.getSuggestions(prompt, WritingFormat.NOVEL);
    return suggestions.filter(s => s.type === 'PLOT');
  }

  
  async summarizeContent(content: string): Promise<AISuggestion[]> {
    const prompt = `Summarize the following content:\n${content}`;
    const suggestions = await this.getSuggestions(prompt, WritingFormat.NOVEL);
    return suggestions;
  }
    async analyzeThemeConsistency(content: string): Promise<AISuggestion[]> {
    const prompt = `Analyze theme consistency in the following content:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }


    async detectForeshadowing(content: string): Promise<AISuggestion[]> {
    const prompt = `Detect missed foreshadowing opportunities and suggest narrative hints:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async analyzeMotivationStakes(content: string): Promise<AISuggestion[]> {
    const prompt = `Evaluate character motivations and story stakes, flag unclear or weak elements:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

 
  async analyzeSceneBreakdown(content: string): Promise<AISuggestion[]> {
    const prompt = `Segment content into scenes, assess pacing, and recommend adjustments:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async detectGenreCliches(content: string, genre: string): Promise<AISuggestion[]> {
    const prompt = `Warn about overused tropes/clichés in ${genre} and suggest alternatives:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async matchAudienceTone(content: string, audience: string): Promise<AISuggestion[]> {
    const prompt = `Adapt content to match the tone for ${audience} audience:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async reviewRevisionHistory(content: string, previousDraft: string): Promise<AISuggestion[]> {
    const prompt = `Analyze changes between drafts and recommend targeted improvements:\nPrevious Draft:\n${previousDraft}\nCurrent Draft:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async interactiveQA(content: string, question: string): Promise<AISuggestion[]> {
    const prompt = `Story:\n${content}\nQuestion:\n${question}\nAnswer as an expert editor:`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async suggestTitleLogline(content: string): Promise<AISuggestion[]> {
    const prompt = `You are an expert story editor. Based on the following content, generate 3 creative titles, 3 loglines, and 1 elevator pitch. Format your response clearly with sections for Title, Logline, and Elevator Pitch:\n${content}`;
    return await this.getSuggestions(prompt, WritingFormat.NOVEL);
  }

  
  async convertFormat(content: string, from: string, to: string): Promise<AISuggestion[]> {
    const prompt = `Convert this from ${from} to ${to} format:\n${content}`;
    let formatEnum: WritingFormat = WritingFormat.NOVEL;
    switch (to.toUpperCase()) {
      case 'NOVEL':
        formatEnum = WritingFormat.NOVEL;
        break;
      case 'SCREENPLAY':
        formatEnum = WritingFormat.SCREENPLAY;
        break;
      case 'GAME_SCRIPT':
        formatEnum = WritingFormat.GAME_SCRIPT;
        break;
      default:
        formatEnum = WritingFormat.NOVEL;
    }
    const suggestions = await this.getSuggestions(prompt, formatEnum);
    return suggestions;
  


  }
  private geminiService: IGeminiService;
  private t5Service: IT5Service;

  constructor(
    geminiService?: IGeminiService,
    t5Service?: IT5Service
  ) {
    this.geminiService = geminiService || new GeminiService();
    this.t5Service = t5Service || new T5Service();
  }

  private getFallbackSuggestions(content: string): AISuggestion[] {
    console.log('Using fallback suggestions for:', content);
    const suggestions = [
      {
        id: Math.random().toString(36).slice(2),
        text: 'Consider enhancing this description with more sensory details.',
        type: SuggestionType.STYLE,
        category: 'Style Improvement',
        confidence: 0.9,
        model: AIModel.GEMINI,
        metadata: {
          position: {
            start: 0,
            end: content.length
          },
          context: content,
          originalText: content
        },
        status: SuggestionStatus.PENDING
      },
      {
        id: Math.random().toString(36).slice(2),
        text: 'Try incorporating more character emotions and reactions here.',
        type: SuggestionType.CHARACTER,
        category: 'Character Development',
        confidence: 0.85,
        model: AIModel.T5,
        metadata: {
          position: {
            start: 0,
            end: content.length
          },
          context: content,
          originalText: content
        },
        status: SuggestionStatus.PENDING
      }
    ];
    console.log('Generated fallback suggestions:', suggestions);
    return suggestions;
  }

  private parseGeminiResponse(text: string, originalContent: string): AISuggestion[] {
    console.log('Parsing Gemini response:', text);
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
            const suggestion: AISuggestion = {
              id: Math.random().toString(36).slice(2),
              text: improvedText,
              type: validType,
              category: 'Gemini Suggestion',
              confidence: 0.85,
              model: AIModel.GEMINI,
              metadata: {
                position: {
                  start,
                  end: start + originalText.length
                },
                context: originalContent.slice(Math.max(0, start - 50), start + originalText.length + 50),
                originalText
              },
              status: SuggestionStatus.PENDING
            };
            
            console.log('Created suggestion:', suggestion);
            suggestions.push(suggestion);
          } else {
            console.warn('Could not find original text in content:', originalText);
          }
        }
      }

      console.log(`Generated ${suggestions.length} suggestions from Gemini response`);
      return suggestions;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return this.getFallbackSuggestions(originalContent);
    }
  }

  private async getGeminiSuggestions(content: string, format: WritingFormat): Promise<AISuggestion[]> {
    if (!content.trim()) {
      console.log('Empty content provided to Gemini API');
      return [];
    }

    try {
      console.log('Requesting Gemini suggestions for format:', format);
      const response = await axios.post(
        this.geminiEndpoint,
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
            'X-goog-api-key': this.geminiApiKey
          }
        }
      );

      console.log('Received Gemini response:', response.data);

      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid Gemini response format:', response.data);
        return this.getFallbackSuggestions(content);
      }

      const suggestions = this.parseGeminiResponse(
        response.data.candidates[0].content.parts[0].text,
        content
      );

      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(content);

    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackSuggestions(content);
    }
  }

  private async getT5Suggestions(content: string): Promise<AISuggestion[]> {
    if (!content.trim()) {
      console.log('Empty content provided to T5 model');
      return [];
    }

    try {
      console.log('Starting T5 model inference...');
      const pythonProcess = spawn('python', [
        path.join(__dirname, '../scripts/setup_t5.py'),
        '--inference',
        '--input', content,
        '--model_path', this.t5ModelPath
      ]);

      return new Promise((resolve) => {
        let output = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
        });

        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('T5 model error:', error);
            resolve([]);
            return;
          }

          try {
            const suggestions = JSON.parse(output);
            console.log('Parsed T5 suggestions:', suggestions);
            resolve(suggestions);
          } catch (e) {
            console.error('Failed to parse T5 output:', e);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('T5 model error:', error);
      return [];
    }
  }

  async getSuggestions(content: string, format: WritingFormat): Promise<AISuggestion[]> {
    const [geminiSuggestions, t5Suggestions] = await Promise.all([
      this.geminiService.getSuggestions(content, format),
      this.t5Service.getSuggestions(content)
    ]);
    let suggestions = [...geminiSuggestions, ...t5Suggestions];
    if (suggestions.length === 0) {
      
      suggestions = (this.geminiService as GeminiService).getFallbackSuggestions(content);
    }
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .map(s => ({
        ...s,
        id: s.id || Math.random().toString(36).slice(2)
      }));
  }
}

export default new AIService();
