import React from 'react';
import { NavLink } from 'react-router-dom';

const sections = [
  {
    label: 'Content',
    items: [
      { to: '/blog', label: 'Blog', icon: '📝' },
      { to: '/projects', label: 'Projects', icon: '📁' },
      { to: '/news', label: 'News', icon: '📢' },
      { to: '/about', label: 'About', icon: '👤' },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/settings', label: 'Settings', icon: '⚙️' },
      { to: '/images', label: 'Images', icon: '🖼️' },
    ],
  },
  {
    label: 'Home Page',
    items: [
      { to: '/mpc', label: 'MPC Assets', icon: '🎹' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-4 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-neutral-900 text-white font-medium'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`;

  return (
    <aside className="w-56 h-screen fixed left-0 top-0 bg-neutral-50 border-r border-neutral-200 flex flex-col">
      <div className="px-5 py-5 border-b border-neutral-200">
        <h1 className="text-sm font-bold tracking-tight text-neutral-900">BYC Admin</h1>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-4 mb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-neutral-200">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          View site →
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
