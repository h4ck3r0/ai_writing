// T5Service.ts
import { spawn } from 'child_process';
import path from 'path';
import { AISuggestion, AIModel, SuggestionType, SuggestionStatus } from '../types';

export interface IT5Service {
  getSuggestions(content: string): Promise<AISuggestion[]>;
}

export class T5Service implements IT5Service {
  private modelPath: string;

  constructor(modelPath?: string) {
    this.modelPath = modelPath || process.env.T5_MODEL_PATH || path.join(__dirname, '../../models/t5');
  }

  async getSuggestions(content: string): Promise<AISuggestion[]> {
    if (!content.trim()) return [];
    try {
      const pythonProcess = spawn('python', [
        path.join(__dirname, '../scripts/setup_t5.py'),
        '--inference',
        '--input', content,
        '--model_path', this.modelPath
      ]);
      return new Promise((resolve) => {
        let output = '';
        let error = '';
        pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { error += data.toString(); });
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            resolve([]);
            return;
          }
          try {
            const suggestions = JSON.parse(output);
            resolve(suggestions);
          } catch {
            resolve([]);
          }
        });
      });
    } catch {
      return [];
    }
  }
// Extract entities using T5 NER
async extractEntities(content: string): Promise<{ type: string; start: number; end: number }[]> {
  if (!content.trim()) return [];
  try {
    const pythonProcess = spawn('python', [
      path.join(__dirname, '../scripts/setup_t5.py'),
      '--ner',
      '--input', content,
      '--model_path', this.modelPath
    ]);
    return await new Promise((resolve) => {
      let output = '';
      pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
      pythonProcess.on('close', () => {
        try {
          const entities = JSON.parse(output);
          resolve(entities);
        } catch {
          resolve([]);
        }
      });
    });
  } catch {
    return [];
  }
}
}