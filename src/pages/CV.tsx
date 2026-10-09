/** Public CV with language fallback; the same document is used for the downloadable PDF. */
import React, { useEffect, useState } from 'react';
import { usePageTitle } from '../utils/usePageTitle';
import LanguageToggle from '../components/LanguageToggle';
import { hasChineseCv } from '../utils/contentLoader';
import type { CvConfig } from '../types/cv';
import { CvDocument } from '../components/cv/CvDocument';
import './CV.css';

const CV: React.FC = () => {
  usePageTitle('CV');
  const [config, setConfig] = useState<CvConfig | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    hasChineseCv().then(value => { if (active) setHasZh(value); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setConfig(null);
    setError(false);
    async function load() {
      const read = async (url: string): Promise<CvConfig> => {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Failed to load CV (${response.status})`);
        return response.json();
      };
      try {
        let data: CvConfig;
        try { data = await read(lang === 'zh' ? '/cv.config.zh.json' : '/cv.config.json'); }
        catch (err) {
          if (lang !== 'zh' || controller.signal.aborted) throw err;
          data = await read('/cv.config.json');
        }
        if (!controller.signal.aborted) setConfig(data);
      } catch { if (!controller.signal.aborted) setError(true); }
    }
    void load();
    return () => controller.abort();
  }, [lang]);

  useEffect(() => {
    if (config && window.location.hash.startsWith('#cv-ref-')) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, [config]);

  return <div className="cv-page">
    {error ? <p role="alert">Unable to load the CV. Please refresh to try again.</p> : !config ? <p role="status">Loading CV…</p> : <>
      <CvDocument config={config} actions={<>
        <LanguageToggle lang={lang} hasZh={hasZh} onChange={setLang} />
        <button className="cv-print-button" onClick={() => window.print()} aria-label="Print or save CV as PDF"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6z" /></svg><span>Print / Save PDF</span></button>
      </>} />
      <div className="cv-download"><a href="/cv.pdf" download>Download PDF <span aria-hidden="true">↓</span></a></div>
    </>}
  </div>;
};
export default CV;
