import React from 'react';
import { NavLink } from 'react-router-dom';

const NavBar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
      isActive ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-transparent print:hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2 shrink-0 hover:opacity-70 transition-opacity">
          <img src="/favicon.svg" alt="BYC" className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="hidden sm:inline text-base font-bold tracking-tight text-black">Bo-Yu Chen</span>
          <span className="sm:hidden text-sm font-bold tracking-tight text-black">BYC</span>
        </NavLink>

        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto">
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/blog" className={linkClass}>Blog</NavLink>
          <NavLink to="/cv" className={linkClass}>CV</NavLink>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
