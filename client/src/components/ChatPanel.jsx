import { useEffect, useRef, useState } from 'react';
import { streamChat, fetchChatHistory, clearChatHistory } from '../utils/api.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';

function ChatPanel({ repoId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  // Load persisted chat history on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchChatHistory(repoId);
        if (!cancelled && data.messages) setMessages(data.messages);
      } catch {
        // Non-critical — just start fresh
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => { cancelled = true; };
  }, [repoId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput('');
    setError(null);

    // Optimistically add the user message
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    // Add a placeholder assistant message that will be streamed into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
    setStreaming(true);

    abortRef.current = streamChat(repoId, text, {
      onDelta: (delta) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + delta };
          }
          return updated;
        });
      },
      onDone: () => {
        setStreaming(false);
        abortRef.current = null;
      },
      onError: (msg) => {
        setError(msg);
        setStreaming(false);
        // Remove the empty assistant placeholder on error
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.content === '') return prev.slice(0, -1);
          return prev;
        });
        abortRef.current = null;
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClear = async () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setError(null);
    try {
      await clearChatHistory(repoId);
    } catch {
      // Best-effort
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Chat with codebase</h2>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-rose-500/50 hover:text-rose-300"
          >
            Clear history
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner /> Loading history…
          </div>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-2 rounded-2xl bg-rose-500/10 px-4 py-2 text-sm text-rose-300 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800 px-6 py-4">
        <div className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your code… (Enter to send, Shift+Enter for newline)"
            rows={2}
            disabled={streaming}
            className="flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50 placeholder:text-slate-600"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="self-end rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {streaming ? <Spinner /> : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/20'
            : 'bg-slate-800/80 text-slate-100 border border-slate-700/50'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-6">{message.content}</p>
        ) : message.content === '' ? (
          <span className="flex items-center gap-1 text-slate-500">
            <Spinner /> Thinking…
          </span>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    'What does this codebase do?',
    'Explain the authentication flow',
    'What are the main API endpoints?',
    'How is data structured in the database?',
  ];
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">💬</div>
      <p className="text-slate-300 font-medium">Ask anything about your code</p>
      <p className="mt-2 text-sm text-slate-500 mb-6">The AI has read your files and is ready to help.</p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <span key={s} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-400">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="inline-block h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default ChatPanel;
