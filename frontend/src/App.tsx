// Import MainPanel for AI features and suggestions
import MainPanel from './components/MainPanel';
import React, { useState, useCallback } from 'react';
import Editor from './components/Editor/Editor';
import { WritingFormat, SuggestionRequest } from './types';
import api from './services/api';
import './App.css';

const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (content: string) => {
    try {
      setError(null);
      await api.writing.saveContent(content, WritingFormat.NOVEL);
    } catch (error) {
      console.error('Failed to save content:', error);
      setError(error instanceof Error ? error.message : 'Failed to save content');
    }
  };

  const handleGetSuggestions = useCallback(async (content: string) => {
    if (!content.trim()) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: SuggestionRequest = {
        content,
        format: WritingFormat.NOVEL
      };

      console.log('Requesting suggestions:', request);
      const suggestions = await api.writing.getSuggestions(request);
      console.log('Received suggestions:', suggestions);

      if (!suggestions || suggestions.length === 0) {
        setError('No suggestions available. Try writing more content.');
      }

      return suggestions;

    } catch (error) {
      console.error('Failed to get suggestions:', error);
      setError(error instanceof Error ? error.message : 'Failed to get suggestions');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <img src="/logo192.png" alt="Logo" style={{ width: 40, height: 40, display: 'block', margin: '0 auto' }} />
      </header>
      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        <Editor
          onSave={handleSave}
          onRequestSuggestions={handleGetSuggestions}
        />
      </main>
    </div>
  );
};

export default App;

<MainPanel />
