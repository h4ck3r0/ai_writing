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
type CustomText = Text & { entityType?: string };

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
    if (!editor.selection) return;
    Transforms.setNodes<SlateElement>(
      editor,
      { type: level ? `heading${level}` : 'paragraph' } as Partial<SlateElement>,
      {
        at: editor.selection,
        match: (n: Node) =>
          SlateElement.isElement(n) &&
          Editor.isBlock(editor, n)
      }
    );
  };

  // Entity detection state
  const [entities, setEntities] = useState<any[]>([]);

  // Entity detection API call
  const detectEntities = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      const data = await response.json();
      setEntities(data.entities || []);
    } catch (err) {
      setEntities([]);
    }
  }, []);

  // Update entities when editor value changes
  React.useEffect(() => {
    const plainText = SlateEditorToPlainText(value);
    if (plainText.trim().length > 0) {
      detectEntities(plainText);
    } else {
      setEntities([]);
    }
  }, [value, detectEntities]);
// Auto-apply entityType to matching Slate text nodes
React.useEffect(() => {
  if (!entities.length || !editor) return;
  let offset = 0;
  const nodesWithOffsets: { node: Text; path: any; start: number; end: number }[] = [];
  for (const [node, path] of Node.texts(editor)) {
    const text = node.text;
    nodesWithOffsets.push({
      node,
      path,
      start: offset,
      end: offset + text.length
    });
    offset += text.length;
  }
  entities.forEach(entity => {
    nodesWithOffsets.forEach(({ node, path, start, end }) => {
      if (entity.start < end && entity.end > start) {
        Transforms.setNodes(
          editor,
          { entityType: entity.type } as Partial<CustomText>,
          { at: path, match: n => Text.isText(n), split: true }
        );
      }
    });
  });
}, [entities, editor, value]);

  // Custom rendering for entity coloring
  const renderLeaf = useCallback((props: any) => {
    let { attributes, children, leaf } = props;
    if (leaf.entityType) {
      switch (leaf.entityType) {
        case 'name':
          children = <span className="entity-name">{children}</span>;
          break;
        case 'place':
          children = <span className="entity-place">{children}</span>;
          break;
        case 'organization':
          children = <span className="entity-organization">{children}</span>;
          break;
        case 'date':
          children = <span className="entity-date">{children}</span>;
          break;
        case 'event':
          children = <span className="entity-event">{children}</span>;
          break;
        case 'product':
          children = <span className="entity-product">{children}</span>;
          break;
        default:
          break;
      }
    }
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
  }, []);

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
    // setError(null); // removed unused error state
    try {
      const newSuggestions = await onRequestSuggestions(text);
      if (Array.isArray(newSuggestions)) {
        setSuggestions(newSuggestions);
        setShowSuggestionsPanel(true);
        // if (newSuggestions.length === 0) setError('No suggestions available');
      } else {
        // setError('Failed to get suggestions');
      }
    } catch (error) {
      // setError('Failed to get suggestions');
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

  const renderFloatingButton = () => {
    if (!selection || Range.isCollapsed(selection)) return null;
    const domRange = ReactEditor.toDOMRange(editor, selection);
    const rect = domRange.getBoundingClientRect();
    return (
      <button
        ref={floatingBtnRef}
        style={{
          position: 'absolute',
          top: rect.top + window.scrollY - 50,
          left: rect.left + window.scrollX,
          zIndex: 1000,
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

  // Helper to get current block type for dropdown
  const getCurrentBlockType = () => {
    if (!editor.selection) return '';
    const [match] = Array.from(
      Editor.nodes(editor, {
        at: editor.selection,
        match: n =>
          SlateElement.isElement(n) &&
          Editor.isBlock(editor, n),
      })
    );
    if (match) {
      const [node] = match;
      // Use type assertion to CustomElement to access 'type'
      const element = node as { type?: string };
      if (element.type && typeof element.type === 'string' && element.type.startsWith('heading')) {
        return element.type.replace('heading', '');
      }
      return '';
    }
    return '';
  };

  const Toolbar = () => (
    <div className="editor-toolbar">
      <button onClick={handleSave} className="toolbar-button" title="Save">
        💾
      </button>
      <button
        onClick={handleGetSuggestions}
        className="toolbar-button"
        title="Get AI Suggestions"
      >
        {isLoading ? '⏳' : '💡'}
      </button>
      <button
        onClick={() => { setShowAIFeatures(true); setAIFeaturesContent(SlateEditorToPlainText(value)); }}
        className="toolbar-button"
        style={{ background: '#007bff', color: '#fff', marginLeft: '8px' }}
        title="AI Features"
      >
        🤖
      </button>
      <select
        onChange={e => applyHeading(e.target.value ? Number(e.target.value) : null)}
        value={getCurrentBlockType()}
        style={{ padding: '4px 8px', borderRadius: '4px', width: 40 }}
        title="Heading"
      >
        <option value="">¶</option>
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
        <option value={4}>H4</option>
        <option value={5}>H5</option>
        <option value={6}>H6</option>
      </select>
      <button onClick={() => toggleFormat('bold')} title="Bold">𝐁</button>
      <button onClick={() => toggleFormat('italic')} title="Italic"><span style={{ fontStyle: 'italic' }}>I</span></button>
      <button onClick={() => toggleFormat('underline')} title="Underline"><span style={{ textDecoration: 'underline' }}>U</span></button>
      <span style={{ marginLeft: 8 }} title="Text Color">🎨</span>
      <input
        type="color"
        value={currentColor}
        onChange={e => setColor(e.target.value)}
        style={{ verticalAlign: 'middle', marginRight: 8, border: 'none', background: 'none', width: 28, height: 28 }}
        title="Text Color"
      />
      <span style={{ marginLeft: 8 }} title="Highlight">🖍️</span>
      <input
        type="color"
        value={currentHighlight}
        onChange={e => setHighlight(e.target.value)}
        style={{ verticalAlign: 'middle', marginRight: 8, border: 'none', background: 'none', width: 28, height: 28 }}
        title="Highlight"
      />
    </div>
  );

  return (
    <div className="editor-layout">
      <div className="editor-main">
        <Toolbar />
        <Slate
          editor={editor}
          initialValue={initialValue}
          onChange={val => {
            // Prevent setting empty value (Slate expects at least one node)
            if (!val || val.length === 0) {
              setValue(initialValue);
            } else {
              setValue(val);
            }
          }}
        >
          <Editable
            className="editor-content"
            renderLeaf={renderLeaf}
            renderElement={renderElement}
            onKeyDown={event => {
              // Custom key handling if needed
            }}
            onSelect={event => {
              const selection = editor.selection;
              setSelection(selection);
            }}
          />
        </Slate>
        {showAIFeatures && (
          <AIFeaturesPanel
            initialContent={aiFeaturesContent}
            onClose={() => setShowAIFeatures(false)}
          />
        )}
        {showSaveModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Save Document</h3>
              <select
                value={saveFormat}
                onChange={e => setSaveFormat(e.target.value as 'txt' | 'pdf' | 'docx')}
              >
                <option value="txt">Text (.txt)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="docx">Word (.docx)</option>
              </select>
              <button onClick={handleDownload}>Download</button>
              <button onClick={() => setShowSaveModal(false)}>Cancel</button>
            </div>
          </div>
        )}
        {renderFloatingButton()}
      </div>
      {showSuggestionsPanel && (
        <div className="editor-suggestions">
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