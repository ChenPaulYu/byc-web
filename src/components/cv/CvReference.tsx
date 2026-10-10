/** Citation metadata feeds the shared preview while retaining stable document anchors. */
import React, { createContext, useContext } from 'react';
import type { CvReferencePreview } from '../../utils/cv';
import { CvLinks } from './CvLinks';
import { CvPreviewLink, CvPreviewProvider } from './CvPreviewLink';

export const CvReferences = createContext<ReadonlyMap<string, CvReferencePreview>>(new Map());

export function CvReferenceProvider({ entries, children }: { entries: ReadonlyMap<string, CvReferencePreview>; children: React.ReactNode }) {
  return <CvReferences.Provider value={entries}><CvPreviewProvider>{children}</CvPreviewProvider></CvReferences.Provider>;
}

export function CvReference({ id }: { id: string }) {
  const entry = useContext(CvReferences).get(id);
  if (!entry) return <span className="cv-ref">{id}</span>;
  return <CvPreviewLink href={`#cv-ref-${id}`} label={`Go to ${id}: ${entry.title}`} className="cv-ref"
    title={entry.title} eyebrow={`${id} · ${entry.kind === 'publication' ? 'Publication' : 'Interactive art'} · ${entry.year}`}
    detail={entry.detail} meta={entry.venue} resources={<CvLinks links={entry.links} />}>
    {id}
  </CvPreviewLink>;
}
