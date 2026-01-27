import React from 'react';
import { AWARDS, EDUCATION, PUBLICATIONS, RESEARCH_EXPERIENCE, REVIEWER, TEACHING_EXPERIENCE, THESES, WORK_EXPERIENCE } from '../constants';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6 mt-12 border-b border-neutral-100 pb-2">
    {children}
  </h2>
);

const CV: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 pb-20">
      <div className="flex justify-between items-end mb-12">
        <div>
            <h1 className="text-4xl font-bold mb-2">Bo-Yu Chen</h1>
            <p className="text-neutral-500">Researcher and builder at the intersection of MIR, DSP, Instrument Making, and HCI.</p>
        </div>
        <button 
            className="text-xs font-mono border border-neutral-200 px-3 py-1 rounded hover:bg-neutral-50 transition-colors text-neutral-500"
            onClick={() => window.print()}
        >
            Print PDF
        </button>
      </div>

      <section>
        <SectionTitle>Education</SectionTitle>
        <div className="space-y-8">
          {EDUCATION.map((edu, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-neutral-900">{edu.school}</h3>
                <span className="text-sm text-neutral-400 tabular-nums">{edu.duration}</span>
              </div>
              <p className="text-neutral-600 italic">{edu.degree}</p>
              <p className="text-sm text-neutral-500">{edu.location}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Work Experience</SectionTitle>
        <div className="space-y-10">
          {WORK_EXPERIENCE.map((exp, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-neutral-900">{exp.company}</h3>
                <span className="text-sm text-neutral-400 tabular-nums">{exp.duration}</span>
              </div>
              <p className="text-neutral-700 font-medium mb-3">{exp.role} <span className="text-neutral-400 font-normal">| {exp.location}</span></p>
              <ul className="list-disc list-outside ml-4 space-y-1 text-neutral-600 text-sm leading-relaxed">
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
        <div className="space-y-10">
          {RESEARCH_EXPERIENCE.map((exp, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-neutral-900">{exp.company}</h3>
                <span className="text-sm text-neutral-400 tabular-nums">{exp.duration}</span>
              </div>
              <p className="text-neutral-700 font-medium mb-3">{exp.role} <span className="text-neutral-400 font-normal">| {exp.location}</span></p>
              <ul className="list-disc list-outside ml-4 space-y-1 text-neutral-600 text-sm leading-relaxed">
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
        <div className="space-y-10">
          {TEACHING_EXPERIENCE.map((exp, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-semibold text-neutral-900">{exp.company}</h3>
                <span className="text-sm text-neutral-400 tabular-nums">{exp.duration}</span>
              </div>
              <p className="text-neutral-700 font-medium mb-3">{exp.role} <span className="text-neutral-400 font-normal">| {exp.location}</span></p>
              <ul className="list-disc list-outside ml-4 space-y-1 text-neutral-600 text-sm leading-relaxed">
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
        <div className="space-y-6">
          {THESES.map((thesis, idx) => (
            <div key={idx}>
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
        <div className="space-y-6">
          {PUBLICATIONS.map((pub, idx) => (
            <div key={idx}>
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
              <span className="text-neutral-600 tabular-nums">{item.years.join(', ')}</span>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
};

export default CV;
