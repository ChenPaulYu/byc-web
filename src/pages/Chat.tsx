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
      <header className={`${
        isCritical ? 'bg-red-950/30' : 'bg-white'
      }`}>
        <div className="max-w-3xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className={`p-1 rounded-full transition-opacity hover:opacity-60 ${
                  isCritical ? 'text-red-300' : 'text-neutral-400'
                }`}
                title="Back to home"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className={`text-base font-normal ${
                  isCritical ? 'text-red-200' : 'text-neutral-700'
                }`}>
                  {isCritical ? 'Unfiltered' : 'Conversation'}
                </h1>
              </div>
            </div>
            {isCritical && (
              <div className="flex items-center gap-2 text-red-400 text-xs opacity-60">
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
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-8">
        {/* Input at top */}
        <div className="pt-8 pb-6">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isCritical ? "Ask anything..." : "Type a message..."}
              className={`flex-1 px-0 py-2 bg-transparent border-0 border-b focus:outline-none transition-all duration-300 ${
                isCritical
                  ? 'text-red-100 placeholder-red-400/50 border-red-900/30 focus:border-red-800'
                  : 'text-neutral-900 placeholder-neutral-400/60 border-neutral-200 focus:border-neutral-400'
              }`}
              style={{ fontSize: '15px' }}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`text-sm transition-all duration-200 disabled:opacity-30 hover:opacity-60 ${
                isCritical ? 'text-red-300' : 'text-neutral-500'
              }`}
            >
              →
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 pb-12 space-y-8 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <p className={`text-sm mb-8 ${
                  isCritical ? 'text-red-300/60' : 'text-neutral-500'
                }`}>
                  {isCritical
                    ? 'You found the unfiltered mode.'
                    : 'Start a conversation.'}
                </p>
                <div className="space-y-3">
                  {isCritical ? (
                    <>
                      <button
                        onClick={() => setInput("What do you really think about GANs for music?")}
                        className="block w-full py-3 text-sm bg-red-900/20 text-red-200 hover:bg-red-900/30 text-left transition-all duration-300"
                      >
                        What do you really think about GANs?
                      </button>
                      <button
                        onClick={() => setInput("What's the hardest part of your research?")}
                        className="block w-full py-3 text-sm bg-red-900/20 text-red-200 hover:bg-red-900/30 text-left transition-all duration-300"
                      >
                        What's the hardest part of your research?
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setInput("Tell me about FlueBricks")}
                        className="block w-full py-3 text-sm bg-neutral-50 text-neutral-600 hover:bg-neutral-100 text-left transition-all duration-300"
                      >
                        Tell me about FlueBricks
                      </button>
                      <button
                        onClick={() => setInput("What's your research focus?")}
                        className="block w-full py-3 text-sm bg-neutral-50 text-neutral-600 hover:bg-neutral-100 text-left transition-all duration-300"
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
              className={`animate-fade-in-up ${msg.role === 'user' ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div
                className={`py-2 ${
                  msg.role === 'user'
                    ? isCritical
                      ? 'text-red-100/90'
                      : 'text-neutral-700'
                    : isCritical
                    ? 'text-red-200/80'
                    : 'text-neutral-600'
                }`}
                style={{ lineHeight: '1.7', fontSize: '15px' }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto max-w-[80%] animate-fade-in-up">
              <div className={`py-2 text-sm ${
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
