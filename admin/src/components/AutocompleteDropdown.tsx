import React, { useEffect, useState, useRef } from 'react';

interface AutocompleteItem {
  label: string;
  syntax: string;
  description: string;
}

const CUSTOM_COMPONENTS: AutocompleteItem[] = [
  { label: 'audio', syntax: '::audio[/path/to/file.wav]', description: 'Waveform audio player' },
  // Future components can be added here:
  // { label: 'spectrogram', syntax: '::spectrogram[/path/to/file.wav]', description: 'Frequency spectrogram' },
  // { label: 'compare', syntax: '::compare[/audio/a.wav|/audio/b.wav]', description: 'A/B audio comparison' },
  // { label: 'model3d', syntax: '::model3d[/models/file.glb]', description: '3D model viewer' },
];

interface AutocompleteDropdownProps {
  filter: string;
  position: { top: number; left: number };
  onSelect: (syntax: string) => void;
  onClose: () => void;
}

const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({ filter, position, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = CUSTOM_COMPONENTS.filter(item =>
    item.label.toLowerCase().startsWith(filter.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex].syntax);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[240px] animate-scale-in"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
        Components
      </div>
      {filtered.map((item, index) => (
        <button
          key={item.label}
          type="button"
          className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
            index === selectedIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50'
          }`}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => onSelect(item.syntax)}
        >
          <span className="text-xs font-mono text-neutral-900 font-medium">::{item.label}</span>
          <span className="text-xs text-neutral-400">{item.description}</span>
        </button>
      ))}
    </div>
  );
};

export default AutocompleteDropdown;
