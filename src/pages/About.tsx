import React from 'react';
import ReactMarkdown from 'react-markdown';
import { SOCIAL_LINKS } from '../constants';
import { ExternalLink, Mail } from 'lucide-react';

const About: React.FC = () => {
  // Manual "Now" section - update this whenever you want!
  const nowSection = {
    // Announcement banner (blue box with emoji)
    announcement: {
      text: "Starting PhD in Music Technology at XYZ University",
      date: "Fall 2025",
      show: true // Set to false to hide the banner
    },

    // Your current focus description (supports markdown + links)
    description: `
I'm currently focused on bridging digital fabrication and musical acoustics through **FlueBricks**, exploring how computational design can democratize instrument making.

Recent explorations include DDSP-based synthesis and web audio prototyping. Writing about [creative constraints](/blog/creative-constraints) and the intersection of AI and musical expression.

Also teaching workshops on interactive music systems and contributing to open-source audio tools.
    `.trim()
  };

  return (
    <div className="max-w-2xl mx-auto px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-4">About Me</h1>
        <div className="w-12 h-1 bg-neutral-900 mb-8"></div>
      </header>

      <section className="prose prose-neutral prose-lg text-neutral-600 leading-relaxed space-y-6">
        <p>
          I am a passionate researcher and educator innovating at the nexus of <strong className="text-black font-medium">AI Music</strong>, <strong className="text-black font-medium">Musical Acoustics</strong>, and <strong className="text-black font-medium">Human-Computer Interaction</strong>.
        </p>

        <p>
          Currently, I am pursuing my M.S. at National Taiwan University, where my research focuses on computational physicality—specifically, how we can use digital fabrication and algorithms to design novel musical instruments (like <em>FlueBricks</em>).
        </p>

        <p>
          Previously, I worked with the Creative AI Lab at Sony Group Corporation in Japan, where I developed <em>DJTransGAN</em>, the first AI model capable of generating smooth DJ-like transitions between tracks. My work bridges the gap between technical engineering (DSP, Deep Learning) and creative expression.
        </p>

        <p>
          I strive to build systems that are "quietly confident"—tools that empower musicians and novices alike without overwhelming them with complexity.
        </p>
      </section>

      {/* Now Section */}
      <section className="mt-16 pt-8 border-t border-neutral-100">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-8">Now</h2>

        {/* Announcement Banner */}
        {nowSection.announcement.show && (
          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
            <div className="flex items-start gap-3">
              <span className="text-lg">📢</span>
              <div>
                <p className="text-base text-neutral-900 font-medium">
                  {nowSection.announcement.text}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {nowSection.announcement.date}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Focus Description (Markdown) */}
        <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="text-blue-600 hover:text-blue-700 underline"
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="mb-4" />
              ),
              strong: ({ node, ...props }) => (
                <strong {...props} className="text-neutral-900 font-semibold" />
              ),
            }}
          >
            {nowSection.description}
          </ReactMarkdown>
        </div>
      </section>

      {/* Connect Section */}
      <section className="mt-12 pt-8 border-t border-neutral-100">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-6">Connect</h2>
        <div className="flex flex-col gap-3">
          <a href={`mailto:${SOCIAL_LINKS.email}`} className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <Mail size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>{SOCIAL_LINKS.email}</span>
          </a>
          <a href={SOCIAL_LINKS.scholar} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <ExternalLink size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>Google Scholar</span>
          </a>
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-800 hover:text-blue-600 transition-colors group">
            <ExternalLink size={18} className="text-neutral-400 group-hover:text-blue-600" />
            <span>GitHub</span>
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;