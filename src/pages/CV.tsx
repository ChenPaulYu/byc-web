import React from 'react';
import { AWARDS, EDUCATION, PUBLICATIONS, RESEARCH_EXPERIENCE, REVIEWER, TEACHING_EXPERIENCE, THESES, WORK_EXPERIENCE } from '../constants';

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

const CV: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 print:px-0 pb-20 print:pb-0">
      <div className="flex justify-between items-end mb-12 print:mb-6">
        <div>
            <h1 className="text-4xl print:text-3xl font-bold mb-2">Bo-Yu Chen</h1>
            <p className="text-neutral-500 print:text-sm">Researcher and builder at the intersection of MIR, DSP, Instrument Making, and HCI.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <a
            href="/cv.pdf"
            className="text-xs font-mono border border-neutral-200 px-3 py-1 rounded hover:bg-neutral-50 transition-colors text-neutral-500"
            download
          >
            Download
          </a>
        </div>
      </div>

      <section>
        <SectionTitle>Education</SectionTitle>
        <div className="space-y-8 print:space-y-5">
          {EDUCATION.map((edu, idx) => (
            <div key={idx} className="break-inside-avoid">
              <TwoColHeader
                left={<h3 className="font-semibold text-neutral-900">{edu.school}</h3>}
                right={<span className="text-sm text-neutral-400 tabular-nums">{edu.duration}</span>}
              />
              <p className="text-neutral-600 italic">{edu.degree}</p>
              <p className="text-sm text-neutral-500">{edu.location}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Work Experience</SectionTitle>
        <div className="space-y-10 print:space-y-6">
          {WORK_EXPERIENCE.map((exp, idx) => (
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

      <section>
        <SectionTitle>Research Experience</SectionTitle>
        <div className="space-y-10 print:space-y-6">
          {RESEARCH_EXPERIENCE.map((exp, idx) => (
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

      <section>
        <SectionTitle>Teaching</SectionTitle>
        <div className="space-y-10 print:space-y-6">
          {TEACHING_EXPERIENCE.map((exp, idx) => (
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

      <section>
        <SectionTitle>Thesis</SectionTitle>
        <div className="space-y-6 print:space-y-4">
          {THESES.map((thesis, idx) => (
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

      <section>
        <SectionTitle>Publications</SectionTitle>
        <div className="space-y-6 print:space-y-4">
          {PUBLICATIONS.map((pub, idx) => (
            <div key={idx} className="break-inside-avoid">
              <h3 className="font-medium text-neutral-900 leading-snug mb-1">{pub.title}</h3>
              <p className="text-sm text-neutral-600 mb-1" dangerouslySetInnerHTML={{ __html: pub.authors }} />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400 font-mono">
                <span>
                  {pub.venue}, {pub.year}
                </span>
                {pub.acceptanceRate && (
                  <span className="border border-neutral-200 bg-neutral-50 text-neutral-500 rounded px-2 py-0.5 tabular-nums">
                    Acceptance rate: {pub.acceptanceRate}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Awards</SectionTitle>
        <div className="space-y-4">
          {AWARDS.map((award, idx) => (
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

      <section>
        <SectionTitle>Reviewer</SectionTitle>
        <div className="space-y-2 text-sm text-neutral-700">
          {REVIEWER.map((item, idx) => (
            <div key={idx} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-neutral-900">{item.venue}</span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-600 tabular-nums">{item.years}</span>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
};

export default CV;
