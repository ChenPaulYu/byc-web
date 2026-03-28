import React from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import { GitHubIcon, ScholarIcon, MailIcon, TwitterIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {!isHome && <NavBar />}

      <main className={`flex-grow ${!isHome ? 'pt-24 pb-16 print:pt-0 print:pb-0' : ''}`}>
        <div key={location.pathname} className="page-transition">
          {children}
        </div>
      </main>

      {!isHome && (
        <footer className="py-8 text-center text-xs text-neutral-400 print:hidden">
          <div className="flex items-center justify-center gap-4 mb-3">
            <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-neutral-300 hover:text-neutral-600 transition-colors" title="Email">
              <MailIcon size={16} />
            </a>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-neutral-600 transition-colors" title="GitHub">
              <GitHubIcon size={16} />
            </a>
            <a href={SOCIAL_LINKS.scholar} target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-neutral-600 transition-colors" title="Google Scholar">
              <ScholarIcon size={16} />
            </a>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noreferrer" className="text-neutral-300 hover:text-neutral-600 transition-colors" title="X (Twitter)">
              <TwitterIcon size={16} />
            </a>
          </div>
          <p>© {new Date().getFullYear()} Bo-Yu Chen. Minimal, calm, credible.</p>
        </footer>
      )}
    </div>
  );
};

export default Layout;
