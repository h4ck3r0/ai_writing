import React, { useState } from 'react';

interface AppMenuProps {
  onSave: () => void;
  onGetSuggestions: () => void;
  onShowAIFeatures: () => void;
  onApplyHeading: (level: number | null) => void;
  onToggleFormat: (format: string) => void;
  onSetColor: (color: string) => void;
  onSetHighlight: (color: string) => void;
  currentColor: string;
  currentHighlight: string;
}

const AppMenu: React.FC<AppMenuProps> = ({
  onSave,
  onGetSuggestions,
  onShowAIFeatures,
  onApplyHeading,
  onToggleFormat,
  onSetColor,
  onSetHighlight,
  currentColor,
  currentHighlight,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-menu">
      <button
        className="app-menu-logo"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
        }}
      >
        <img src="/logo192.png" alt="Logo" style={{ width: 40, height: 40 }} />
      </button>
      {open && (
        <div className="app-menu-drawer">
          <button onClick={onSave}>Save</button>
          <button onClick={onGetSuggestions}>Get AI Suggestions</button>
          <button onClick={onShowAIFeatures}>AI Features</button>
          <select
            onChange={e => onApplyHeading(e.target.value ? Number(e.target.value) : null)}
            defaultValue=""
            style={{ padding: '4px 8px', borderRadius: '4px', margin: '8px 0' }}
          >
            <option value="">Paragraph</option>
            <option value={1}>Heading 1</option>
            <option value={2}>Heading 2</option>
            <option value={3}>Heading 3</option>
            <option value={4}>Heading 4</option>
            <option value={5}>Heading 5</option>
            <option value={6}>Heading 6</option>
          </select>
          <button onClick={() => onToggleFormat('bold')}>Bold</button>
          <button onClick={() => onToggleFormat('italic')}>Italic</button>
          <button onClick={() => onToggleFormat('underline')}>Underline</button>
          <div style={{ margin: '8px 0' }}>
            <span>Text Color:</span>
            <input
              type="color"
              value={currentColor}
              onChange={e => onSetColor(e.target.value)}
              style={{ verticalAlign: 'middle', marginLeft: 8 }}
            />
          </div>
          <div style={{ margin: '8px 0' }}>
            <span>Highlight:</span>
            <input
              type="color"
              value={currentHighlight}
              onChange={e => onSetHighlight(e.target.value)}
              style={{ verticalAlign: 'middle', marginLeft: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppMenu;