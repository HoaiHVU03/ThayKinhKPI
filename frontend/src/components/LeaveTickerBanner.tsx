// frontend/src/components/LeaveTickerBanner.tsx
// Thanh thông báo chạy Realtime khi học sinh gửi đơn xin nghỉ KTX
// Đặt tại vị trí trung tâm Header (khu vực khoanh đỏ) trên tất cả các trang quản lý

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { LeaveRequest } from '../types';
import {
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Volume2,
  VolumeX,
  QrCode,
  Check,
  X,
  Send,
  User,
  Building2,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Phone
} from 'lucide-react';

interface TickerResponse {
  pending_count: number;
  pending: LeaveRequest[];
  recent: LeaveRequest[];
  latest_id: number;
  server_time: string;
}

export const LeaveTickerBanner: React.FC = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [latestId, setLatestId] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kpi_leave_sound') !== 'off';
  });

  // Modal quick review & approve
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);

  // Modal QR Code for Students
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  const prevLatestIdRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // Synthesize gentle double-ping chime via Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // First Ping (A5 - 880Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.22);

      // Second Ping (C#6 - 1108.7Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1108.7, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.16, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [soundEnabled]);

  const fetchTickerData = useCallback(async () => {
    try {
      const res = await api.get('/leave-requests/ticker') as TickerResponse;
      if (res) {
        setPendingRequests(res.pending || []);
        setRecentRequests(res.recent || []);
        setPendingCount(res.pending_count || 0);

        const currentNewestId = res.latest_id || 0;

        // Detect brand-new leave submission arriving in real-time
        if (!isFirstLoadRef.current && currentNewestId > prevLatestIdRef.current) {
          setIsFlashing(true);
          playNotificationSound();
          setTimeout(() => setIsFlashing(false), 3500);
        }

        prevLatestIdRef.current = currentNewestId;
        setLatestId(currentNewestId);
        isFirstLoadRef.current = false;
      }
    } catch {
      // Fail silently to avoid breaking header UI
    }
  }, [playNotificationSound]);

  // Polling every 6 seconds + broadcast channel listener
  useEffect(() => {
    fetchTickerData();
    const interval = setInterval(fetchTickerData, 6000);

    const handleCustomEvent = () => fetchTickerData();
    window.addEventListener('leave-request-updated', handleCustomEvent);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kpi_leaves_realtime');
      bc.onmessage = () => fetchTickerData();
    } catch {
      // BroadcastChannel unsupported fallback
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('leave-request-updated', handleCustomEvent);
      if (bc) bc.close();
    };
  }, [fetchTickerData]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('kpi_leave_sound', next ? 'on' : 'off');
  };

  // Quick Approve action
  const handleQuickApprove = async (id: number) => {
    setIsApproving(true);
    try {
      await api.post(`/leave-requests/${id}/approve`, {
        approval_notes: 'Duyệt nhanh từ thanh thông báo điều hành'
      });
      setSelectedLeave(null);
      fetchTickerData();
      window.dispatchEvent(new CustomEvent('leave-request-updated'));
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt');
    } finally {
      setIsApproving(false);
    }
  };

  // Quick Reject action
  const handleQuickReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    setIsRejecting(true);
    try {
      await api.post(`/leave-requests/${id}/reject`, {
        approval_notes: rejectReason
      });
      setSelectedLeave(null);
      setShowRejectInput(false);
      setRejectReason('');
      fetchTickerData();
      window.dispatchEvent(new CustomEvent('leave-request-updated'));
    } catch (err: any) {
      alert(err.message || 'Lỗi từ chối');
    } finally {
      setIsRejecting(false);
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'home': return 'Về quê';
      case 'medical': return 'Khám bệnh';
      case 'tutoring': return 'Học thêm';
      case 'personal': return 'Việc riêng';
      default: return 'Xin phép';
    }
  };

  // Format short time: "18/10 15:00"
  const formatShortTime = (dtStr: string) => {
    if (!dtStr) return '';
    try {
      const d = new Date(dtStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${mins} (${day}/${month})`;
    } catch {
      return dtStr;
    }
  };

  // Build items array to display in marquee.
  // Duplicate items to ensure smooth continuous infinite scrolling track.
  const displayItems = pendingRequests.length > 0 
    ? (pendingRequests.length === 1 
        ? [...pendingRequests, ...pendingRequests, ...pendingRequests, ...pendingRequests] 
        : [...pendingRequests, ...pendingRequests])
    : (recentRequests.length > 0 
        ? [...recentRequests, ...recentRequests] 
        : []);

  const publicPortalUrl = `${window.location.origin}/xin-phep`;

  return (
    <>
      {/* 1. Full Marquee Ticker (Only on extra large screens 2xl: >= 1536px where there is ample width) */}
      <div className={`hidden 2xl:flex flex-1 items-center mx-3 min-w-[280px] max-w-[650px] h-9 max-h-9 overflow-hidden transition-all duration-300 ${
        isFlashing ? 'ring-2 ring-red-500 rounded-full scale-[1.01]' : ''
      }`}>
        <div className="group-ticker w-full h-full flex items-center bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/90 hover:border-blue-300 rounded-full shadow-2xs hover:shadow-xs px-2 py-0.5 transition-all overflow-hidden relative">
          
          {/* Left Pill Badge */}
          {pendingCount > 0 ? (
            <button
              onClick={() => navigate('/leaves')}
              title={`${pendingCount} đơn xin phép KTX đang chờ duyệt — Nhấn để xem toàn bộ`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white text-[11px] font-black uppercase tracking-wider rounded-full shrink-0 shadow-xs cursor-pointer transition-transform active:scale-95 z-10 whitespace-nowrap"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <BellRing className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>ĐƠN MỚI</span>
              <span className="bg-white text-red-700 px-1.5 py-0.2 rounded-full font-black text-[10px] shadow-2xs">
                {pendingCount}
              </span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-full shrink-0 z-10 whitespace-nowrap"
              title="Không có đơn chờ duyệt — KTX an toàn nề nếp"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>KTX: 0 đơn chờ</span>
            </div>
          )}

          {/* Center Smooth Marquee Area */}
          <div className="flex-1 overflow-hidden ticker-mask-fade mx-2 relative min-w-0 h-full flex items-center">
            {displayItems.length > 0 ? (
              <div className="animate-ticker-marquee flex items-center gap-6 py-0.5 whitespace-nowrap cursor-pointer">
                {displayItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                      setSelectedLeave(item);
                      setShowRejectInput(false);
                      setRejectReason('');
                    }}
                    className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full hover:bg-blue-50/80 transition-colors text-xs text-slate-700 border border-transparent hover:border-blue-200 whitespace-nowrap"
                    title="Nhấn để xem chi tiết và phê duyệt nhanh"
                  >
                    {/* Status Dot / Type */}
                    <span className={`inline-flex items-center px-1.5 py-0.2 text-[10px] font-extrabold rounded-md uppercase whitespace-nowrap ${
                      item.status === 'pending'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {getTypeName(item.request_type)}
                    </span>

                    {/* Student Name */}
                    <span className="font-extrabold text-[#0e3a7c] tracking-tight whitespace-nowrap">
                      {item.student_name}
                    </span>

                    {/* Class & Room */}
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded whitespace-nowrap">
                      {item.class_name || 'Lớp'} {item.room_code ? `• ${item.room_code}` : ''}
                    </span>

                    {/* Reason */}
                    <span className="text-slate-600 max-w-[180px] truncate whitespace-nowrap">
                      "{item.reason}"
                    </span>

                    {/* Timespan */}
                    <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{formatShortTime(item.start_time)} ➔ {formatShortTime(item.expected_end_time)}</span>
                    </span>

                    {/* Action Hint */}
                    {item.status === 'pending' && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 hover:bg-blue-200 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 whitespace-nowrap">
                        <Check className="w-2.5 h-2.5" /> Duyệt
                      </span>
                    )}

                    <span className="text-slate-300 font-bold">•</span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => navigate('/leaves')}
                className="flex items-center justify-center gap-2 text-xs text-slate-500 py-0.5 px-2 cursor-pointer hover:text-[#0e3a7c] whitespace-nowrap overflow-hidden min-w-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Hệ thống tiếp nhận đơn xin phép KTX trực tuyến 24/7 — KTX an toàn.</span>
              </div>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1 shrink-0 z-10 pl-1 border-l border-slate-200">
            {/* Student QR Form Link */}
            <button
              onClick={() => setQrModalOpen(true)}
              title="Mã QR & Link cho học sinh / phụ huynh gửi đơn xin nghỉ trực tuyến"
              className="p-1 text-slate-500 hover:text-[#0e3a7c] hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {/* Mute/Unmute Notification Sound */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Chuông thông báo đơn mới: ĐANG BẬT (Nhấn để tắt)' : 'Chuông thông báo đơn mới: ĐANG TẮT (Nhấn để bật)'}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                soundEnabled ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* View Full List Button */}
            <button
              onClick={() => navigate('/leaves')}
              title="Đến trang Quản lý đơn xin phép KTX"
              className="px-2 py-0.5 text-[11px] font-bold text-[#0e3a7c] hover:bg-blue-50 rounded-full inline-flex items-center gap-0.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Xem đơn</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact Badge for screens < 2xl (laptops, tablets, devtools open) */}
      <div className="flex 2xl:hidden items-center gap-1.5 shrink-0 mx-1">
        {pendingCount > 0 ? (
          <button
            onClick={() => navigate('/leaves')}
            title={`${pendingCount} đơn xin phép KTX đang chờ duyệt — Nhấn để xem toàn bộ`}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-xs cursor-pointer transition-transform active:scale-95 animate-pulse whitespace-nowrap"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            <span>{pendingCount}</span>
            <span className="hidden sm:inline">đơn mới</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/leaves')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-full shrink-0 cursor-pointer transition-colors whitespace-nowrap"
            title="KTX an toàn — 0 đơn chờ duyệt"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden md:inline">KTX:</span>
            <span>0 đơn</span>
          </button>
        )}

        <button
          onClick={() => setQrModalOpen(true)}
          title="Mã QR & Link cho học sinh / phụ huynh gửi đơn xin nghỉ trực tuyến"
          className="p-1 text-slate-500 hover:text-[#0e3a7c] hover:bg-blue-50 rounded-full transition-colors cursor-pointer shrink-0"
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* QUICK APPROVE MODAL (When clicking any item in the running ticker) */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0e3a7c] to-[#1e4ea1] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <BellRing className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">XÉT DUYỆT ĐƠN XIN PHÉP KTX</h3>
                  <p className="text-[11px] text-blue-100">
                    Mã đơn: <span className="font-mono font-bold text-amber-300">{selectedLeave.code}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeave(null)}
                className="p-1 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-sm">
              {/* Student Capsule */}
              <div className="flex items-center gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="w-10 h-10 rounded-full bg-[#0e3a7c] text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-xs">
                  {selectedLeave.student_name?.charAt(0) || 'H'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-slate-900 text-sm">{selectedLeave.student_name}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-blue-700 font-semibold">{selectedLeave.student_code}</span>
                    <span>• Lớp {selectedLeave.class_name}</span>
                    {selectedLeave.room_code && <span>• Phòng {selectedLeave.room_code}</span>}
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-black uppercase rounded-lg bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  {getTypeName(selectedLeave.request_type)}
                </span>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Bắt đầu ra ngoài:
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    {formatShortTime(selectedLeave.start_time)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-500 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Dự kiến về lại KTX:
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    {formatShortTime(selectedLeave.expected_end_time)}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-semibold text-slate-600 mb-1">Lý do xin phép:</div>
                <div className="text-sm font-medium text-slate-900 leading-relaxed italic">
                  "{selectedLeave.reason}"
                </div>
              </div>

              {/* Contact & Confirmation */}
              <div className="flex items-center justify-between text-xs p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-700" />
                  <span className="text-slate-700">SĐT Phụ huynh / Liên hệ:</span>
                  <a href={`tel:${selectedLeave.contact_phone}`} className="font-bold text-[#0e3a7c] hover:underline">
                    {selectedLeave.contact_phone || 'Chưa cung cấp'}
                  </a>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Phụ huynh bảo lãnh
                </span>
              </div>

              {/* Reject reason input (if toggled) */}
              {showRejectInput && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-red-700">Nhập lý do từ chối:</label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="VD: Không đủ điều kiện, phụ huynh chưa đồng ý..."
                    className="w-full px-3 py-2 text-xs border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedLeave(null);
                  navigate('/leaves');
                }}
                className="text-xs font-bold text-slate-600 hover:text-[#0e3a7c] inline-flex items-center gap-1"
              >
                <span>Mở trang Quản lý đơn</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                {!showRejectInput ? (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuickReject(selectedLeave.id)}
                    disabled={isRejecting}
                    className="px-3 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isRejecting ? 'Đang từ chối...' : 'Xác nhận từ chối'}
                  </button>
                )}

                <button
                  onClick={() => handleQuickApprove(selectedLeave.id)}
                  disabled={isApproving}
                  className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isApproving ? 'Đang duyệt...' : 'Phê duyệt ngay'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL FOR STUDENTS / PARENTS */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-center">
            <div className="px-5 py-4 bg-[#0e3a7c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm">
                <QrCode className="w-4 h-4 text-amber-300" />
                <span>CỔNG NỘP ĐƠN XIN PHÉP KTX ONLINE</span>
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Học sinh hoặc phụ huynh quét mã QR bằng điện thoại (Zalo / Camera) để gửi đơn xin phép ra ngoài KTX nhanh chóng:
              </p>

              {/* QR Code Canvas / Img */}
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicPortalUrl)}`}
                  alt="QR nộp đơn KTX"
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>

              {/* Direct link copy */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-slate-500 font-medium mb-1">Đường dẫn trực tiếp:</div>
                <div className="font-mono text-blue-700 font-bold break-all select-all">
                  {publicPortalUrl}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicPortalUrl);
                    alert('Đã sao chép link nộp đơn vào bộ nhớ tạm!');
                  }}
                  className="px-4 py-2 bg-blue-50 text-[#0e3a7c] hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
                >
                  Sao chép Link
                </button>
                <a
                  href="/xin-phep"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#0e3a7c] hover:bg-[#1e4ea1] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Mở trang nộp thử
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
