import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { triggerDeploy, hasDeployHook } from '../api';

const sections = [
  {
    label: 'Content',
    items: [
      { to: '/blog', label: 'Blog', icon: '📝' },
      { to: '/projects', label: 'Projects', icon: '📁' },
      { to: '/news', label: 'News', icon: '📢' },
      { to: '/about', label: 'About', icon: '👤' },
      { to: '/cv', label: 'CV', icon: '📄' },
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

const DeployButton: React.FC = () => {
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = async () => {
    if (!window.confirm('Deploy all changes to the live site?')) return;
    setDeploying(true);
    try {
      await triggerDeploy();
      setDeployed(true);
      setTimeout(() => setDeployed(false), 3000);
    } catch (err) {
      alert(`Deploy failed: ${err}`);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <button
      onClick={handleDeploy}
      disabled={deploying}
      className={`w-full px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        deployed
          ? 'bg-green-50 text-green-700'
          : 'bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50'
      }`}
    >
      {deployed ? 'Deploy triggered!' : deploying ? 'Deploying...' : 'Deploy Site'}
    </button>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-4 py-2 rounded-md text-sm transition-colors ${
      isActive
        ? 'bg-neutral-900 text-white font-medium'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`w-56 h-screen fixed left-0 top-0 bg-neutral-50 border-r border-neutral-200 flex flex-col z-50
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        <div className="px-5 py-5 border-b border-neutral-200 flex items-center justify-between">
          <h1 className="text-sm font-bold tracking-tight text-neutral-900">BYC Admin</h1>
          <button onClick={onClose} className="md:hidden text-neutral-400 hover:text-neutral-600 text-lg">×</button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="mb-4">
              <p className="px-4 mb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                    <span className="text-sm">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-neutral-200 space-y-2">
          {hasDeployHook() && <DeployButton />}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            View site →
          </a>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
