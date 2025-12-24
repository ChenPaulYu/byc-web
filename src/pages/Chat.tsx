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

  return (
    <div className={`min-h-screen flex flex-col ${
      isCritical ? 'bg-red-950' : 'bg-white'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        isCritical ? 'border-red-800 bg-red-950' : 'border-neutral-200 bg-white'
      }`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className={`p-2 -ml-2 rounded transition-colors ${
                  isCritical
                    ? 'hover:bg-red-900 text-red-300'
                    : 'hover:bg-neutral-100 text-neutral-500'
                }`}
                title="Back to home"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className={`text-lg font-semibold ${
                  isCritical ? 'text-red-100' : 'text-neutral-900'
                }`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {isCritical ? 'Critical Mode' : 'Chat'}
                </h1>
                <p className={`text-sm ${
                  isCritical ? 'text-red-400' : 'text-neutral-500'
                }`}>
                  {isCritical ? 'Unfiltered responses' : 'Ask me about my work'}
                </p>
              </div>
            </div>
            {isCritical && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span>Critical mode active</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6">
        {/* Input at top */}
        <div className="py-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isCritical ? "Ask anything..." : "Ask me about my work..."}
              className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${
                isCritical
                  ? 'bg-red-900 border-red-800 text-red-100 placeholder-red-400 focus:ring-red-600 focus:border-red-600'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-neutral-900 focus:border-neutral-900'
              }`}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`px-6 py-3 font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 ${
                isCritical
                  ? 'bg-red-900 border-red-800 text-red-100 hover:bg-red-800'
                  : 'bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              Send
            </button>
          </div>
          <p className={`text-xs mt-2 ${
            isCritical ? 'text-red-400' : 'text-neutral-500'
          }`}>
            {isCritical
              ? 'Critical mode: Unfiltered responses'
              : 'Demo chatbot - Real responses coming soon'}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 pb-6 space-y-6 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <p className={`text-lg mb-6 ${
                  isCritical ? 'text-red-200' : 'text-neutral-600'
                }`}>
                  {isCritical
                    ? 'You found the unfiltered mode.'
                    : 'Start a conversation.'}
                </p>
                <div className="space-y-2">
                  {isCritical ? (
                    <>
                      <button
                        onClick={() => setInput("What do you really think about GANs for music?")}
                        className="block w-full px-4 py-3 text-sm border border-red-800 rounded-lg bg-red-900 text-red-100 hover:bg-red-800 hover:scale-[1.02] text-left transition-all duration-200"
                      >
                        What do you really think about GANs?
                      </button>
                      <button
                        onClick={() => setInput("What's the hardest part of your research?")}
                        className="block w-full px-4 py-3 text-sm border border-red-800 rounded-lg bg-red-900 text-red-100 hover:bg-red-800 hover:scale-[1.02] text-left transition-all duration-200"
                      >
                        What's the hardest part of your research?
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setInput("Tell me about FlueBricks")}
                        className="block w-full px-4 py-3 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-700 hover:border-neutral-900 hover:scale-[1.02] text-left transition-all duration-200"
                      >
                        Tell me about FlueBricks
                      </button>
                      <button
                        onClick={() => setInput("What's your research focus?")}
                        className="block w-full px-4 py-3 text-sm border border-neutral-300 rounded-lg bg-white text-neutral-700 hover:border-neutral-900 hover:scale-[1.02] text-left transition-all duration-200"
                      >
                        What's your research focus?
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? isCritical
                      ? 'bg-red-900 text-red-50 border border-red-800'
                      : 'bg-neutral-900 text-white'
                    : isCritical
                    ? 'bg-red-900/50 text-red-100 border border-red-800'
                    : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                }`}
                style={{ lineHeight: '1.6' }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                isCritical
                  ? 'bg-red-900/50 text-red-100 border border-red-800'
                  : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
              }`}>
                <div className="flex gap-1 text-sm">
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
