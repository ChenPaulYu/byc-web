import React, { useState } from 'react';

interface InsertToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (text: string) => void;
}

const InsertToolbar: React.FC<InsertToolbarProps> = ({ textareaRef, onInsert }) => {
  const [showHints, setShowHints] = useState(false);

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = before + (selected || 'text') + after;

    onInsert(
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end)
    );

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursor = start + before.length + (selected || 'text').length;
      textarea.setSelectionRange(newCursor, newCursor);
    });
  };

  const buttons = [
    { label: 'H2', action: () => insertAtCursor('\n## ', '\n'), title: 'Heading' },
    { label: 'B', action: () => insertAtCursor('**', '**'), title: 'Bold' },
    { label: 'I', action: () => insertAtCursor('*', '*'), title: 'Italic' },
    { label: 'Image', action: () => insertAtCursor('![alt](', ')'), title: 'Image' },
    { label: 'Video', action: () => insertAtCursor('\nhttps://www.youtube.com/watch?v=VIDEO_ID\n', ''), title: 'YouTube' },
    { label: 'List', action: () => insertAtCursor('\n- ', '\n'), title: 'List item' },
    { label: 'Code', action: () => insertAtCursor('`', '`'), title: 'Inline code' },
    { label: 'Audio', action: () => insertAtCursor('\n::audio[', ']\n'), title: 'Audio player' },
  ];

  return (
    <div>
      <div className="flex items-center gap-1 px-3 py-2 border-b border-neutral-200 bg-neutral-50">
        {buttons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className="px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-200 rounded transition-colors"
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowHints(!showHints)}
          title="Syntax hints"
          className={`px-2 py-1 text-xs rounded transition-colors ${showHints ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
        >
          ?
        </button>
      </div>
      {showHints && (
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50 text-xs text-neutral-500 space-y-1 animate-fade-in">
          <p className="font-medium text-neutral-700 mb-2">Markdown & Custom Components</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">## Heading</code> — Section heading</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">**bold**</code> — Bold text</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">*italic*</code> — Italic text</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">![alt](url)</code> — Image</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">[text](url)</code> — Hyperlink</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">- item</code> — Unordered list</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">1. item</code> — Ordered list</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">`code`</code> — Inline code</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">&gt; quote</code> — Blockquote</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">---</code> — Horizontal rule</p>
          </div>
          <p className="font-medium text-neutral-700 mt-3 mb-2">Custom Components</p>
          <div className="space-y-1">
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">::audio[/path/to/file.wav]</code> — Interactive waveform audio player</p>
            <p><code className="text-red-500 bg-neutral-100 px-1 rounded">https://youtube.com/watch?v=ID</code> — YouTube embed (paste URL on its own line)</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsertToolbar;
