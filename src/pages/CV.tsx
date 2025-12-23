import React from 'react';
import { EDUCATION, EXPERIENCE, PUBLICATIONS } from '../constants';

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
            <p className="text-neutral-500">Researcher & Educator in AI Music & HCI</p>
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
        <SectionTitle>Experience</SectionTitle>
        <div className="space-y-10">
          {EXPERIENCE.map((exp, idx) => (
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
        <SectionTitle>Selected Publications</SectionTitle>
        <div className="space-y-6">
          {PUBLICATIONS.map((pub, idx) => (
            <div key={idx}>
              <h3 className="font-medium text-neutral-900 leading-snug mb-1">{pub.title}</h3>
              <p className="text-sm text-neutral-600 mb-1" dangerouslySetInnerHTML={{ __html: pub.authors }} />
              <div className="text-xs text-neutral-400 font-mono">
                {pub.venue}, {pub.year}
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section>
          <SectionTitle>Skills</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
                <h4 className="font-semibold mb-2">AI & Machine Learning</h4>
                <p className="text-neutral-600">PyTorch, GANs, DDSP, NLP, MIR, Audio Generative Models</p>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Programming</h4>
                <p className="text-neutral-600">Python, TypeScript, C++, Max/MSP, Tone.js, Three.js</p>
            </div>
            <div>
                <h4 className="font-semibold mb-2">Digital Fabrication</h4>
                <p className="text-neutral-600">Fusion 360, 3D Printing, Arduino, Acoustic Customization</p>
            </div>
          </div>
      </section>
    </div>
  );
};

export default CV;