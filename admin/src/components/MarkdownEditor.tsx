import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import InsertToolbar from './InsertToolbar';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        <>
          <InsertToolbar textareaRef={textareaRef} onInsert={onChange} />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-[500px] p-4 font-mono text-sm text-neutral-800 resize-y focus:outline-none"
            placeholder="Write your markdown content here..."
          />
        </>
      ) : (
        <div className="p-6 prose prose-neutral max-w-none min-h-[500px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
