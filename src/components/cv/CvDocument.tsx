/** CV content shared by the screen and print views; data stays in cv.config.json. */
import React from 'react';
import type { CvConfig, Experience } from '../../types/cv';
import { cvHref, publicationLinks, visibleCvReferences } from '../../utils/cv';
import { GitHubIcon, LinkedInIcon, MailIcon, ScholarIcon } from '../SocialIcons';
import { CvInline } from './CvInline';
import { CvReferenceProvider } from './CvReference';
import { CvLinks } from './CvLinks';

function Section({ title, children, keepTogether = false }: { title: string; children: React.ReactNode; keepTogether?: boolean }) {
  return <section className={`cv-section${keepTogether ? ' cv-section-keep' : ''}`}><h2>{title}</h2>{children}</section>;
}

function Bullets({ items }: { items?: string[] }) {
  return items?.length ? <ul className="cv-bullets">{items.map((text, i) => <li key={i}><CvInline text={text} /></li>)}</ul> : null;
}

function Experiences({ title, items }: { title: string; items?: Experience[] }) {
  if (!items?.length) return null;
  return <Section title={title}>{items.map((item, i) => <div className="cv-entry" key={i}>
    <div className="cv-entry-heading">
      <div className="cv-linked-title"><h3><CvInline text={item.company} /></h3><CvLinks links={item.links} title={item.company} description={item.role} /></div>
      <span className="cv-date">{item.duration}</span>
    </div>
    <div className="cv-entry-sub"><span><CvInline text={item.role} /></span>{item.location && <span className="cv-location">{item.location}</span>}</div>
    <Bullets items={item.description} />
  </div>)}</Section>;
}

export function CvDocument({ config, actions }: { config: CvConfig; actions?: React.ReactNode }) {
  const { header } = config;
  const visible = (key: string) => config.visibility?.[key] !== false;
  const contacts = [
    { label: 'GitHub', url: header.github, Icon: GitHubIcon },
    { label: 'Google Scholar', url: header.scholar, Icon: ScholarIcon },
    { label: 'LinkedIn', url: header.linkedin, Icon: LinkedInIcon },
  ];
  return <CvReferenceProvider entries={visibleCvReferences(config)}>
    <article className="cv-sheet" data-cv-ready="true" aria-label="Curriculum vitae">
      <header className="cv-header">
        <div className="cv-heading-row">
          <div><p className="cv-eyebrow">Curriculum Vitae</p><h1>{header.name}{header.nativeName && <span className="cv-native-name">{header.nativeName}</span>}</h1></div>
          {actions && <div className="cv-actions">{actions}</div>}
        </div>
        <p className="cv-tagline">{header.tagline}</p>
        <div className="cv-contacts">
          {header.location && <span>{header.location}</span>}
          {header.email && <a href={`mailto:${header.email}`}><MailIcon size={14} /><span>{header.email}</span></a>}
          {contacts.map(({ label, url, Icon }) => cvHref(url) && <a key={label} href={cvHref(url)} target="_blank" rel="noopener noreferrer"><Icon size={14} /><span>{label}</span></a>)}
        </div>
      </header>

      {visible('researchInterests') && config.researchInterests && <Section title="Research Interests"><p className="cv-interests"><CvInline text={config.researchInterests} /></p></Section>}
      {visible('education') && config.education.length > 0 && <Section title="Education">
        {config.education.map((item, i) => <div className="cv-entry" key={i}>
          <div className="cv-entry-heading"><h3>{item.school}</h3><span className="cv-date">{item.duration}</span></div>
          <div className="cv-entry-sub"><span>{item.degree}</span><span className="cv-location">{item.location}</span></div>
          <Bullets items={item.description} />
        </div>)}
      </Section>}
      {visible('awards') && config.awards.length > 0 && <Section title="Honors & Awards">
        {config.awards.map((item, i) => <div className="cv-compact-entry" key={i}><div><strong><CvInline text={item.title} /></strong> · <CvInline text={item.venue} />{item.detail && <> <span className="cv-badge"><CvInline text={item.detail} /></span></>}</div><span className="cv-date">{item.year}</span></div>)}
      </Section>}
      {visible('researchExperience') && <Experiences title="Research Experience" items={config.researchExperience} />}
      {visible('workExperience') && <Experiences title="Work Experience" items={config.workExperience} />}
      {visible('openSource') && <Experiences title="Open-Source Software & Toolkits" items={config.openSource} />}
      {visible('publications') && config.publications.length > 0 && <Section title="Publications">
        {config.publications.map((item, i) => {
          const hasBadges = Boolean(item.acceptanceRate || item.award);
          const links = <CvLinks links={publicationLinks(item)} title={item.title} description={item.venue} />;
          return <div className="cv-reference-entry cv-publication" id={item.id ? `cv-ref-${item.id}` : undefined} key={item.id || i}>
            <span className="cv-reference-label">{item.id}</span>
            <div className="cv-reference-body">
              <h3>{item.title}</h3>
              <p className="cv-authors"><CvInline text={item.authors} /></p>
              <div className="cv-venue cv-publication-venue"><CvInline text={item.venue} />{!item.venue.includes(item.year) && `, ${item.year}`}{!hasBadges && links}</div>
              {hasBadges && <div className="cv-publication-meta">
                {item.acceptanceRate && <span className="cv-badge">Acceptance {item.acceptanceRate}</span>}
                {item.award && <span className="cv-badge cv-badge-award">{item.award}</span>}
                {links}
              </div>}
            </div>
          </div>;
        })}
      </Section>}
      {visible('art') && !!config.art?.length && <Section title="Interactive Art & Installations" keepTogether>
        {config.art.map(item => <div className="cv-reference-entry cv-art-entry" id={`cv-ref-${item.id}`} key={item.id}>
          <span className="cv-reference-label">{item.id}</span>
          <div className="cv-reference-body">
            <div className="cv-art-heading">
              <div className="cv-linked-title"><h3>{item.title}</h3><CvLinks links={item.links} title={item.title} description={item.description} /></div>
              <span className="cv-date">{item.year}</span>
            </div>
            <p className="cv-art-description"><CvInline text={item.venue ? item.description.replace(/\.$/, '') : item.description} />{item.venue && <span className="cv-venue">{item.description && ' · '}<CvInline text={item.venue} /></span>}</p>
          </div>
        </div>)}
      </Section>}
      {visible('reviewer') && config.reviewer.length > 0 && <Section title="Academic Service & Reviewing" keepTogether>
        {config.reviewer.map((item, i) => <div className="cv-compact-entry" key={i}><div><CvInline text={item.venue} /></div><span className="cv-date">{item.years}</span></div>)}
      </Section>}
      {visible('teachingExperience') && <Experiences title="Teaching Experience" items={config.teachingExperience} />}
      {visible('extracurricular') && <Experiences title="Extracurricular Activities" items={config.extracurricular} />}
      {visible('theses') && !!config.theses?.length && <Section title="Thesis">
        {config.theses.map((item, i) => <div className="cv-entry" key={i}><h3>{item.title}</h3><p className="cv-authors"><CvInline text={item.authors} /></p><p className="cv-venue">{item.institution}, {item.year}</p></div>)}
      </Section>}
      {config.customSections?.filter(section => section.visible).map(section => <Section key={section.id} title={section.title}>
        {section.items.map((item, i) => <div className="cv-compact-entry" key={i}><div><CvInline text={item.text} /></div>{item.detail && <span className="cv-date"><CvInline text={item.detail} /></span>}</div>)}
      </Section>)}
    </article>
  </CvReferenceProvider>;
}
