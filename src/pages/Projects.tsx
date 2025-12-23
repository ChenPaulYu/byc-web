import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import { ArrowUpRight, Github, FileText, Play } from 'lucide-react';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <Link to={`/projects/${project.id}`} className="group block mb-12">
      <div className="relative overflow-hidden bg-neutral-50 aspect-video mb-4 rounded-sm">
         {/* Placeholder for actual project images - using grayscale for calm aesthetic */}
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out grayscale hover:grayscale-0"
        />
      </div>
      
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-xl font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        <span className="text-xs font-mono text-neutral-400">{project.year}</span>
      </div>
      
      <p className="text-neutral-600 leading-relaxed mb-4 text-sm">
        {project.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-sm">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-4">
        {project.links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-400 hover:text-black transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {link.icon === 'paper' && <FileText size={14} />}
            {link.icon === 'code' && <Github size={14} />}
            {link.icon === 'demo' && <Play size={14} />}
            {link.label}
          </a>
        ))}
      </div>
    </Link>
  );
};

const Projects: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Research' | 'Engineering' | 'Creative'>('All');

  const filteredProjects = filter === 'All' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === filter);

  return (
    <div className="max-w-3xl mx-auto px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-6">Selected Projects</h1>
        
        {/* Minimal Filter */}
        <div className="flex gap-6 border-b border-neutral-100 pb-4">
          {(['All', 'Research', 'Engineering', 'Creative'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-sm transition-colors ${
                filter === cat 
                  ? 'text-black font-medium' 
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
};

export default Projects;