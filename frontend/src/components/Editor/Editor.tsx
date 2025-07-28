import React, { useState, useCallback, useMemo, useRef } from 'react';
import { createEditor, Transforms, Editor, Range, Element as SlateElement, Node, Descendant, Text } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import './Editor.css';
import { AISuggestion } from '../../types';
import SuggestionsPanel from '../SuggestionsPanel/SuggestionsPanel';
import AIFeaturesPanel from '../AIFeaturesPanel';

interface EditorProps {
  onSave?: (content: string) => Promise<void>;
  onRequestSuggestions?: (content: string) => Promise<AISuggestion[]>;
}

type CustomElement = { type: string; children: Descendant[] };

const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

const EditorComponent: React.FC<EditorProps> = ({ onSave, onRequestSuggestions }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [aiFeaturesContent, setAIFeaturesContent] = useState('');
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormat, setSaveFormat] = useState<'txt' | 'pdf' | 'docx'>('txt');
  const floatingBtnRef = useRef<HTMLButtonElement>(null);

  // Selection state for floating button
  const [selection, setSelection] = useState<Range | null>(null);

  // Color/Highlight state for toolbar color pickers
  const [currentColor, setCurrentColor] = useState('#222');
  const [currentHighlight, setCurrentHighlight] = useState('#fff');

  // Formatting toolbar actions
  const toggleFormat = (format: string) => {
    const isActive = isFormatActive(editor, format);
    Transforms.setNodes(
      editor,
      { [format]: isActive ? null : true } as Partial<Text>,
      { match: (n: Node) => Text.isText(n), split: true }
    );
  };

  const setColor = (color: string) => {
    setCurrentColor(color);
    Transforms.setNodes(
      editor,
      { color } as Partial<Text>,
      { match: (n: Node) => Text.isText(n), split: true }
    );
  };

  const setHighlight = (highlight: string) => {
    setCurrentHighlight(highlight);
    Transforms.setNodes(
      editor,
      { highlight } as Partial<Text>,
      { match: (n: Node) => Text.isText(n), split: true }
    );
  };

  const applyHeading = (level: number | null) => {
    Transforms.setNodes<SlateElement>(
      editor,
      { type: level ? `heading${level}` : 'paragraph' } as Partial<SlateElement>,
      {
        match: (n: Node) =>
          SlateElement.isElement(n) &&
          Editor.isBlock(editor, n)
      }
    );
  };

  // Save logic
  const handleSave = async () => {
    setShowSaveModal(true);
  };

  const handleDownload = () => {
    let text = SlateEditorToPlainText(value);
    if (saveFormat === 'txt') {
      const blob = new Blob([text], { type: 'text/plain' });
      triggerDownload(blob, 'document.txt');
    } else if (saveFormat === 'pdf') {
      alert('PDF export not implemented in this stub.');
    } else if (saveFormat === 'docx') {
      alert('Word export not implemented in this stub.');
    }
    setShowSaveModal(false);
  };

  // AI Suggestions logic
  const handleGetSuggestions = useCallback(async () => {
    const text = SlateEditorToPlainText(value);
    if (!onRequestSuggestions || isLoading || !text.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const newSuggestions = await onRequestSuggestions(text);
      if (Array.isArray(newSuggestions)) {
        setSuggestions(newSuggestions);
        setShowSuggestionsPanel(true);
        if (newSuggestions.length === 0) setError('No suggestions available');
      } else {
        setError('Failed to get suggestions');
      }
    } catch (error) {
      setError('Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [value, isLoading, onRequestSuggestions]);

  const handleApplySuggestion = useCallback((suggestion: AISuggestion) => {
    Transforms.insertText(editor, suggestion.text);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, [editor]);

  const handleDismissSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  }, []);

  // Floating button for selection
  const renderFloatingButton = () => {
    if (!selection || Range.isCollapsed(selection)) return null;
    const domRange = ReactEditor.toDOMRange(editor, selection);
    const rect = domRange.getBoundingClientRect();
    return (
      <button
        ref={floatingBtnRef}
        style={{
          position: 'absolute',
          top: rect.top + window.scrollY - 100, // Move button above selection
          left: rect.left + window.scrollX,
          zIndex: 100,
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: 'pointer'
        }}
        onClick={() => {
          const selectedText = Editor.string(editor, selection);
          setAIFeaturesContent(selectedText);
          setShowAIFeatures(true);
          setSelection(null);
        }}
      >
        Send to AI Features
      </button>
    );
  };

  // Toolbar component
  const Toolbar = () => (
    <div className="editor-toolbar">
      <button onClick={handleSave} className="toolbar-button">
        Save
      </button>
      <button
        onClick={handleGetSuggestions}
        className="toolbar-button"
      >
        {isLoading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
      </button>
      <button
        onClick={() => { setShowAIFeatures(true); setAIFeaturesContent(SlateEditorToPlainText(value)); }}
        className="toolbar-button"
        style={{ background: '#007bff', color: '#fff', marginLeft: '8px' }}
      >
        AI Features
      </button>
      <select
        onChange={e => applyHeading(e.target.value ? Number(e.target.value) : null)}
        defaultValue=""
        style={{ padding: '4px 8px', borderRadius: '4px' }}
      >
        <option value="">Normal</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
        <option value={4}>Heading 4</option>
        <option value={5}>Heading 5</option>
        <option value={6}>Heading 6</option>
      </select>
      <button onClick={() => toggleFormat('bold')}>Bold</button>
      <button onClick={() => toggleFormat('italic')}>Italic</button>
      <button onClick={() => toggleFormat('underline')}>Underline</button>
      <span style={{ marginLeft: 8 }}>Text Color:</span>
      <input
        type="color"
        value={currentColor}
        onChange={e => setColor(e.target.value)}
        style={{ verticalAlign: 'middle', marginRight: 8, border: 'none', background: 'none' }}
      />
      <span style={{ marginLeft: 8 }}>Highlight:</span>
      <input
        type="color"
        value={currentHighlight}
        onChange={e => setHighlight(e.target.value)}
        style={{ verticalAlign: 'middle', marginRight: 8, border: 'none', background: 'none' }}
      />
    </div>
  );

  return (
    <div className="editor-layout">
      <div className="editor-main">
        <Toolbar />
        <div className="editor-content" style={{ position: 'relative' }}>
          <Slate
            editor={editor}
            initialValue={initialValue}
            onChange={(val: Descendant[]) => {
              setValue(val);
              setSelection(editor.selection);
            }}
          >
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Start writing your story..."
              style={{
                minHeight: '180px',
                background: '#fff',
                borderRadius: '0',
                padding: '16px',
                border: 'none',
                fontSize: '17px',
                boxSizing: 'border-box'
              }}
            />
            {renderFloatingButton()}
          </Slate>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        {showSaveModal && (
          <div className="save-modal">
            <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <h3>Save As</h3>
              <select value={saveFormat} onChange={e => setSaveFormat(e.target.value as any)}>
                <option value="txt">Text (.txt)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="docx">Word (.docx)</option>
              </select>
              <div style={{ marginTop: 16 }}>
                <button onClick={handleDownload} style={{ marginRight: 8 }}>Download</button>
                <button onClick={() => setShowSaveModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {showAIFeatures && (
          <AIFeaturesPanel
            onClose={() => setShowAIFeatures(false)}
            initialContent={aiFeaturesContent}
          />
        )}
      </div>
      {showSuggestionsPanel && (
        <div className="editor-suggestions" style={{ alignSelf: 'stretch' }}>
          <button
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#888',
              zIndex: 10
            }}
            onClick={() => setShowSuggestionsPanel(false)}
            title="Close"
          >×</button>
          <SuggestionsPanel
            suggestions={suggestions}
            onApply={handleApplySuggestion}
            onDismiss={handleDismissSuggestion}
          />
        </div>
      )}
    </div>
  );
};

// Helper functions
function isFormatActive(editor: Editor, format: string) {
  const [match] = Array.from(Editor.nodes(editor, {
    match: (n: Node) => !!(n as any)[format],
    universal: true,
  }));
  return !!match;
}

function renderElement(props: any) {
  const { element, attributes, children } = props;
  switch (element.type) {
    case 'heading1':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading2':
      return <h2 {...attributes}>{children}</h2>;
    case 'heading3':
      return <h3 {...attributes}>{children}</h3>;
    case 'heading4':
      return <h4 {...attributes}>{children}</h4>;
    case 'heading5':
      return <h5 {...attributes}>{children}</h5>;
    case 'heading6':
      return <h6 {...attributes}>{children}</h6>;
    default:
      return <p {...attributes}>{children}</p>;
  }
}

function renderLeaf(props: any) {
  let { attributes, children, leaf } = props;
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.color) {
    children = <span style={{ color: leaf.color }}>{children}</span>;
  }
  if (leaf.highlight) {
    children = <span style={{ background: leaf.highlight }}>{children}</span>;
  }
  return <span {...attributes}>{children}</span>;
}

function SlateEditorToPlainText(value: Descendant[]) {
  return value.map(n => Node.string(n)).join('\n');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default EditorComponent;