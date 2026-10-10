/** Citation and award previews retain reading origins and offer a visible return for direct links. */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cvAwardTarget, type CvReferencePreview } from '../../utils/cv';
import { CvLinks } from './CvLinks';
import { CvPreviewLink, CvPreviewProvider, restoreCvReadingFocus, type CvNavigationOrigin } from './CvPreviewLink';

export const CvReferences = createContext<ReadonlyMap<string, CvReferencePreview>>(new Map());
const ReadingNavigation = createContext<((origin: CvNavigationOrigin) => void) | undefined>(undefined);
interface ReadingPoint { url: string; left: number; top: number; anchorTop: number; href: string; index: number; origin?: CvNavigationOrigin; }
const readingUrl = () => window.location.pathname + window.location.search + window.location.hash;
const referenceHref = (entry: CvReferencePreview) => entry.kind === 'award' ? `#${cvAwardTarget(entry.id)}` : `#cv-ref-${entry.id}`;
const sourceLinks = (href: string) => [...document.querySelectorAll<HTMLAnchorElement>('a.cv-ref, a.cv-award-ref')]
  .filter(link => link.getAttribute('href') === href);
const savedTrail = (): ReadingPoint[] => typeof window !== 'undefined' && Array.isArray(window.history.state?.cvReading)
  ? window.history.state.cvReading : [];
const saveTrail = (points: ReadingPoint[]) => window.history.replaceState({
  ...window.history.state,
  cvReading: points.map(({ origin: _origin, ...point }) => point),
}, '');

export function CvReferenceProvider({ entries, children }: { entries: ReadonlyMap<string, CvReferencePreview>; children: React.ReactNode }) {
  const [trail, setTrail] = useState<ReadingPoint[]>(savedTrail);
  const [hash, setHash] = useState(() => typeof window === 'undefined' ? '' : window.location.hash);
  const current = [...entries.values()].find(entry => referenceHref(entry) === hash);
  const pending = useRef<ReadingPoint[] | null>(null);
  const [returning, setReturning] = useState(false);
  const cancelReturn = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const syncHistory = () => {
      setHash(window.location.hash);
      // Native hash navigation creates its history entry after the link's click handler.
      if (pending.current) {
        saveTrail(pending.current);
        setTrail(pending.current);
        pending.current = null;
      } else setTrail(savedTrail());
    };
    window.addEventListener('popstate', syncHistory);
    window.addEventListener('hashchange', syncHistory);
    return () => {
      window.removeEventListener('popstate', syncHistory);
      window.removeEventListener('hashchange', syncHistory);
      cancelReturn.current?.();
    };
  }, []);
  const remember = (origin: CvNavigationOrigin) => {
    const href = origin.element.getAttribute('href')!;
    const next = [...trail, {
      url: readingUrl(), left: window.scrollX, top: window.scrollY,
      anchorTop: origin.element.getBoundingClientRect().top, href,
      index: sourceLinks(href).indexOf(origin.element), origin,
    }];
    saveTrail(trail);
    if (window.location.hash === href) saveTrail(next);
    else pending.current = next;
    setTrail(next);
  };
  const back = () => {
    const point = trail[trail.length - 1];
    if (!point || returning) return;
    setTrail(points => points.slice(0, -1));
    const restore = () => {
      const element = point.origin?.element.isConnected ? point.origin.element : sourceLinks(point.href)[point.index];
      const top = element ? element.getBoundingClientRect().top + window.scrollY - point.anchorTop : point.top;
      if (point.origin?.element === element) point.origin.restoreFocus();
      else if (element) restoreCvReadingFocus(element);
      window.scrollTo({ left: point.left, top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    if (readingUrl() === point.url) { saveTrail(trail.slice(0, -1)); restore(); return; }
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
    {(trail.length > 0 || current) && createPortal(<nav className="cv-reading-actions" aria-label="CV reading navigation">
      <span className="cv-reading-context" aria-live="polite">{current ? current.kind === 'award' ? 'Viewing award' : `Viewing ${current.id}` : 'Viewing reference'}</span>
      {trail.length > 0 ? <button type="button" className="cv-reading-return" onClick={back} disabled={returning}>
        <ReturnArrow />Back to reading
      </button> : <a className="cv-reading-return" href={window.location.pathname + window.location.search}>
        <ReturnArrow />Back to CV
      </a>}
    </nav>, document.body)}
  </CvPreviewProvider></ReadingNavigation.Provider></CvReferences.Provider>;
}

function ReturnArrow() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>;
}

export function CvReference({ id }: { id: string }) {
  const entry = useContext(CvReferences).get(id);
  const remember = useContext(ReadingNavigation);
  if (!entry) return id.startsWith('award:') ? null : <span className="cv-ref">{id}</span>;
  const award = entry.kind === 'award';
  return <CvPreviewLink href={referenceHref(entry)}
    label={award ? `Go to award: ${entry.title}` : `Go to ${id}: ${entry.title}`} className={award ? 'cv-badge cv-badge-award cv-award-ref' : 'cv-ref'}
    title={entry.title} eyebrow={award ? `Honors & Awards · ${entry.year}` : `${id} · ${entry.kind === 'publication' ? 'Publication' : 'Interactive art'} · ${entry.year}`}
    detail={entry.detail} meta={entry.venue} resources={<CvLinks links={entry.links} />} onNavigate={remember}>
    {award ? (entry.label || entry.title) : id}
  </CvPreviewLink>;
}
