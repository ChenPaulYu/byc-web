import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EyeWidget from '../components/EyeWidget';

const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'critical' ? 'critical' : 'normal';

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'normal' | 'critical'>(initialMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If critical mode is triggered via URL, show a welcome message
    if (initialMode === 'critical' && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'You found the critical mode. Ask me anything - no filters, no PR speak.'
      }]);
    }
  }, [initialMode]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // TODO: Integrate with Claude API
    // For now, just a placeholder response
    setTimeout(() => {
      const response = mode === 'critical'
        ? `[CRITICAL MODE] This is where I'd give you my unfiltered thoughts about: "${userMessage}"`
        : `[NORMAL MODE] Here's a professional response about: "${userMessage}"`;

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEasterEgg = () => {
    setMode('critical');
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: '👁️ You unlocked critical mode. Now you get the real answers.'
      }
    ]);
  };

  const handleEyeClick = () => {
    // Normal click does nothing, just the Easter egg matters
  };

  const isCritical = mode === 'critical';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      isCritical ? 'bg-red-950' : 'bg-neutral-50'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        isCritical ? 'bg-red-950/30 border-red-900/20' : 'bg-neutral-50 border-neutral-200/50'
      }`}>
        <div className="max-w-3xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className={`p-1.5 rounded-full transition-opacity hover:opacity-60 ${
                isCritical ? 'text-red-300/60' : 'text-neutral-400'
              }`}
              title="Back to home"
            >
              <ArrowLeft size={16} />
            </Link>
            {isCritical && (
              <div className="flex items-center gap-2 text-red-400 text-xs opacity-40">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6">
        {/* Greeting - only show when no messages */}
        {messages.length === 0 && (
          <div className="pt-16 pb-12 text-center">
            <h2 className={`text-3xl mb-2 ${
              isCritical ? 'text-red-200' : 'text-neutral-800'
            }`} style={{ fontFamily: 'serif' }}>
              ≋ {getGreeting()}
            </h2>
          </div>
        )}

        {/* Input - at top if messages exist, centered if empty */}
        <div className={`${messages.length === 0 ? 'mb-auto' : 'pt-6 pb-4'}`}>
          <div className={`relative ${
            isCritical
              ? 'bg-red-900/20 border border-red-800/30'
              : 'bg-white border border-neutral-200'
          } rounded-2xl shadow-sm transition-all duration-200 focus-within:shadow-md ${
            isCritical ? 'focus-within:border-red-700' : 'focus-within:border-neutral-400'
          }`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isCritical ? "Ask me anything..." : "How can I help you today?"}
              className={`w-full px-5 py-4 bg-transparent focus:outline-none ${
                isCritical
                  ? 'text-red-100 placeholder-red-400/40'
                  : 'text-neutral-900 placeholder-neutral-400'
              }`}
              style={{ fontSize: '15px' }}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full transition-all duration-200 disabled:opacity-30 flex items-center justify-center ${
                input.trim() && !isLoading
                  ? isCritical
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  : 'bg-transparent'
              }`}
            >
              <span className="text-lg">↑</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 pb-12 space-y-6 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`animate-fade-in-up ${
                msg.role === 'user' ? 'flex justify-end' : ''
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {msg.role === 'user' ? (
                // User message: subtle beige box
                <div
                  className={`max-w-[75%] px-5 py-3 rounded-3xl ${
                    isCritical
                      ? 'bg-red-900/30 text-red-100'
                      : 'bg-neutral-200/60 text-neutral-800'
                  }`}
                  style={{ lineHeight: '1.6', fontSize: '15px' }}
                >
                  {msg.content}
                </div>
              ) : (
                // Assistant message: no box, just text (like Claude)
                <div
                  className={`max-w-full ${
                    isCritical ? 'text-red-200/90' : 'text-neutral-700'
                  }`}
                  style={{
                    lineHeight: '1.7',
                    fontSize: '15px',
                    fontFamily: 'Georgia, serif'
                  }}
                >
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="animate-fade-in-up">
              <div className={`text-sm ${
                isCritical ? 'text-red-300/40' : 'text-neutral-400'
              }`}>
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </div>
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Eye widget - only on this page */}
      <EyeWidget
        onEasterEggTrigger={handleEasterEgg}
        onNormalClick={handleEyeClick}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Chat;
