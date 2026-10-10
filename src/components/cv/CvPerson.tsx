/** Advisor profiles share one data owner and the CV's existing accessible preview interaction. */
import React, { createContext, useContext, useMemo } from 'react';
import type { CvPersonProfile } from '../../types/cv';
import { cvHref } from '../../utils/cv';
import { CvPreviewLink } from './CvPreviewLink';

const CvPeople = createContext<ReadonlyMap<string, CvPersonProfile>>(new Map());

export function CvPeopleProvider({ people = [], children }: { people?: CvPersonProfile[]; children: React.ReactNode }) {
  const entries = useMemo(() => new Map(people.map(person => [person.id, person])), [people]);
  return <CvPeople.Provider value={entries}>{children}</CvPeople.Provider>;
}

export function CvPerson({ id }: { id: string }) {
  const person = useContext(CvPeople).get(id);
  if (!person) return <span>{id}</span>;
  const label = person.label || person.name;
  const href = cvHref(person.url);
  if (!href) return <span>{label}</span>;
  return <CvPreviewLink href={href} label={label} className="cv-person-link" title={person.name}
    eyebrow={person.relationship} detail={person.affiliation} external actionLabel="Visit website">
    {label}
  </CvPreviewLink>;
}
