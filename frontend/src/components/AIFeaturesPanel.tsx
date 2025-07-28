import React, { useState, useEffect } from 'react';
import { aiFeaturesApi } from '../services/api';
import './AIFeaturesPanel.css';

const features = [
  { key: 'analyzeThemeConsistency', label: 'Analyze Theme Consistency', params: ['content'] },
  { key: 'detectForeshadowing', label: 'Detect Foreshadowing', params: ['content'] },
  { key: 'analyzeMotivationStakes', label: 'Analyze Motivation & Stakes', params: ['content'] },
  { key: 'analyzeSceneBreakdown', label: 'Analyze Scene Breakdown', params: ['content'] },
  { key: 'detectGenreCliches', label: 'Detect Genre Clichés', params: ['content', 'genre'] },
  { key: 'matchAudienceTone', label: 'Match Audience Tone', params: ['content', 'audience'] },
  { key: 'reviewRevisionHistory', label: 'Review Revision History', params: ['content', 'previousDraft'] },
  { key: 'interactiveQA', label: 'Interactive Q&A', params: ['content', 'question'] },
  { key: 'suggestTitleLogline', label: 'Suggest Title & Logline', params: ['content'] },
];

export default function AIFeaturesPanel({
  onClose,
  initialContent = ''
}: {
  onClose: () => void;
  initialContent?: string;
}) {
  const [selectedFeature, setSelectedFeature] = useState(features[0].key);
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Pre-fill content input when initialContent changes
  useEffect(() => {
    if (initialContent) {
      setInputs(inputs => ({ ...inputs, content: initialContent }));
    }
  }, [initialContent]);

  const handleInputChange = (param: string, value: string) => {
    setInputs({ ...inputs, [param]: value });
  };
  const handleRun = async () => {
    setLoading(true);
    try {
      const params = features.find(f => f.key === selectedFeature)?.params || [];
      const args = params.map(p => inputs[p] || '');
      // @ts-ignore
      const response = await aiFeaturesApi[selectedFeature](...args);
      setSuggestions(response.data.data.suggestions || []);
    } catch (e) {
      setSuggestions([{ text: 'Error fetching suggestions.' }]);
    }
    setLoading(false);
  };

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (dragging && dragStart) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };
  const handleMouseUp = () => {
    setDragging(false);
    setDragStart(null);
  };
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStart]);

  return (
    <div
      className="ai-features-panel"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: dragging ? 'move' : 'default',
      }}
    >
      <div
        className="ai-features-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'move', userSelect: 'none' }}
      >
        <h2>AI Features</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      <div className="ai-features-select">
        <select value={selectedFeature} onChange={e => setSelectedFeature(e.target.value)}>
          {features.map(f => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      </div>
      <div className="ai-features-inputs">
        {features.find(f => f.key === selectedFeature)?.params.map(param => (
          <input
            key={param}
            type="text"
            placeholder={param}
            value={inputs[param] || ''}
            onChange={e => handleInputChange(param, e.target.value)}
            className="ai-input"
          />
        ))}
      </div>
      <button onClick={handleRun} disabled={loading} className="run-btn">
        {loading ? 'Running...' : 'Run'}
      </button>
      <div className="ai-features-results">
        {suggestions.map((s, i) => (
          <div key={i} className="suggestion">
            {s.text || JSON.stringify(s)}
            <button
              style={{
                marginLeft: '8px',
                padding: '2px 8px',
                fontSize: '13px',
                borderRadius: '4px',
                border: '1px solid #007bff',
                background: '#fff',
                color: '#007bff',
                cursor: 'pointer'
              }}
              onClick={() => navigator.clipboard.writeText(s.text || JSON.stringify(s))}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}