/** Citation and award previews share stable anchors and a reversible reading navigation trail. */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { cvAwardTarget, type CvReferencePreview } from '../../utils/cv';
import { CvLinks } from './CvLinks';
import { CvPreviewLink, CvPreviewProvider, type CvNavigationOrigin } from './CvPreviewLink';

export const CvReferences = createContext<ReadonlyMap<string, CvReferencePreview>>(new Map());
const ReadingNavigation = createContext<((origin: CvNavigationOrigin) => void) | undefined>(undefined);
interface ReadingPoint { url: string; left: number; top: number; anchorTop: number; origin: CvNavigationOrigin; }
const readingUrl = () => window.location.pathname + window.location.search + window.location.hash;

export function CvReferenceProvider({ entries, children }: { entries: ReadonlyMap<string, CvReferencePreview>; children: React.ReactNode }) {
  const [trail, setTrail] = useState<ReadingPoint[]>([]);
  const [returning, setReturning] = useState(false);
  const cancelReturn = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const syncBrowserBack = () => setTrail(points => {
      let index = points.length - 1;
      while (index >= 0 && points[index].url !== readingUrl()) index--;
      return index < 0 ? points : points.slice(0, index);
    });
    window.addEventListener('popstate', syncBrowserBack);
    return () => { window.removeEventListener('popstate', syncBrowserBack); cancelReturn.current?.(); };
  }, []);
  const remember = (origin: CvNavigationOrigin) => setTrail(points => [...points, {
    url: readingUrl(), left: window.scrollX, top: window.scrollY, anchorTop: origin.element.getBoundingClientRect().top, origin,
  }]);
  const back = () => {
    const point = trail[trail.length - 1];
    if (!point || returning) return;
    setTrail(points => points.slice(0, -1));
    const restore = () => {
      const top = point.origin.element.isConnected
        ? point.origin.element.getBoundingClientRect().top + window.scrollY - point.anchorTop : point.top;
      point.origin.restoreFocus();
      window.scrollTo({ left: point.left, top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    if (readingUrl() === point.url) { restore(); return; }
    setReturning(true);
    const scrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    let frame = 0;
    const cleanup = () => {
      window.removeEventListener('popstate', returned);
      cancelAnimationFrame(frame);
      window.history.scrollRestoration = scrollRestoration;
      cancelReturn.current = undefined;
    };
    const returned = () => { frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
      cleanup(); setReturning(false); restore();
    }); }); };
    cancelReturn.current = cleanup;
    window.addEventListener('popstate', returned, { once: true });
    window.history.back();
  };
  return <CvReferences.Provider value={entries}><ReadingNavigation.Provider value={remember}><CvPreviewProvider>
    {children}
    {trail.length > 0 && <div className="cv-reading-actions"><button type="button" className="cv-reading-return" onClick={back} disabled={returning}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>Back to reading
    </button></div>}
  </CvPreviewProvider></ReadingNavigation.Provider></CvReferences.Provider>;
}

export function CvReference({ id }: { id: string }) {
  const entry = useContext(CvReferences).get(id);
  const remember = useContext(ReadingNavigation);
  if (!entry) return id.startsWith('award:') ? null : <span className="cv-ref">{id}</span>;
  const award = entry.kind === 'award';
  return <CvPreviewLink href={award ? `#${cvAwardTarget(entry.id)}` : `#cv-ref-${id}`}
    label={award ? `Go to award: ${entry.title}` : `Go to ${id}: ${entry.title}`} className={award ? 'cv-badge cv-badge-award cv-award-ref' : 'cv-ref'}
    title={entry.title} eyebrow={award ? `Honors & Awards · ${entry.year}` : `${id} · ${entry.kind === 'publication' ? 'Publication' : 'Interactive art'} · ${entry.year}`}
    detail={entry.detail} meta={entry.venue} resources={<CvLinks links={entry.links} />} onNavigate={remember}>
    {award ? (entry.label || entry.title) : id}
  </CvPreviewLink>;
}
