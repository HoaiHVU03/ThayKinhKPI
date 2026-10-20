import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DormRoom, Student } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import {
  CalendarCheck2,
  Clock,
  Users,
  Copy,
  CheckCircle2,
  CheckCheck,
  AlertCircle,
  Share2,
  MessageSquare,
  Check,
  Send,
  Building2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Phone,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw,
  Award,
  BedDouble,
  UserCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Main Tab: 'checkin' (Điểm danh từng phòng) | 'statistics' (Trung tâm thống kê thời gian thực)
  const [activeMainTab, setActiveMainTab] = useState<'checkin' | 'statistics'>('checkin');

  // Checkin Tab state
  const [sessionType, setSessionType] = useState<'evening' | 'morning'>('evening');
  const [selectedFloor, setSelectedFloor] = useState<string>('2');
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<DormRoom | null>(null);
  const [roomStudents, setRoomStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics Tab state
  const [statPeriodType, setStatPeriodType] = useState<'day' | 'month' | 'year'>('day');
  const [statDate, setStatDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [statSessionType, setStatSessionType] = useState<'evening' | 'morning'>('evening');
  const [statMonth, setStatMonth] = useState<number>(new Date().getMonth() + 1);
  const [statYear, setStatYear] = useState<number>(new Date().getFullYear());
  const [statsData, setStatsData] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [absentFilter, setAbsentFilter] = useState<'all' | 'unexcused' | 'excused'>('all');
  const [absentSearch, setAbsentSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Zalo report modal
  const [zaloModalOpen, setZaloModalOpen] = useState(false);
  const [zaloContent, setZaloContent] = useState('');
  const [copied, setCopied] = useState(false);

  // Status notes modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const [customStatus, setCustomStatus] = useState<string>('excused_absence');
  const [customNote, setCustomNote] = useState<string>('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/dormitory/rooms', { floor: selectedFloor });
      setRooms(data || []);
      if (data && data.length > 0 && !selectedRoom) {
        handleSelectRoom(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor, sessionType]);

  const handleSelectRoom = async (room: DormRoom) => {
    setSelectedRoom(room);
    try {
      const full: any = await api.get(`/dormitory/rooms/${room.id}`);
      setRoomStudents(full.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!selectedRoom) return;
    try {
      await api.post('/dormitory/attendance/mark-all-present', {
        room_id: selectedRoom.id,
        session_type: sessionType,
      });
      alert(`Đã ghi nhận "1 CHẠM — ĐỦ MẶT" cho phòng ${selectedRoom.code}!`);
      handleSelectRoom(selectedRoom);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi điểm danh');
    }
  };

  const handleUpdateStudentStatus = async (studentId: number, status: string, note: string = '') => {
    if (!selectedRoom) return;
    try {
      await api.post('/dormitory/attendance/mark-student', {
        student_id: studentId,
        room_id: selectedRoom.id,
        status,
        note,
        session_type: sessionType,
      });
      handleSelectRoom(selectedRoom);
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleSaveCustomStatus = () => {
    if (!activeStudent) return;
    handleUpdateStudentStatus(activeStudent.id, customStatus, customNote);
    setNoteModalOpen(false);
  };

  const handleOpenZaloReport = async () => {
    try {
      const res: any = await api.get(`/dormitory/floor-reports/${selectedFloor}/zalo`);
      setZaloContent(res.zalo_content || '');
      setCopied(false);
      setZaloModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo báo cáo Zalo');
    }
  };

  const handleCopyZalo = () => {
    navigator.clipboard.writeText(zaloContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get('/dormitory/attendance/statistics', {
        date: statDate,
        session_type: statSessionType,
        period_type: statPeriodType,
        month: statMonth,
        year: statYear,
      });
      setStatsData(res);
      setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      console.error('Lỗi khi tải thống kê điểm danh:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [statPeriodType, statDate, statSessionType, statMonth, statYear]);

  useEffect(() => {
    if (activeMainTab !== 'statistics' || !autoRefresh) return;
    const timer = setInterval(() => {
      fetchStatistics();
    }, 20000);
    return () => clearInterval(timer);
  }, [activeMainTab, autoRefresh, statPeriodType, statDate, statSessionType, statMonth, statYear]);

  const handleJumpToRoom = (room: any) => {
    setSelectedFloor(String(room.floor_number));
    setSelectedRoom(room);
    setActiveMainTab('checkin');
  };

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'present': return { label: 'Có mặt', color: 'bg-emerald-100 text-emerald-800' };
      case 'excused_absence': return { label: 'Vắng có phép', color: 'bg-blue-100 text-blue-800' };
      case 'unexcused_absence': return { label: 'Vắng không phép', color: 'bg-red-100 text-red-800' };
      case 'hospital': return { label: 'Đi khám bệnh', color: 'bg-purple-100 text-purple-800' };
      case 'hometown': return { label: 'Về quê', color: 'bg-amber-100 text-amber-800' };
      case 'outside_permitted': return { label: 'Được phép ra ngoài', color: 'bg-sky-100 text-sky-800' };
      default: return { label: 'Chưa điểm danh', color: 'bg-slate-100 text-slate-600' };
    }
  };

  // Filter absent students
  const filteredAbsentStudents = (statsData?.absent_students || []).filter((st: any) => {
    if (absentFilter === 'unexcused' && st.status !== 'unexcused_absence') return false;
    if (absentFilter === 'excused' && st.status === 'unexcused_absence') return false;
    if (absentSearch.trim() !== '') {
      const q = absentSearch.toLowerCase();
      const matchName = st.student_name?.toLowerCase().includes(q);
      const matchCode = st.student_code?.toLowerCase().includes(q);
      const matchClass = st.class_name?.toLowerCase().includes(q);
      const matchRoom = st.room_code?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchClass && !matchRoom) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Điểm danh ký túc xá & giám sát thời gian thực</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0e3a7c]">
              THPT Chuyên Hùng Vương
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Ca Sáng: <strong>06h00</strong></span>
            <span>•</span>
            <span>Ca Tối: <strong>22h00</strong></span>
            <span>•</span>
            <span>Chốt sổ KTX: <strong>22h15</strong></span>
            <span>•</span>
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
              Đồng bộ dữ liệu KTX
            </span>
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {activeMainTab === 'checkin' ? (
            <>
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
                <button
                  onClick={() => setSessionType('morning')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    sessionType === 'morning' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ca Sáng (06h00)
                </button>
                <button
                  onClick={() => setSessionType('evening')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    sessionType === 'evening' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ca Tối (22h00)
                </button>
              </div>

              <button
                onClick={handleOpenZaloReport}
                className="px-3.5 py-2 bg-[#0068ff] hover:bg-[#0054cc] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Báo cáo Zalo 22h15
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStatistics}
                disabled={statsLoading}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin text-[#0e3a7c]' : ''}`} />
                Làm mới realtime
              </button>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                {lastRefreshed ? `Cập nhật lúc ${lastRefreshed}` : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 pt-1 shadow-2xs">
        <button
          onClick={() => setActiveMainTab('checkin')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeMainTab === 'checkin'
              ? 'border-[#0e3a7c] text-[#0e3a7c] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Kiểm Diện Từng Phòng (1 Chạm)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('statistics')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer relative ${
            activeMainTab === 'statistics'
              ? 'border-[#0e3a7c] text-[#0e3a7c] bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Trung Tâm Thống Kê & Giám Sát Realtime</span>
          {statsData?.summary?.unchecked_rooms > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
              {statsData.summary.unchecked_rooms} phòng chưa báo cáo
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB 1: CHECKIN MODE ===================== */}
      {activeMainTab === 'checkin' && (
        <div className="space-y-6">
          {/* Floor navigation tabs */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto text-xs font-bold">
            {[2, 3, 4, 5, 6].map((fl) => (
              <button
                key={fl}
                onClick={() => { setSelectedFloor(String(fl)); setSelectedRoom(null); }}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedFloor === String(fl) ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tầng {fl} {fl <= 3 ? '(Khu Nam)' : fl === 4 ? '(Nam / Nữ)' : '(Khu Nữ)'}
              </button>
            ))}
          </div>

          {/* Split Interface: Room Selector on Left, Attendance Sheet on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Room Grid (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col h-[70vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Danh sách 24 phòng Tầng {selectedFloor}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {rooms.filter(r => r.attendance_status === 'reported').length}/{rooms.length} đã báo cáo
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {rooms.map((room) => {
                  const isSelected = selectedRoom?.id === room.id;
                  const isReported = room.attendance_status === 'reported';

                  return (
                    <div
                      key={room.id}
                      onClick={() => handleSelectRoom(room)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0e3a7c] bg-blue-50/70 shadow-xs'
                          : isReported
                          ? 'border-emerald-200 bg-emerald-50/20 hover:bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">{room.code}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            room.gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {room.gender}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          TP: {room.room_leader_name ? room.room_leader_name.split(' ').slice(-2).join(' ') : '—'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-700">
                          {room.current_occupancy}/{room.capacity} HS
                        </div>
                        <div>
                          {isReported ? (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5 justify-end">
                              <CheckCircle2 className="w-3 h-3" /> Đã xong
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-medium">Chưa xong</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Room Attendance Action Panel (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              {selectedRoom ? (
                <div className="space-y-5">
                  {/* Active Room Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black font-mono text-[#0e3a7c]">
                          Phòng {selectedRoom.code}
                        </h2>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          Tầng {selectedRoom.floor_number} • Khu {selectedRoom.gender}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Trưởng phòng: <strong>{selectedRoom.room_leader_name || 'Chưa phân công'}</strong> • Quân số: <strong>{roomStudents.length} học sinh</strong>
                      </p>
                    </div>

                    {/* Section 7.2: Nút Điểm danh đủ mặt */}
                    <button
                      onClick={handleMarkAllPresent}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4 text-white" />
                      Điểm danh đủ mặt
                    </button>
                  </div>

                  {/* Students Attendance List */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    {roomStudents.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        Phòng này hiện chưa có học sinh nội trú nào
                      </div>
                    ) : (
                      roomStudents.map((st) => {
                        const stStatus = st.attendance_status || 'unrecorded';
                        const badgeInfo = statusLabel(stStatus);

                        return (
                          <div key={st.id} className="p-3 bg-white hover:bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#0e3a7c]">{st.code}</span>
                                <span className="font-bold text-slate-900 text-sm">{st.full_name}</span>
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                  {st.class_name}
                                </span>
                              </div>
                              {st.attendance_note && (
                                <p className="text-[11px] text-slate-500 italic mt-0.5">
                                  Ghi chú: {st.attendance_note}
                                </p>
                              )}
                            </div>

                            {/* Status Toggle Buttons */}
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${badgeInfo.color}`}>
                                {badgeInfo.label}
                              </span>

                              <button
                                onClick={() => handleUpdateStudentStatus(st.id, 'present')}
                                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                                  stStatus === 'present'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                              >
                                Có mặt
                              </button>

                              <button
                                onClick={() => {
                                  setActiveStudent(st);
                                  setCustomStatus('excused_absence');
                                  setCustomNote(st.attendance_note || '');
                                  setNoteModalOpen(true);
                                }}
                                className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
                              >
                                Vắng / Ngoại lệ...
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
                  <Building2 className="w-10 h-10 text-slate-300 mb-2" />
                  Chọn một phòng KTX ở danh sách bên trái để bắt đầu điểm danh
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: REAL-TIME STATISTICS & MONITORING ===================== */}
      {activeMainTab === 'statistics' && (
        <div className="space-y-6">
          {/* Controls Bar: Multi-period filters (Ngày / Tháng / Năm) & Session */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Period Type Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">
                  Chu kỳ thống kê:
                </span>
                <div className="flex items-center bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setStatPeriodType('day')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statPeriodType === 'day'
                        ? 'bg-[#0e3a7c] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hôm Nay / Theo Ngày
                  </button>
                  <button
                    onClick={() => setStatPeriodType('month')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statPeriodType === 'month'
                        ? 'bg-[#0e3a7c] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    onClick={() => setStatPeriodType('year')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statPeriodType === 'year'
                        ? 'bg-[#0e3a7c] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Theo Năm Học
                  </button>
                </div>
              </div>

              {/* Specific Date / Month / Year Inputs */}
              <div className="flex items-center gap-3 flex-wrap">
                {statPeriodType === 'day' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Ngày:</label>
                    <input
                      type="date"
                      value={statDate}
                      onChange={(e) => setStatDate(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                    />
                  </div>
                )}

                {statPeriodType === 'month' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Tháng:</label>
                    <select
                      value={statMonth}
                      onChange={(e) => setStatMonth(Number(e.target.value))}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>
                    <label className="text-xs font-semibold text-slate-600 ml-1">Năm:</label>
                    <select
                      value={statYear}
                      onChange={(e) => setStatYear(Number(e.target.value))}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                    </select>
                  </div>
                )}

                {statPeriodType === 'year' && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Năm học:</label>
                    <select
                      value={statYear}
                      onChange={(e) => setStatYear(Number(e.target.value))}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
                    >
                      <option value={2026}>Năm học 2025 - 2026</option>
                      <option value={2025}>Năm học 2024 - 2025</option>
                    </select>
                  </div>
                )}

                {/* Session Type */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                  <button
                    onClick={() => setStatSessionType('evening')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statSessionType === 'evening'
                        ? 'bg-indigo-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ca Tối (22h00)
                  </button>
                  <button
                    onClick={() => setStatSessionType('morning')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statSessionType === 'morning'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ca Sáng (06h00)
                  </button>
                </div>

                {/* Auto Refresh Toggle */}
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded text-[#0e3a7c] focus:ring-[#0e3a7c] w-3.5 h-3.5"
                  />
                  <span>Tự động cập nhật (20s)</span>
                </label>
              </div>
            </div>
          </div>

          {/* 6 Real-time Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Quân số nội trú"
              value={statsData?.summary?.total_boarding ?? 702}
              subValue="720 chỗ quy chuẩn"
              icon={BedDouble}
              color="navy"
            />
            <StatCard
              title="Tiến độ báo cáo"
              value={`${statsData?.summary?.reporting_progress ?? 0}%`}
              subValue={`${statsData?.summary?.checked_rooms ?? 0}/${statsData?.summary?.total_rooms ?? 120} phòng đã nộp`}
              icon={CheckCircle2}
              color="green"
            />
            {/* Unreported Rooms Alert Card */}
            <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
              (statsData?.summary?.unchecked_rooms ?? 0) > 0
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Phòng chưa báo cáo
                </span>
                <span className={`p-1.5 rounded-xl ${
                  (statsData?.summary?.unchecked_rooms ?? 0) > 0 ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-800 mt-2 flex items-center gap-2">
                <span>{statsData?.summary?.unchecked_rooms ?? 0}</span>
                <span className="text-xs font-semibold text-rose-600">phòng</span>
                {(statsData?.summary?.unchecked_rooms ?? 0) > 0 && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                )}
              </div>
              <div className="text-[11px] text-rose-700 font-medium mt-1 truncate">
                {(statsData?.summary?.unchecked_rooms ?? 0) > 0 ? 'Cần Trực ban kiểm tra!' : 'Đã đủ 100%'}
              </div>
            </div>

            <StatCard
              title="Có mặt thực tế"
              value={statsData?.summary?.present ?? 0}
              subValue={`Tỷ lệ: ${statsData?.summary?.attendance_rate ?? 0}%`}
              icon={UserCheck}
              color="blue"
            />
            <StatCard
              title="Vắng có phép"
              value={statsData?.summary?.excused ?? 0}
              subValue="Về quê, đi viện, phép ngoài"
              icon={Clock}
              color="gold"
            />
            <StatCard
              title="Vắng không phép"
              value={statsData?.summary?.unexcused ?? 0}
              subValue="Báo động vi phạm nề nếp"
              icon={ShieldAlert}
              color="red"
            />
          </div>

          {/* ===================== SECTION 1: XEM Ở ĐÂU — PHÒNG NÀO CHƯA BÁO CÁO ===================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#0e3a7c]" />
                  <span>XEM Ở ĐÂU — PHÒNG NÀO CHƯA BÁO CÁO (GIÁM SÁT TRỰC BAN)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân bố theo từng tầng từ Tầng 2 đến Tầng 6 • Bấm "Điểm danh ngay" để lập tức kiểm diện phòng đó
                </p>
              </div>

              {statsData?.summary?.unchecked_rooms === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  100% 120 phòng đã hoàn thành
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Còn {statsData?.summary?.unchecked_rooms} phòng chưa nộp kết quả
                </span>
              )}
            </div>

            {/* Floor Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(statsData?.floor_breakdown || []).map((fb: any) => (
                <div
                  key={fb.floor}
                  className={`p-3.5 rounded-xl border transition-all ${
                    fb.is_completed
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-amber-50/30 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{fb.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      fb.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 font-black'
                    }`}>
                      {fb.is_completed ? 'Hoàn thành' : `Còn ${fb.unchecked_rooms} phòng`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{fb.zone}</div>
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Đã báo cáo</span>
                      <span>{fb.checked_rooms}/{fb.total_rooms} phòng</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${fb.is_completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${(fb.checked_rooms / (fb.total_rooms || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Specific Unreported Rooms List */}
            {(statsData?.unreported_rooms || []).length > 0 ? (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-rose-800 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Danh sách chi tiết {(statsData?.unreported_rooms || []).length} phòng chưa báo cáo:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(statsData?.unreported_rooms || []).map((room: any) => (
                    <div
                      key={room.id}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50/70 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-rose-900">
                              Phòng {room.code}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                              Tầng {room.floor_number}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              room.gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                            }`}>
                              Khu {room.gender}
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 mt-1">
                            Trưởng phòng: <strong>{room.room_leader_name || 'Chưa phân công'}</strong>
                          </div>
                          {room.room_leader_phone && (
                            <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{room.room_leader_phone}</span>
                              <button
                                onClick={() => handleCopyPhone(room.room_leader_phone)}
                                className="text-[10px] text-blue-600 hover:underline ml-1 cursor-pointer"
                              >
                                {copiedPhone === room.room_leader_phone ? 'Đã sao chép' : 'Sao chép SĐT'}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="text-right text-xs">
                          <span className="font-bold text-slate-700">
                            {room.current_occupancy}/{room.capacity} HS
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                        <span className="text-[11px] text-rose-600 font-semibold italic">
                          Chưa nộp kết quả
                        </span>
                        <button
                          onClick={() => handleJumpToRoom(room)}
                          className="px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Điểm danh ngay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center text-xs text-emerald-800 font-semibold flex flex-col items-center justify-center gap-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-1" />
                <span>Không có phòng nào chưa báo cáo! Toàn bộ 120 phòng KTX đã hoàn tất kiểm diện.</span>
              </div>
            )}
          </div>

          {/* ===================== SECTION 2: DANH SÁCH VẮNG AI ===================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-600" />
                  <span>DANH SÁCH "VẮNG AI" TRONG CA NÀY ({filteredAbsentStudents.length} HỌC SINH)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chi tiết từng học sinh vắng mặt, phân loại có phép / không phép, liên hệ phụ huynh và xử lý vi phạm
                </p>
              </div>

              {/* Sub-filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-bold">
                  <button
                    onClick={() => setAbsentFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      absentFilter === 'all' ? 'bg-[#0e3a7c] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({(statsData?.absent_students || []).length})
                  </button>
                  <button
                    onClick={() => setAbsentFilter('unexcused')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      absentFilter === 'unexcused' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Không phép ({statsData?.summary?.unexcused || 0})
                  </button>
                  <button
                    onClick={() => setAbsentFilter('excused')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      absentFilter === 'excused' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Có phép ({statsData?.summary?.excused || 0})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={absentSearch}
                    onChange={(e) => setAbsentSearch(e.target.value)}
                    placeholder="Tìm theo tên, lớp, phòng..."
                    className="pl-8 pr-3 py-1 border border-slate-300 rounded-xl text-xs bg-slate-50 w-48 focus:w-60 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Absent Students Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3">Phòng KTX</th>
                    <th className="p-3">Trạng thái vắng</th>
                    <th className="p-3">Lý do / ghi chú</th>
                    <th className="p-3">Liên hệ phụ huynh</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAbsentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Không có học sinh nào vắng theo điều kiện lọc hiện tại
                      </td>
                    </tr>
                  ) : (
                    filteredAbsentStudents.map((st: any, idx: number) => {
                      const badge = statusLabel(st.status);
                      const isUnexcused = st.status === 'unexcused_absence';

                      return (
                        <tr key={st.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{st.student_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{st.student_code}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{st.class_name}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-[#0e3a7c]">Phòng {st.room_code}</span>
                            <div className="text-[10px] text-slate-500">Tầng {st.floor_number}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 italic max-w-xs truncate">
                            {st.note || '—'}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{st.parent_name || 'Phụ huynh'}</div>
                            {st.parent_phone ? (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{st.parent_phone}</span>
                                <button
                                  onClick={() => handleCopyPhone(st.parent_phone)}
                                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                                >
                                  {copiedPhone === st.parent_phone ? 'Đã sao chép' : 'Copy'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Chưa cập nhật SĐT</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isUnexcused ? (
                              <button
                                onClick={() => navigate('/kpi')}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                Lập biên bản vi phạm
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Đã có đơn/lý do</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== SECTION 3: TOP THƯỜNG XUYÊN VẮNG MẶT & VI PHẠM KTX ===================== */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>TOP HỌC SINH THƯỜNG XUYÊN VẮNG MẶT & VI PHẠM KTX (CẢNH BÁO KỶ LUẬT)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thống kê lũy kế số buổi vắng và số lần vi phạm nội quy KTX • Phục vụ xét duyệt tư cách ở KTX & thông báo gia đình
                </p>
              </div>

              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                Xếp hạng 50 trường hợp cần lưu ý
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">Hạng</th>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3">Phòng KTX</th>
                    <th className="p-3 text-center">Vắng không phép</th>
                    <th className="p-3 text-center">Vắng có phép</th>
                    <th className="p-3 text-center">Tổng buổi vắng</th>
                    <th className="p-3 text-center">Vi phạm KTX</th>
                    <th className="p-3 text-center">Điểm nề nếp</th>
                    <th className="p-3">Mức độ cảnh báo</th>
                    <th className="p-3">Liên hệ phụ huynh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(statsData?.frequent_absentees || []).length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        Chưa có dữ liệu học sinh thường xuyên vắng mặt
                      </td>
                    </tr>
                  ) : (
                    (statsData?.frequent_absentees || []).map((fa: any, idx: number) => {
                      const isDanger = fa.warning_level === 'danger';
                      const isWarning = fa.warning_level === 'warning';

                      return (
                        <tr
                          key={fa.student_id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isDanger ? 'bg-rose-50/30' : isWarning ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="p-3 text-center font-mono font-black">
                            {idx === 0 && <span className="inline-block px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 font-black">#1</span>}
                            {idx === 1 && <span className="inline-block px-1.5 py-0.5 rounded bg-slate-300 text-slate-900 font-black">#2</span>}
                            {idx === 2 && <span className="inline-block px-1.5 py-0.5 rounded bg-amber-600 text-white font-black">#3</span>}
                            {idx > 2 && <span className="text-slate-400">#{idx + 1}</span>}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{fa.student_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{fa.student_code}</div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{fa.class_name}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-[#0e3a7c]">
                              {fa.room_code ? `P${fa.room_code.replace('P', '')}` : '—'}
                            </span>
                            {fa.floor_number && (
                              <div className="text-[10px] text-slate-500">Tầng {fa.floor_number}</div>
                            )}
                          </td>
                          <td className="p-3 text-center font-black text-rose-700">
                            {fa.unexcused_count > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                {fa.unexcused_count} buổi
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-700">
                            {fa.excused_count} buổi
                          </td>
                          <td className="p-3 text-center font-bold text-slate-900">
                            {fa.total_absences} buổi
                          </td>
                          <td className="p-3 text-center">
                            {fa.violation_count > 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                                {fa.violation_count} lần
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold text-[#0e3a7c]">
                              {fa.final_kpi_score}
                            </span>
                          </td>
                          <td className="p-3">
                            {isDanger ? (
                              <span className="px-2 py-1 rounded text-[11px] font-black bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Nguy cơ cao — Mời PH / Kỷ luật
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-1 rounded text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Cảnh báo nề nếp
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                                Cần theo dõi
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{fa.parent_name || 'Phụ huynh'}</div>
                            {fa.parent_phone ? (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{fa.parent_phone}</span>
                                <button
                                  onClick={() => handleCopyPhone(fa.parent_phone)}
                                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                                >
                                  {copiedPhone === fa.parent_phone ? 'Đã chép' : 'Copy'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Chưa có SĐT</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================== SECTION 4: BIỂU ĐỒ XU HƯỚNG THEO THÁNG / THEO NĂM ===================== */}
          {(statPeriodType === 'month' || statPeriodType === 'year') && (statsData?.trends || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-700" />
                    <span>
                      BIỂU ĐỒ DIỄN BIẾN ĐIỂM DANH & TỶ LỆ CHUYÊN CẦN ({statPeriodType === 'month' ? `THÁNG ${statMonth}/${statYear}` : `NĂM HỌC ${statYear}`})
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đường biểu diễn tỷ lệ có mặt (%) và số lượng học sinh vắng theo từng mốc thời gian
                  </p>
                </div>
              </div>

              <div className="h-72 w-full pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey={statPeriodType === 'month' ? 'day' : 'month'}
                      tick={{ fontSize: 11 }}
                      interval={statPeriodType === 'month' ? 2 : 0}
                    />
                    <YAxis yAxisId="left" domain={[90, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar yAxisId="right" dataKey="unexcused" name="Vắng không phép" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="excused" name="Vắng có phép" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="rate" name="Tỷ lệ có mặt (%)" stroke="#0e3a7c" strokeWidth={3} dot={{ r: 3 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Zalo 22h15 Report Generator (Section 7.5) */}
      <Modal
        isOpen={zaloModalOpen}
        onClose={() => setZaloModalOpen(false)}
        title={`Nội dung báo cáo Zalo 22h15 — Tầng ${selectedFloor}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="text-slate-500">
            Nội dung báo cáo tự động tổng hợp từ dữ liệu điểm danh thực tế của 24 phòng thuộc Tầng {selectedFloor}. Bấm <strong>Sao chép nội dung</strong> để dán trực tiếp vào nhóm Zalo Quản sinh KTX.
          </p>

          <div className="relative">
            <textarea
              readOnly
              rows={12}
              value={zaloContent}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl leading-relaxed text-slate-800"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 italic">
              * Sinh tự động theo quy định của Trường THPT Chuyên Hùng Vương
            </span>

            <button
              onClick={handleCopyZalo}
              className="px-4 py-2 bg-[#0068ff] hover:bg-[#0054cc] text-white font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Đã sao chép!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Sao chép nội dung Zalo
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Custom Exception / Absence Note */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={activeStudent ? `Ghi nhận ngoại lệ: ${activeStudent.full_name}` : ''}
        maxWidth="md"
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trạng thái điểm danh (*)</label>
            <select
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="excused_absence">Vắng có phép</option>
              <option value="unexcused_absence">Vắng không phép</option>
              <option value="hospital">Đi khám bệnh / Nằm viện</option>
              <option value="hometown">Về quê cuối tuần</option>
              <option value="outside_permitted">Được phép ra ngoài theo đơn</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú sự việc</label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Nhập lý do hoặc mã đơn xin phép đã được duyệt..."
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              onClick={() => setNoteModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveCustomStatus}
              className="px-4 py-1.5 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Lưu trạng thái
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

