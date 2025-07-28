import React, { memo, useState } from 'react';
import './SuggestionsPanel.css';
import { AISuggestion, SuggestionType } from '../../types';
import AIFeaturesPanel from '../AIFeaturesPanel';

interface SuggestionsPanelProps {
  suggestions: AISuggestion[];
  onApply: (suggestion: AISuggestion) => void;
  onDismiss: (id: string) => void;
}

const SuggestionTypeColors: Record<SuggestionType, string> = {
  STYLE: '#4CAF50',
  PLOT: '#2196F3',
  CHARACTER: '#9C27B0',
  DIALOGUE: '#FF9800',
  STRUCTURE: '#795548'
};

const SuggestionItem = memo(({ 
  suggestion,
  onApply,
  onDismiss 
}: { 
  suggestion: AISuggestion;
  onApply: (suggestion: AISuggestion) => void;
  onDismiss: (id: string) => void;
}) => {
  return (
    <div key={suggestion.id} className="suggestion-item">
      <div className="suggestion-header">
        <span 
          className="suggestion-type"
          style={{ 
            backgroundColor: SuggestionTypeColors[suggestion.type] || '#666'
          }}
        >
          {suggestion.type}
        </span>
        <span className="suggestion-confidence">
          {Math.round(suggestion.confidence * 100)}% confident
        </span>
      </div>
      
      <div className="suggestion-content">
        <div className="suggestion-section original">
          <label>Original Text:</label>
          <div className="text-content">
            {suggestion.metadata.originalText}
          </div>
        </div>
        
        <div className="suggestion-section improved">
          <label>Improved Version:</label>
          <div className="text-content">
            {suggestion.text}
          </div>
        </div>

        {suggestion.metadata.context && (
          <div className="suggestion-section context">
            <label>Context:</label>
            <div className="text-content context">
              {suggestion.metadata.context}
            </div>
          </div>
        )}
      </div>

      <div className="suggestion-actions">
        <button 
          className="apply-button"
          onClick={() => onApply(suggestion)}
          title="Apply this suggestion"
        >
          Apply Change
        </button>
        <button 
          className="dismiss-button"
          onClick={() => onDismiss(suggestion.id)}
          title="Dismiss this suggestion"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
});

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = memo(({
  suggestions,
  onApply,
  onDismiss
}) => {
  console.log('Rendering suggestions:', suggestions);

  if (!Array.isArray(suggestions)) {
    console.error('Invalid suggestions prop:', suggestions);
    return (
      <div className="suggestions-panel">
        <div className="error-message">
          Error loading suggestions
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-panel">
        <div className="no-suggestions">
          No suggestions available yet. Write more content and click "Get AI Suggestions".
        </div>
      </div>
    );
  }

  return (
    <div className="suggestions-panel">
      <h3>AI Suggestions ({suggestions.length})</h3>
      <div className="suggestions-list">
        {suggestions.map(suggestion => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onApply={onApply}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
});

SuggestionItem.displayName = 'SuggestionItem';
SuggestionsPanel.displayName = 'SuggestionsPanel';

export default SuggestionsPanel;
// Add AI Features Panel integration (non-breaking)

// Responsive AI Features button and panel (non-breaking addition)
