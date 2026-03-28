import React from 'react';

interface LanguageToggleProps {
  lang: 'en' | 'zh';
  hasZh: boolean;
  onChange: (lang: 'en' | 'zh') => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ lang, hasZh, onChange }) => {
  if (!hasZh) return null;

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
};

export default LanguageToggle;
