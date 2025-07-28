import React, { useState } from 'react';
import SuggestionsPanel from './SuggestionsPanel/SuggestionsPanel';
import AIFeaturesPanel from './AIFeaturesPanel';
import { AISuggestion } from '../types';

// Example props for SuggestionsPanel
const exampleSuggestions: AISuggestion[] = [];
const handleApply = () => {};
const handleDismiss = () => {};

export default function MainPanel() {
  const [showAIFeatures, setShowAIFeatures] = useState(false);

  return (
    <>
      <SuggestionsPanel
        suggestions={exampleSuggestions}
        onApply={handleApply}
        onDismiss={handleDismiss}
      />
      <button
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          padding: '12px 20px',
          borderRadius: '8px',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          fontSize: '16px'
        }}
        onClick={() => setShowAIFeatures(true)}
      >
        AI Features
      </button>
      {showAIFeatures && (
        <AIFeaturesPanel onClose={() => setShowAIFeatures(false)} />
      )}
    </>
  );
}