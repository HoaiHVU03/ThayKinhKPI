// frontend/src/components/ChatbotWidget.tsx
// Hỗ trợ tra cứu thông tin hệ thống THPT Chuyên Hùng Vương
// Thiết kế Basic, Sang Trọng, Chuẩn mực Sư phạm

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  MessageSquare,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Building2,
  Clock,
  Award,
  FileText,
  ShieldCheck,
  HelpCircle,
  Search,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  keyIndex?: number | null;
  timestamp: string;
}

const SUGGESTIONS = [
  {
    icon: Building2,
    label: 'Sơ đồ 120 phòng KTX & sĩ số',
    prompt: 'KTX có bao nhiêu phòng và học sinh? Phân loại nội trú và ngoại trú thế nào?',
  },
  {
    icon: Award,
    label: '10 lỗi vi phạm KPI & điểm chuẩn',
    prompt: 'Quy định 10 lỗi vi phạm KPI nền nếp (L01 - L10) và thang trừ điểm là gì?',
  },
  {
    icon: Clock,
    label: '11 chế độ sinh hoạt trong ngày',
    prompt: 'Khung giờ 11 chế độ sinh hoạt trong ngày của học sinh nội trú là gì?',
  },
  {
    icon: FileText,
    label: 'Quy trình làm đơn xin phép KTX',
    prompt: 'Hướng dẫn quy trình làm đơn xin phép vắng KTX và cơ chế cảnh báo quá hạn?',
  },
  {
    icon: ShieldCheck,
    label: 'Điểm danh 22:00 & báo cáo Zalo 22:15',
    prompt: 'Quy trình điểm danh 22:00 và xuất mẫu báo cáo Zalo gửi BGH như thế nào?',
  },
];

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content:
          'Kính chào Thầy/Cô và các em học sinh!\n\n' +
          'Hệ thống hỗ trợ tra cứu nhanh các thông tin trên cổng điều hành Trường THPT Chuyên Hùng Vương:\n' +
          '• **Ký túc xá:** Sơ đồ 120 phòng, quân số nội trú / ngoại trú, tình trạng phòng ở.\n' +
          '• **Nề nếp & KPI:** 10 lỗi vi phạm chuẩn hóa (L01 - L10) và khung điểm rèn luyện.\n' +
          '• **Khung giờ sinh hoạt:** 11 chế độ sinh hoạt từ báo thức 05:30 đến tắt đèn 22:30.\n' +
          '• **Hồ sơ & Điểm danh:** Tra cứu học sinh, điểm danh ca 22:00, đơn xin nghỉ phép KTX.\n\n' +
          'Thầy/Cô và các em có thể nhập nội dung cần tra cứu bên dưới.',
        modelUsed: 'Hệ thống EduKPI',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    const historyPayload = newMessages
      .filter((m) => m.id !== userMsg.id && m.id !== 'welcome-1')
      .slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content,
      }));

    try {
      const res: any = await api.post('/chatbot/message', {
        message: text,
        history: historyPayload,
      });

      const replyContent = res?.reply || res?.data?.reply || 'Hệ thống đã ghi nhận nhưng không thể phản hồi lúc này.';
      const modelUsed = res?.model_used || res?.data?.model_used || 'Trợ lý EduKPI';
      const keyIndex = res?.key_index ?? res?.data?.key_index ?? null;

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: replyContent,
        modelUsed: modelUsed,
        keyIndex: keyIndex,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'bot-err-' + Date.now(),
        role: 'assistant',
        content:
          '⚠️ **Thông báo:** ' +
          (err.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau giây lát.'),
        modelUsed: 'Lỗi kết nối',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Làm mới lại cuộc trò chuyện hiện tại?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: 'Cuộc trò chuyện đã được làm mới. Vui lòng nhập nội dung Thầy/Cô và các em cần tra cứu.',
          modelUsed: 'Trợ lý EduKPI',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Render markdown-like simple text formatting
  const formatText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let processed = line;
      const boldParts = processed.split(/(\*\*.*?\*\*)/g);

      const renderFormattedLine = () => (
        <span>
          {boldParts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} className="italic text-slate-600">{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </span>
      );

      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-slate-900 text-xs mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-bold text-slate-900 text-sm mt-2 mb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="border-l-2 border-slate-400 pl-2.5 my-1 text-[11px] text-slate-600 bg-slate-50 py-1 rounded-r">
            {line.replace('> ', '')}
          </div>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('+ ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 ml-1">
            <span className="text-[#0e3a7c] font-black leading-none mt-1">•</span>
            <div className="flex-1">{renderFormattedLine()}</div>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="my-0.5 ml-1 flex items-start gap-1">
            <span className="font-semibold text-[#0e3a7c]">{line.match(/^\d+\./)?.[0]}</span>
            <div className="flex-1">{renderFormattedLine()}</div>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="my-0.5 leading-relaxed">{renderFormattedLine()}</p>;
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[420px] md:w-[440px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 ease-out mb-3 backdrop-blur-md ${
            isMinimized ? 'h-[52px]' : 'h-[580px] max-h-[82vh]'
          }`}
          style={{
            boxShadow: '0 12px 32px -8px rgba(14, 58, 124, 0.18), 0 0 0 1px rgba(14, 58, 124, 0.06)',
          }}
        >
          {/* Header (Basic & Sang Trọng) */}
          <div className="bg-[#0e3a7c] text-white px-4 py-3 flex items-center justify-between select-none border-b border-[#092754]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/15 shadow-2xs">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-xs sm:text-sm text-white tracking-tight">
                    Tra cứu thông tin
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Sẵn sàng
                  </span>
                </div>
                <p className="text-[10px] text-blue-100/80 font-normal">
                  Trường THPT Chuyên Hùng Vương
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={handleClearHistory}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng"
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/60 text-xs">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3 shadow-2xs relative group ${
                          isUser
                            ? 'bg-[#0e3a7c] text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                        }`}
                      >
                        {/* Content */}
                        <div className="text-[12px] leading-relaxed break-words">
                          {formatText(m.content)}
                        </div>

                        {/* Footer info & Copy button */}
                        {!isUser && (
                          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Trợ lý EduKPI • {m.timestamp}
                            </span>
                            <button
                              onClick={() => handleCopy(m.id, m.content)}
                              className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Sao chép nội dung"
                            >
                              {copiedId === m.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {isUser && (
                          <div className="mt-1 text-right text-[9px] text-blue-200">
                            {m.timestamp}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-3.5 py-2.5 w-fit shadow-2xs">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0e3a7c] animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0e3a7c] animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0e3a7c] animate-bounce [animation-delay:0.3s]"></span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">
                      Đang tra cứu dữ liệu...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Chips (Quick Prompts) */}
              {messages.length <= 3 && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                      Tra cứu nhanh:
                    </span>
                    {SUGGESTIONS.map((s, idx) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(s.prompt)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 hover:text-[#0e3a7c] border border-slate-200 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Icon className="w-3 h-3 text-[#0e3a7c]" />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-1.5">
                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:bg-white focus-within:border-[#0e3a7c] focus-within:ring-2 focus-within:ring-[#0e3a7c]/10 transition-all">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập nội dung cần tra cứu (học sinh, phòng KTX, 11 chế độ, KPI...)"
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-0 resize-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none max-h-24 p-1 leading-relaxed"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isLoading}
                    className={`p-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      inputText.trim() && !isLoading
                        ? 'bg-[#0e3a7c] hover:bg-[#0a2754] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Nhấn <strong>Enter</strong> để gửi</span>
                  <span className="text-slate-400 font-medium">THPT Chuyên Hùng Vương</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Launcher Button (Basic, Sang Trọng, Chuẩn Mực) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0e3a7c] hover:bg-[#0a2955] text-white shadow-[0_6px_20px_rgba(14,58,124,0.28)] hover:shadow-[0_8px_24px_rgba(14,58,124,0.38)] transition-all duration-200 cursor-pointer border border-white/20 hover:-translate-y-0.5 active:translate-y-0"
          title="Tra cứu thông tin nội bộ Trường THPT Chuyên Hùng Vương"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30"></span>
          <Search className="w-3.5 h-3.5 text-white/90" />
          <span className="text-xs font-medium tracking-normal text-white pr-1">
            Tra cứu thông tin
          </span>
        </button>
      )}
    </div>
  );
};

