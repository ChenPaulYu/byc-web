import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'normal' | 'critical';
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose, mode }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl h-[600px] rounded-lg shadow-2xl flex flex-col ${
        isCritical ? 'bg-red-950 border-2 border-red-500' : 'bg-white border border-neutral-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isCritical ? 'border-red-800' : 'border-neutral-200'
        }`}>
          <div>
            <h2 className={`text-lg font-bold ${isCritical ? 'text-red-100' : 'text-neutral-900'}`}>
              {isCritical ? '🔴 CRITICAL MODE' : '💬 Chat with Bo-Yu'}
            </h2>
            <p className={`text-sm ${isCritical ? 'text-red-300' : 'text-neutral-500'}`}>
              {isCritical ? 'Unfiltered insights mode' : 'Ask me about my work'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isCritical
                ? 'hover:bg-red-800 text-red-200'
                : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isCritical ? 'bg-red-950' : 'bg-neutral-50'
        }`}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className={`text-lg mb-4 ${isCritical ? 'text-red-200' : 'text-neutral-600'}`}>
                  {isCritical
                    ? '👁️ You found the hidden mode.'
                    : '👋 Hi! Ask me anything.'}
                </p>
                <div className="space-y-2">
                  {isCritical ? (
                    <>
                      <button
                        onClick={() => setInput("What do you really think about GANs for music?")}
                        className="block w-full px-4 py-2 text-sm bg-red-900 text-red-100 rounded hover:bg-red-800 transition"
                      >
                        What do you really think about GANs?
                      </button>
                      <button
                        onClick={() => setInput("What's the hardest part of your research?")}
                        className="block w-full px-4 py-2 text-sm bg-red-900 text-red-100 rounded hover:bg-red-800 transition"
                      >
                        What's the hardest part of your research?
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setInput("Tell me about FlueBricks")}
                        className="block w-full px-4 py-2 text-sm bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition"
                      >
                        Tell me about FlueBricks
                      </button>
                      <button
                        onClick={() => setInput("What's your research focus?")}
                        className="block w-full px-4 py-2 text-sm bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition"
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
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? isCritical
                      ? 'bg-red-800 text-red-50'
                      : 'bg-blue-600 text-white'
                    : isCritical
                    ? 'bg-red-900 text-red-100 border border-red-700'
                    : 'bg-white text-neutral-900 border border-neutral-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                isCritical
                  ? 'bg-red-900 text-red-100 border border-red-700'
                  : 'bg-white text-neutral-900 border border-neutral-200'
              }`}>
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                  <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${isCritical ? 'border-red-800 bg-red-950' : 'border-neutral-200 bg-white'}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isCritical ? "Ask me anything (no filters)..." : "Ask me about my work..."}
              className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                isCritical
                  ? 'bg-red-900 border-red-700 text-red-100 placeholder-red-400 focus:ring-red-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-blue-500'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isCritical
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Send
            </button>
          </div>
          <p className={`text-xs mt-2 ${isCritical ? 'text-red-400' : 'text-neutral-500'}`}>
            {isCritical
              ? '⚠️ Critical mode: Unfiltered responses. No PR speak.'
              : 'Note: This is a demo chatbot. Real responses coming soon!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal;
