import React from 'react';

interface LanguageToggleProps {
  lang: 'en' | 'zh';
  hasZh: boolean;
  onChange: (lang: 'en' | 'zh') => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ lang, hasZh, onChange }) => {
  // Both languages available — show interactive toggle
  if (hasZh) {
    return (
      <div className="inline-flex items-center border border-neutral-200 rounded-md text-xs overflow-hidden transition-all duration-200">
        <button
          onClick={() => onChange('en')}
          className={`px-2.5 py-1 transition-colors duration-150 ${
            lang === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => onChange('zh')}
          className={`px-2.5 py-1 transition-colors duration-150 ${
            lang === 'zh' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          ZH
        </button>
      </div>
    );
  }

  // Only one language — show a static badge
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wide bg-neutral-100 text-neutral-400">
      {lang === 'en' ? 'EN' : 'ZH'}
    </span>
  );
};

export default LanguageToggle;
