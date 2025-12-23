import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import WaveformWidget from './WaveformWidget';
import ChatbotModal from './ChatbotModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotMode, setChatbotMode] = useState<'normal' | 'critical'>('normal');

  const handleEasterEgg = () => {
    setChatbotMode('critical');
    setIsChatbotOpen(true);
  };

  const handleNormalClick = () => {
    setChatbotMode('normal');
    setIsChatbotOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {!isHome && <NavBar />}
      
      <main className={`flex-grow ${!isHome ? 'pt-24 pb-16' : ''}`}>
        {children}
      </main>

      {!isHome && (
        <footer className="py-8 text-center text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Bo-Yu Chen. Minimal, calm, credible.</p>
        </footer>
      )}

      {/* Waveform Easter Egg Widget - shown on all pages except home */}
      {!isHome && (
        <WaveformWidget
          onEasterEggTrigger={handleEasterEgg}
          onNormalClick={handleNormalClick}
        />
      )}

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        mode={chatbotMode}
      />
    </div>
  );
};

export default Layout;