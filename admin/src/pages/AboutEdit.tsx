import React, { useEffect, useState } from 'react';
import MarkdownEditor from '../components/MarkdownEditor';
import { getAbout, updateAbout, hasZhAbout, getZhAbout, saveZhAbout } from '../api';

const AboutEdit: React.FC = () => {
  const [content, setContent] = useState('');
  const [zhContent, setZhContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);

  useEffect(() => {
    Promise.all([
      getAbout(),
      hasZhAbout(),
    ])
      .then(([res, zh]) => {
        setContent(res.content);
        setHasZh(zh);
      })
      .catch((err) => alert(`Failed to load about page: ${err}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (lang === 'zh' && hasZh && !zhContent) {
      getZhAbout()
        .then((res) => setZhContent(res.content))
        .catch(() => { /* new zh file, start empty */ });
    }
  }, [lang, hasZh]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (lang === 'zh') {
        await saveZhAbout(zhContent);
      } else {
        await updateAbout(content);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(`Failed to save: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">About Page</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600">Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center border border-neutral-200 rounded-md text-xs overflow-hidden">
          <button type="button" onClick={() => setLang('en')} className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>EN</button>
          <button type="button" onClick={() => { setLang('zh'); if (!hasZh) setHasZh(true); }} className={`px-3 py-1.5 transition-colors ${lang === 'zh' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'}`}>ZH</button>
        </div>
        {lang === 'zh' && !hasZh && <span className="text-xs text-neutral-400">Creating Chinese version</span>}
      </div>

      <MarkdownEditor value={lang === 'zh' ? zhContent : content} onChange={lang === 'zh' ? setZhContent : setContent} />
    </div>
  );
};

export default AboutEdit;
