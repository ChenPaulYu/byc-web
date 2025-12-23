import React, { useState } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: 'normal' | 'critical';
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onToggle, mode }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const isCritical = mode === 'critical';

  // Collapsed state - minimal button
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={onToggle}
          className={`group relative px-4 py-3 rounded border-2 transition-all ${
            isCritical
              ? 'bg-red-950 border-red-800 hover:border-red-700 text-red-200'
              : 'bg-white border-neutral-300 hover:border-neutral-900 text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-current" />
            <span className="text-sm font-medium">
              {isCritical ? 'Critical' : 'Chat'}
            </span>
          </div>

          {/* Badge indicator for critical mode */}
          {isCritical && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
            </span>
          )}
        </button>
      </div>
    );
  }

  // Expanded state - chat panel
  return (
    <div className="fixed bottom-6 left-6 z-50 w-96 h-[600px] flex flex-col">
      <div className={`h-full rounded border-2 flex flex-col overflow-hidden ${
        isCritical ? 'bg-red-950 border-red-800' : 'bg-white border-neutral-300'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isCritical ? 'border-red-800' : 'border-neutral-200'
        }`}>
          <div>
            <h2 className={`text-base font-semibold ${isCritical ? 'text-red-100' : 'text-neutral-900'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {isCritical ? 'Critical Mode' : 'Chat'}
            </h2>
            <p className={`text-xs ${isCritical ? 'text-red-400' : 'text-neutral-500'}`}>
              {isCritical ? 'Unfiltered responses' : 'Ask me anything'}
            </p>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded transition-colors ${
              isCritical
                ? 'hover:bg-red-900 text-red-300'
                : 'hover:bg-neutral-100 text-neutral-500'
            }`}
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          isCritical ? 'bg-red-950' : 'bg-white'
        }`}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xs">
                <p className={`text-sm mb-4 ${isCritical ? 'text-red-200' : 'text-neutral-600'}`}>
                  {isCritical
                    ? 'You unlocked the unfiltered mode.'
                    : 'Ask me about my work.'}
                </p>
                <div className="space-y-2">
                  {isCritical ? (
                    <>
                      <button
                        onClick={() => setInput("What do you really think about GANs for music?")}
                        className="block w-full px-3 py-2 text-xs border border-red-800 bg-red-900 text-red-100 hover:bg-red-800 text-left transition"
                      >
                        What do you really think about GANs?
                      </button>
                      <button
                        onClick={() => setInput("What's the hardest part of your research?")}
                        className="block w-full px-3 py-2 text-xs border border-red-800 bg-red-900 text-red-100 hover:bg-red-800 text-left transition"
                      >
                        What's the hardest part of your research?
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setInput("Tell me about FlueBricks")}
                        className="block w-full px-3 py-2 text-xs border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 text-left transition"
                      >
                        Tell me about FlueBricks
                      </button>
                      <button
                        onClick={() => setInput("What's your research focus?")}
                        className="block w-full px-3 py-2 text-xs border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 text-left transition"
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
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 text-sm ${
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
            <div className="flex justify-start">
              <div className={`px-3 py-2 text-sm ${
                isCritical
                  ? 'bg-red-900/50 text-red-100 border border-red-800'
                  : 'bg-neutral-100 text-neutral-900 border border-neutral-200'
              }`}>
                <div className="flex gap-1 text-xs">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className={`p-3 border-t ${isCritical ? 'border-red-800 bg-red-950' : 'border-neutral-200 bg-white'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isCritical ? "Ask anything..." : "Type a message..."}
              className={`flex-1 px-3 py-2 text-sm border focus:outline-none focus:ring-1 ${
                isCritical
                  ? 'bg-red-900 border-red-800 text-red-100 placeholder-red-400 focus:ring-red-600 focus:border-red-600'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-neutral-900 focus:border-neutral-900'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`px-4 py-2 text-sm font-medium border transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isCritical
                  ? 'bg-red-900 border-red-800 text-red-100 hover:bg-red-800'
                  : 'bg-neutral-900 border-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              Send
            </button>
          </div>
          <p className={`text-[11px] mt-2 ${isCritical ? 'text-red-400' : 'text-neutral-500'}`}>
            {isCritical
              ? 'Critical mode: Unfiltered responses'
              : 'Demo chatbot - Real responses coming soon'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
