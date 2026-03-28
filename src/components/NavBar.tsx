import React from 'react';
import { NavLink } from 'react-router-dom';

const NavBar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-transparent print:hidden">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="text-base font-bold tracking-tight text-black hover:opacity-70 transition-opacity">
          Bo-Yu Chen
        </NavLink>
        
        <div className="flex space-x-6">
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/blog" className={linkClass}>Blog</NavLink>
          <NavLink to="/cv" className={linkClass}>CV</NavLink>
          {/* Chat temporarily disabled */}
          {/* <NavLink to="/chat" className={linkClass}>Chat</NavLink> */}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
