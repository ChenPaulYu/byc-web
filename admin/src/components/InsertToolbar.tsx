import React from 'react';

interface InsertToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (text: string) => void;
}

const InsertToolbar: React.FC<InsertToolbarProps> = ({ textareaRef, onInsert }) => {
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
  ];

  return (
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
    </div>
  );
};

export default InsertToolbar;
