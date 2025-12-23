import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadProject, ProjectContent } from '../utils/contentLoader';
import MarkdownRenderer from '../components/MarkdownRenderer';

const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<ProjectContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await loadProject(slug);
        setProject(data);
      } catch (err) {
        setError('Project not found');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-neutral-500 mb-4">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-blue-600 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <header className="max-w-[720px] mx-auto px-6 pt-12 pb-6">
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 mb-8 transition-colors"
        >
          <span className="mr-2">←</span> Back to Projects
        </Link>

        <h1 className="text-4xl font-bold mb-4 font-['Space_Grotesk']">
          {project.metadata.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-600 mb-4">
          <span className="font-medium">{project.metadata.category}</span>
          <span>•</span>
          <span>{project.metadata.year}</span>
          <span>•</span>
          <span>{project.metadata.role}</span>
        </div>

        {/* Tags */}
        {project.metadata.tags && project.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        {project.metadata.links && project.metadata.links.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {project.metadata.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm rounded-md hover:bg-neutral-700 transition-colors"
              >
                {link.icon === 'paper' && '📄'}
                {link.icon === 'code' && '💻'}
                {link.icon === 'demo' && '🎮'}
                {link.icon === 'video' && '🎥'}
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Cover Image */}
      {project.metadata.cover && (
        <div className="max-w-[920px] mx-auto px-6 mb-8">
          <img
            src={project.metadata.cover}
            alt={project.metadata.title}
            className="w-full rounded-lg shadow-md"
          />
        </div>
      )}

      {/* Markdown Content */}
      <MarkdownRenderer content={project.content} />

      {/* Footer Navigation */}
      <footer className="max-w-[720px] mx-auto px-6 pt-12 pb-16 border-t border-neutral-200 mt-16">
        <Link
          to="/projects"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <span className="mr-2">←</span> Back to all projects
        </Link>
      </footer>
    </div>
  );
};

export default ProjectDetail;
