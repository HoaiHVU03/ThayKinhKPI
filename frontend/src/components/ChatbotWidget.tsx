// frontend/src/components/ChatbotWidget.tsx
// Interactive Floating AI Chatbot Widget powered by Google Gemini (Flash 3.8 / 3.7 / 3.6)
// Provides 24/7 consultation on all contents of THPT Chuyen Hung Vuong Management & KPI System

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Bot,
  X,
  Send,
  Sparkles,
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
  ExternalLink,
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
    label: 'Sơ đồ 120 phòng KTX & nội/ngoại trú',
    prompt: 'KTX có bao nhiêu phòng và học sinh? Phân loại nội trú và ngoại trú thế nào?',
  },
  {
    icon: Award,
    label: '10 lỗi vi phạm KPI & điểm chuẩn',
    prompt: 'Quy định 10 lỗi vi phạm KPI nền nếp (L01 - L10) và thang trừ điểm là gì?',
  },
  {
    icon: Clock,
    label: '11 khung giờ chế độ sinh hoạt KTX',
    prompt: 'Khung giờ 11 chế độ sinh hoạt trong ngày của học sinh nội trú là gì?',
  },
  {
    icon: FileText,
    label: 'Quy trình làm đơn xin phép vắng KTX',
    prompt: 'Hướng dẫn quy trình làm đơn xin phép vắng KTX và cơ chế cảnh báo quá hạn?',
  },
  {
    icon: ShieldCheck,
    label: 'Quy trình điểm danh & báo cáo Zalo 22:15',
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
          'Xin chào! Tôi là **Trợ lý AI Hùng Vương** - Cố vấn thông minh được tích hợp Google Gemini Flash AI.\n\n' +
          'Tôi có thể tư vấn đầy đủ và chính xác về:\n' +
          '• **Sơ đồ 120 phòng KTX** & quân số 1.883 học sinh (702 nội trú, 1.181 ngoại trú).\n' +
          '• **10 tiêu chí KPI & kỷ luật** (L01 - L10) cùng thang điểm rèn luyện.\n' +
          '• **11 chế độ sinh hoạt hàng ngày** từ báo thức 05:30 đến tắt đèn 22:30.\n' +
          '• **Điểm danh 22:00, xuất báo cáo Zalo 22:15** & đơn xin phép vắng mặt.\n' +
          '• **Mẫu in văn bản A4 chuẩn Nghị định 30/2020**.\n\n' +
          'Bạn cần tìm hiểu hoặc hỗ trợ nội dung nào?',
        modelUsed: 'Gemini Flash 3.8',
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

    // Format conversation history for Gemini API
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

      const replyContent = res?.reply || res?.data?.reply || 'Tôi đã nhận được câu hỏi nhưng không thể phản hồi lúc này.';
      const modelUsed = res?.model_used || res?.data?.model_used || 'Gemini Flash';
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
          '⚠️ **Đã xảy ra sự cố kết nối:** ' +
          (err.message || 'Không thể gửi câu hỏi đến dịch vụ AI. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ Quản trị viên.'),
        modelUsed: 'Lỗi',
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
    if (window.confirm('Xóa toàn bộ lịch sử trò chuyện hiện tại?')) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: 'Cuộc trò chuyện đã được làm mới. Tôi sẵn sàng giải đáp mọi thắc mắc về Hệ thống THPT Chuyên Hùng Vương!',
          modelUsed: 'Gemini Flash 3.8',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Render markdown-like simple text formatting
  const formatText = (content: string) => {
    // Split lines
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering
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
        return <h4 key={idx} className="font-black text-slate-900 text-xs mt-2 mb-1">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-black text-slate-900 text-sm mt-2 mb-1">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="border-l-2 border-amber-500 pl-2 my-1 text-[11px] text-amber-900 bg-amber-50/60 py-1 rounded-r">
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
            <span className="font-bold text-[#0e3a7c]">{line.match(/^\d+\./)?.[0]}</span>
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
          className={`w-[92vw] sm:w-[420px] md:w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-300 ease-out mb-3.5 backdrop-blur-md ${
            isMinimized ? 'h-[58px]' : 'h-[620px] max-h-[85vh]'
          }`}
          style={{
            boxShadow: '0 20px 40px -15px rgba(14, 58, 124, 0.25), 0 0 0 1px rgba(14, 58, 124, 0.08)',
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0e3a7c] via-[#12499c] to-[#0a2c61] text-white p-3.5 flex items-center justify-between select-none shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0e3a7c] rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-xs sm:text-sm tracking-tight text-white">
                    Trợ lý AI Hùng Vương
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 border border-amber-300">
                    Gemini Flash
                  </span>
                </div>
                <p className="text-[10px] text-slate-200/90 font-medium">
                  Cố vấn 24/7 • KTX, KPI nề nếp, đơn phép & quy chế
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Làm mới hội thoại"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isMinimized ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-gradient-to-b from-slate-50/70 to-slate-100/40 text-xs">
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
                            <span className="flex items-center gap-1 font-mono text-[9px] text-[#0e3a7c]/70 font-semibold">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              {m.modelUsed || 'Gemini Flash'}
                              {m.keyIndex ? ` • Key #${m.keyIndex}` : ''}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span>{m.timestamp}</span>
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
                      Trợ lý AI đang tra cứu & suy luận...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Chips (Quick Prompts) */}
              {messages.length <= 3 && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
                      <HelpCircle className="w-3 h-3" /> Gợi ý:
                    </span>
                    {SUGGESTIONS.map((s, idx) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(s.prompt)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#0e3a7c] border border-slate-200/70 text-[11px] font-medium text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shrink-0"
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
                <div className="flex items-end gap-2 bg-slate-50 border border-slate-300/80 rounded-xl p-1.5 focus-within:border-[#0e3a7c] focus-within:ring-2 focus-within:ring-[#0e3a7c]/10 transition-all">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hỏi về KTX, điểm danh, KPI, đơn phép, quy chế..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-0 resize-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none max-h-24 p-1 leading-relaxed"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isLoading}
                    className={`p-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      inputText.trim() && !isLoading
                        ? 'bg-[#0e3a7c] hover:bg-[#0a2a5a] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Nhấn <strong>Enter</strong> để gửi • <strong>Shift + Enter</strong> xuống dòng</span>
                  <span className="text-[#0e3a7c] font-bold">THPT Chuyên Hùng Vương AI</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#0e3a7c] via-[#12499c] to-[#0e3a7c] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-amber-400/80 cursor-pointer"
          style={{
            boxShadow: '0 10px 25px -5px rgba(14, 58, 124, 0.4), 0 0 15px 2px rgba(245, 158, 11, 0.3)',
          }}
          title="Mở Trợ lý AI Hùng Vương"
        >
          {/* Animated pulsing ring */}
          <span className="absolute -inset-0.5 rounded-full bg-amber-400/30 animate-ping pointer-events-none"></span>

          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-amber-300">
              <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
            )}
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-tight leading-none text-white flex items-center gap-1">
              Trợ Lý AI Hùng Vương
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="text-[10px] text-slate-200 font-medium leading-none mt-0.5">
              Gemini Flash • Tư vấn 24/7
            </div>
          </div>
        </button>
      )}
    </div>
  );
};
