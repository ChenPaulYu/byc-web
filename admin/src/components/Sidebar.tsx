import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/blog', label: 'Blog Posts', icon: '📝' },
  { to: '/projects', label: 'Projects', icon: '📁' },
  { to: '/about', label: 'About', icon: '👤' },
];

const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-neutral-900 text-white'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`;

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-neutral-50 border-r border-neutral-200 flex flex-col">
      <div className="px-5 py-6 border-b border-neutral-200">
        <h1 className="text-base font-bold tracking-tight text-neutral-900">BYC Admin</h1>
        <p className="text-xs text-neutral-400 mt-0.5 font-mono">Content Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-neutral-200">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          View live site →
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
