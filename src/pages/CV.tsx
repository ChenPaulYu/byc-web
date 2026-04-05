import React, { useEffect, useState } from 'react';
import { usePageTitle } from '../utils/usePageTitle';
import LanguageToggle from '../components/LanguageToggle';
import { hasChineseCv } from '../utils/contentLoader';

interface Education {
  school: string;
  degree: string;
  duration: string;
  location: string;
}

interface Experience {
  company: string;
  role: string;
  duration: string;
  location: string;
  description: string[];
}

interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: string;
  acceptanceRate?: string;
  pdf?: string;
}

interface Thesis {
  title: string;
  authors: string;
  institution: string;
  year: string;
}

interface Award {
  title: string;
  venue: string;
  year: string;
  detail?: string;
}

interface ReviewerEntry {
  venue: string;
  years: string;
}

interface CustomSectionItem {
  text: string;
  detail?: string;
}

interface CustomSection {
  id: string;
  title: string;
  visible: boolean;
  items: CustomSectionItem[];
}

interface CvConfig {
  header: { name: string; tagline: string };
  education: Education[];
  workExperience: Experience[];
  researchExperience: Experience[];
  teachingExperience: Experience[];
  publications: Publication[];
  theses: Thesis[];
  awards: Award[];
  reviewer: ReviewerEntry[];
  visibility: Record<string, boolean>;
  customSections: CustomSection[];
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm print:text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6 print:mb-3 mt-12 print:mt-6 border-b border-neutral-100 pb-2 print:pb-1">
    {children}
  </h2>
);

const TwoColHeader: React.FC<{ left: React.ReactNode; right: React.ReactNode }> = ({
  left,
  right,
}) => (
  <div className="flex justify-between items-baseline mb-1 gap-4">
    <div className="min-w-0">{left}</div>
    <div className="shrink-0">{right}</div>
  </div>
);

const ExperienceSection: React.FC<{ title: string; items: Experience[] }> = ({ title, items }) => (
  <section>
    <SectionTitle>{title}</SectionTitle>
    <div className="space-y-10 print:space-y-6">
      {items.map((exp, idx) => (
        <div key={idx} className="break-inside-avoid">
          <TwoColHeader
            left={<h3 className="font-semibold text-neutral-900">{exp.company}</h3>}
            right={<span className="text-sm text-neutral-400 tabular-nums">{exp.duration}</span>}
          />
          <p className="text-neutral-700 font-medium mb-3 print:mb-2">{exp.role} <span className="text-neutral-400 font-normal">| {exp.location}</span></p>
          <ul className="list-disc list-outside ml-4 space-y-1 text-neutral-600 text-sm leading-relaxed print:leading-snug">
            {exp.description.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

const CV: React.FC = () => {
  usePageTitle('CV');
  const [config, setConfig] = useState<CvConfig | null>(null);
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [hasZh, setHasZh] = useState(false);

  useEffect(() => {
    hasChineseCv().then(setHasZh);
  }, []);

  useEffect(() => {
    const configUrl = lang === 'zh' ? '/cv.config.zh.json' : '/cv.config.json';
    fetch(configUrl)
      .then(r => r.json())
      .then(setConfig)
      .catch(err => {
        console.error('Failed to load CV config:', err);
        if (lang === 'zh') {
          // Fallback to English
          fetch('/cv.config.json')
            .then(r => r.json())
            .then(setConfig)
            .catch(e => console.error('Failed to load fallback CV config:', e));
        }
      });
  }, [lang]);

  if (!config) return <div className="max-w-3xl mx-auto px-6 py-20 text-neutral-400">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 print:px-0 pb-20 print:pb-0">
      <div className="flex justify-between items-end mb-12 print:mb-6">
        <div>
          <h1 className="text-4xl print:text-3xl font-bold mb-2">{config.header.name}</h1>
          <p className="text-neutral-500 print:text-sm">{config.header.tagline}</p>
        </div>
        <div className="print:hidden">
          <LanguageToggle lang={lang} hasZh={hasZh} onChange={setLang} />
        </div>
      </div>

      {config.visibility?.education !== false && (
        <section>
          <SectionTitle>Education</SectionTitle>
          <div className="space-y-8 print:space-y-5">
            {config.education.map((edu, idx) => (
              <div key={idx} className="break-inside-avoid">
                <TwoColHeader
                  left={<h3 className="font-semibold text-neutral-900">{edu.school}</h3>}
                  right={<span className="text-sm text-neutral-400 tabular-nums">{edu.duration}</span>}
                />
                <p className="text-neutral-600">{edu.degree}</p>
                <p className="text-sm text-neutral-500">{edu.location}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.visibility?.workExperience !== false && (
        <ExperienceSection title="Work Experience" items={config.workExperience} />
      )}
      {config.visibility?.researchExperience !== false && (
        <ExperienceSection title="Research Experience" items={config.researchExperience} />
      )}
      {config.visibility?.teachingExperience !== false && (
        <ExperienceSection title="Teaching" items={config.teachingExperience} />
      )}

      {config.visibility?.theses !== false && (
        <section>
          <SectionTitle>Thesis</SectionTitle>
          <div className="space-y-6 print:space-y-4">
            {config.theses.map((thesis, idx) => (
              <div key={idx} className="break-inside-avoid">
                <h3 className="font-medium text-neutral-900 leading-snug mb-1">{thesis.title}</h3>
                <p className="text-sm text-neutral-600 mb-1" dangerouslySetInnerHTML={{ __html: thesis.authors }} />
                <div className="text-xs text-neutral-400 font-mono">
                  {thesis.institution}, {thesis.year}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.visibility?.publications !== false && (
        <section>
          <SectionTitle>Publications</SectionTitle>
          <div className="space-y-6 print:space-y-4">
            {config.publications.map((pub, idx) => (
              <div key={idx} className="break-inside-avoid">
                <h3 className="font-medium text-neutral-900 leading-snug mb-1">{pub.title}</h3>
                <p className="text-sm text-neutral-600 mb-1" dangerouslySetInnerHTML={{ __html: pub.authors }} />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400 font-mono">
                  <span>{pub.venue}, {pub.year}</span>
                  {pub.acceptanceRate && (
                    <span className="border border-neutral-200 bg-neutral-50 text-neutral-500 rounded px-2 py-0.5 tabular-nums">
                      Acceptance rate: {pub.acceptanceRate}
                    </span>
                  )}
                  {pub.pdf && (
                    <a
                      href={pub.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="print:hidden border border-neutral-200 bg-neutral-50 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded px-2 py-0.5 transition-colors"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.visibility?.awards !== false && (
        <section>
          <SectionTitle>Awards</SectionTitle>
          <div className="space-y-4">
            {config.awards.map((award, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-neutral-900">{award.title}</span>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-600">{award.venue} {award.year}</span>
                {award.detail && (
                  <span className="border border-neutral-200 bg-neutral-50 text-neutral-500 rounded px-2 py-0.5 text-xs font-mono">
                    {award.detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {config.visibility?.reviewer !== false && (
        <section>
          <SectionTitle>Reviewer</SectionTitle>
          <div className="space-y-2 text-sm text-neutral-700">
            {config.reviewer.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-medium text-neutral-900">{item.venue}</span>
                <span className="text-neutral-400">|</span>
                <span className="text-neutral-600 tabular-nums">{item.years}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {config.customSections?.filter(s => s.visible !== false).map((section) => (
        <section key={section.id}>
          <SectionTitle>{section.title}</SectionTitle>
          <div className="space-y-3">
            {section.items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-neutral-900">{item.text}</span>
                {item.detail && (
                  <>
                    <span className="text-neutral-400">|</span>
                    <span className="text-neutral-600">{item.detail}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-16 print:hidden flex justify-center">
        <a
          href="/cv.pdf"
          className="text-xs font-mono border border-neutral-200 px-4 py-2 rounded hover:bg-neutral-50 transition-colors text-neutral-500"
          download
        >
          Download PDF
        </a>
      </div>
    </div>
  );
};

export default CV;
