import React, { useRef, useState } from 'react';
import { MarkdownRenderer } from '@shared/components/MarkdownRenderer';
import '@shared/index.css';
import InsertToolbar from './InsertToolbar';
import AutocompleteDropdown from './AutocompleteDropdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autocomplete, setAutocomplete] = useState<{ show: boolean; filter: string; position: { top: number; left: number }; startPos: number } | null>(null);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);

    // Find if we're in a :: context
    const colonMatch = textBefore.match(/::([\w]*)$/);

    if (colonMatch) {
      // Calculate position for dropdown
      // Simple approach: position below the textarea's top + some offset
      const lines = textBefore.split('\n');
      const lineNumber = lines.length - 1;
      const lineHeight = 20; // approximate
      const top = (lineNumber + 1) * lineHeight + 8;
      const left = 16;

      setAutocomplete({
        show: true,
        filter: colonMatch[1],
        position: { top, left },
        startPos: cursorPos - colonMatch[0].length,
      });
    } else {
      if (autocomplete) setAutocomplete(null);
    }
  };

  const handleAutocompleteSelect = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !autocomplete) return;

    const before = textarea.value.substring(0, autocomplete.startPos);
    const after = textarea.value.substring(textarea.selectionStart);
    const newValue = before + '\n' + syntax + '\n' + after;
    onChange(newValue);
    setAutocomplete(null);

    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = before.length + 1 + syntax.length + 1;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="flex border-b border-neutral-200 bg-white">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'edit'
              ? 'text-neutral-900 border-b-2 border-neutral-900'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'preview'
              ? 'text-neutral-900 border-b-2 border-neutral-900'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          Preview
        </button>
      </div>

      {mode === 'edit' ? (
        <div key="edit" className="animate-fade-in relative">
          <InsertToolbar textareaRef={textareaRef} onInsert={onChange} />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyUp={handleKeyUp}
            className="w-full min-h-[500px] p-4 font-mono text-sm text-neutral-800 resize-y focus:outline-none"
            placeholder="Write your markdown content here..."
          />
          {autocomplete?.show && (
            <AutocompleteDropdown
              filter={autocomplete.filter}
              position={autocomplete.position}
              onSelect={handleAutocompleteSelect}
              onClose={() => setAutocomplete(null)}
            />
          )}
        </div>
      ) : (
        <div key="preview" className="p-6 max-w-none min-h-[500px] animate-fade-in">
          <MarkdownRenderer content={value} />
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
