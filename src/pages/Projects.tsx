/**
 * Public project index: Markdown-backed cards filtered by the four public groups.
 * Reads: loadAllProjects() and PROJECT_GROUPS from the content boundary.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, FileText, Play } from 'lucide-react';
import { usePageTitle } from '../utils/usePageTitle';
import { loadAllProjects } from '../utils/contentLoader';
import { PROJECT_GROUPS, type ProjectContent, type ProjectGroup } from '../types/content';

type Filter = 'All' | ProjectGroup;
type LoadState = 'loading' | 'ready' | 'error';

type ProjectCardModel = {
  slug: string;
  title: string;
  year: string;
  category: ProjectGroup;
  description: string;
  tags: string[];
  cover: string | null;
  links: Array<{ label: string; url: string; icon?: 'video' | 'paper' | 'code' | 'demo' }>;
};

const FILTERS: Filter[] = ['All', ...PROJECT_GROUPS];

const isUsableLink = (url: string | undefined): url is string => {
  const trimmed = url?.trim() ?? '';
  return trimmed.length > 0 && trimmed !== '#';
};

const toCard = (project: ProjectContent): ProjectCardModel => ({
  slug: project.slug,
  title: project.metadata.title,
  year: project.metadata.year,
  category: project.metadata.category,
  description: project.excerpt ?? '',
  tags: project.metadata.tags ?? [],
  cover: project.metadata.cover?.trim() || null,
  links: (project.metadata.links ?? []).filter((link) => isUsableLink(link.url)),
});

const LinkIcon: React.FC<{ icon?: string }> = ({ icon }) => {
  if (icon === 'paper') return <FileText size={14} />;
  if (icon === 'code') return <Github size={14} />;
  if (icon === 'demo' || icon === 'video') return <Play size={14} />;
  return null;
};

const ProjectCard: React.FC<{ project: ProjectCardModel }> = ({ project }) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.project-card-content')) {
      navigate(`/projects/${project.slug}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group block mb-12 cursor-pointer"
    >
      <div className="project-card-content">
        <div className="relative overflow-hidden bg-neutral-50 aspect-video mb-4 rounded-sm">
          {project.cover && (
            <img
              src={project.cover}
              alt={project.title}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
            />
          )}
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
          {project.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4" onClick={(e) => e.stopPropagation()}>
        {project.links.map((link, i) => (
          <a
            key={i}
            href={link.url}
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-400 hover:text-black transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkIcon icon={link.icon} />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
};

const Projects: React.FC = () => {
  usePageTitle('Projects');
  const [filter, setFilter] = useState<Filter>('All');
  const [projects, setProjects] = useState<ProjectCardModel[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await loadAllProjects();
        if (cancelled) return;
        setProjects(loaded.map(toCard));
        setLoadState('ready');
      } catch (error) {
        console.error('Failed to load projects:', error);
        if (cancelled) return;
        setLoadState('error');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = filter === 'All'
    ? projects
    : projects.filter((p) => p.category === filter);

  return (
    <div className="max-w-3xl mx-auto px-6">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-6">Selected Projects</h1>

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-100 pb-4">
          {FILTERS.map((cat) => (
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

      {loadState === 'loading' && (
        <p className="text-center text-neutral-400 text-sm py-16">Loading projects.</p>
      )}

      {loadState === 'error' && (
        <p className="text-center text-neutral-500 text-sm py-16">Could not load projects.</p>
      )}

      {loadState === 'ready' && filteredProjects.length === 0 && (
        <p className="text-center text-neutral-400 text-sm py-16">
          {projects.length === 0 ? 'No projects yet.' : 'No projects in this group yet.'}
        </p>
      )}

      {loadState === 'ready' && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
