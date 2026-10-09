import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Minimize2,
  Maximize2,
  HelpCircle,
} from "lucide-react";
import { api, type ChatMessage, type ChatSource, type Project } from "../services/api";

interface ExtendedMessage extends ChatMessage {
  sources?: ChatSource[];
  timestamp?: string;
}

interface ResearchCopilotChatProps {
  project: Project | null;
  paperCount: number;
}

/**
 * Clean markdown-like renderer that parses **bold**, `code`, *italic*,
 * headings (###), horizontal rules (---), and bullet points into styled elements
 * without displaying raw markdown symbols like double asterisks.
 */
const FormattedChatContent: React.FC<{ content: string; isUser: boolean }> = ({
  content,
  isUser,
}) => {
  if (isUser) {
    return <span>{content}</span>;
  }

  const renderInline = (text: string) => {
    const parts: React.ReactNode[] = [];
    // Match **bold**, `code`, and *italic*
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={keyIdx++} className="font-semibold text-slate-900 dark:text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 font-mono text-[11px] text-blue-700 dark:text-blue-300 font-semibold"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-700 dark:text-slate-200">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = (idx: number) => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      elements.push(
        <ul key={`ul-${idx}`} className="space-y-1 my-1.5 pl-4 list-disc marker:text-blue-500">
          {currentList.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${idx}`} className="space-y-1 my-1.5 pl-4 list-decimal marker:text-blue-500">
          {currentList.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList(idx);
      elements.push(<hr key={idx} className="my-2 border-slate-200 dark:border-slate-700" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList(idx);
      elements.push(
        <h4 key={idx} className="font-bold text-xs text-slate-900 dark:text-white mt-2.5 mb-1 tracking-tight">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList(idx);
      elements.push(
        <h3 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1 tracking-tight">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList(idx);
      elements.push(
        <h2 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-3 mb-1 tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      return;
    }

    // Unordered List Items: * item or - item
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!currentList || currentList.type !== "ul") {
        flushList(idx);
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(trimmed.slice(2));
      return;
    }

    // Ordered List Items: 1. item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!currentList || currentList.type !== "ol") {
        flushList(idx);
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numMatch[2]);
      return;
    }

    // Blockquote: > item
    if (trimmed.startsWith("> ")) {
      flushList(idx);
      elements.push(
        <blockquote
          key={idx}
          className="border-l-2 border-blue-500 dark:border-blue-400 pl-3 italic my-1.5 text-slate-600 dark:text-slate-300"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Empty line separator
    if (!trimmed) {
      flushList(idx);
      elements.push(<div key={idx} className="h-1.5" />);
      return;
    }

    // Normal paragraph
    flushList(idx);
    elements.push(
      <p key={idx} className="leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className="space-y-1">{elements}</div>;
};

export const ResearchCopilotChat: React.FC<ResearchCopilotChatProps> = ({
  project,
  paperCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<string | null>(null);

  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your research assistant. Ask me anything about your uploaded papers, key findings, methodologies, or hypotheses.",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // Reset or initialize context message when project switches
  useEffect(() => {
    if (project) {
      setMessages([
        {
          role: "assistant",
          content: `I'm ready! How can I help with **${project.title}** today? You can ask about paper findings, compare studies, or plan experiments.`,
          timestamp: "Just now",
        },
      ]);
    }
  }, [project?.id]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    if (!project) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please select an active research project first so I know which papers to look at.",
          timestamp: "Now",
        },
      ]);
      return;
    }

    const userMsg: ExtendedMessage = {
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyPayload: ChatMessage[] = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.chatWithCopilot(project.id, textToSend.trim(), historyPayload);

      const assistantMsg: ExtendedMessage = {
        role: "assistant",
        content: response.reply,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err.message || "Something went wrong while reviewing the papers. Please try again."}`,
          timestamp: "Now",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (project) {
      setMessages([
        {
          role: "assistant",
          content: `Conversation cleared. I'm ready for your questions on **${project.title}**!`,
          timestamp: "Just now",
        },
      ]);
    }
  };

  const samplePrompts = [
    "Summarize the key findings across all uploaded papers",
    "What are the main methodologies used?",
    "Are there any conflicting findings or research gaps?",
    "Suggest an experiment to test our hypothesis",
  ];

  return (
    <>
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-blue-400/30"
          title="Open Research Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5 pr-0.5">
            Research Assistant
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-full sm:w-[440px] transition-all duration-200 flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl overflow-hidden ${
            isMinimized ? "h-14" : "h-[590px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                    Research Assistant
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {project ? `${project.title} (${paperCount} papers)` : "Select a research investigation"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-slate-400">
              <button
                onClick={clearChat}
                className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title="Clear Conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body when not minimized */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60"
                      }`}
                    >
                      {/* Render formatted content without raw double asterisks */}
                      <FormattedChatContent
                        content={m.content}
                        isUser={m.role === "user"}
                      />

                      {/* References from papers */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            References from your papers ({m.sources.length}):
                          </span>

                          <div className="space-y-1.5">
                            {m.sources.map((src, sIdx) => {
                              const sourceKey = `${idx}-${sIdx}`;
                              const isExpanded = expandedSourceIndex === sourceKey;
                              return (
                                <div
                                  key={sIdx}
                                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 text-[11px]"
                                >
                                  <div
                                    onClick={() =>
                                      setExpandedSourceIndex(isExpanded ? null : sourceKey)
                                    }
                                    className="flex items-center justify-between cursor-pointer font-medium text-slate-700 dark:text-slate-300 gap-2 hover:text-blue-600 transition-colors"
                                  >
                                    <span className="truncate max-w-[240px]">
                                      📄 {src.paper_title} (p. {src.page || 1})
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3 shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 shrink-0" />
                                    )}
                                  </div>

                                  {isExpanded && (
                                    <p className="mt-1.5 text-[10px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 leading-normal">
                                      &ldquo;{src.excerpt}&rdquo;
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <span
                        className={`text-[9px] block text-right mt-1.5 ${
                          m.role === "user" ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>

                    {m.role === "user" && (
                      <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Friendly typing indicator with rotating bot icon */}
                {isLoading && (
                  <div className="flex gap-2.5 justify-start items-center text-slate-500 dark:text-slate-400 text-xs">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thinking</span>
                      <span className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions when short */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    Quick Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {samplePrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSend(prompt)}
                        className="text-left px-2.5 py-1 rounded-lg text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      project
                        ? "Ask about methods, findings, hypotheses..."
                        : "Select an investigation first..."
                    }
                    disabled={!project || isLoading}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputMessage.trim() || isLoading || !project}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white shadow-sm transition-all shrink-0"
                    title="Send Message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
