import React from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar';

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
          <p>© {new Date().getFullYear()} Bo-Yu Chen. Minimal, calm, credible.</p>
        </footer>
      )}
    </div>
  );
};

export default Layout;
