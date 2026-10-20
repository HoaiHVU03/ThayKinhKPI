// frontend/src/pages/LeaveRequestsPage.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { LeaveRequest, Student } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Home,
  Briefcase,
  Activity,
  Edit,
  Trash2,
  X,
  BedDouble,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  QrCode,
} from 'lucide-react';

export const LeaveRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'start_desc' | 'start_asc'>('newest');

  // Create Leave Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchedStudents, setSearchedStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  const [formLeave, setFormLeave] = useState({
    request_type: 'home',
    reason: '',
    start_time: '',
    expected_end_time: '',
    contact_phone: '',
    parent_confirmation: 1,
  });

  // Edit Leave State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
  const [editLeaveData, setEditLeaveData] = useState({
    request_type: 'home',
    reason: '',
    start_time: '',
    expected_end_time: '',
    contact_phone: '',
    parent_confirmation: 1,
    status: 'pending',
  });

  // QR Modal for Students
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const triggerRealtimeSync = () => {
    window.dispatchEvent(new CustomEvent('leave-request-updated'));
    try {
      const bc = new BroadcastChannel('kpi_leaves_realtime');
      bc.postMessage({ type: 'REFRESH' });
      bc.close();
    } catch {}
  };

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/leave-requests', {
        status: statusFilter === 'overdue' ? '' : statusFilter,
        request_type: typeFilter,
        date: dateFilter,
        search: searchFilter,
        sort: sortOrder,
      });
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter, typeFilter, dateFilter, searchFilter, sortOrder]);

  // Real-time student search as user types
  useEffect(() => {
    if (!createModalOpen) return;
    if (selectedStudent) return;

    const q = studentSearch.trim();
    const timer = setTimeout(async () => {
      setIsSearchingStudent(true);
      try {
        const res: any = await api.get('/students', { search: q, is_boarding: 1, limit: 10 });
        setSearchedStudents(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingStudent(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [studentSearch, createModalOpen, selectedStudent]);

  const handleOpenCreateLeaveModal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    // Default start now, return tomorrow 21:00
    const startStr = `${y}-${m}-${d}T${hh}:${mm}`;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ty = tomorrow.getFullYear();
    const tm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const td = String(tomorrow.getDate()).padStart(2, '0');
    const endStr = `${ty}-${tm}-${td}T21:00`;

    setFormLeave({
      request_type: 'home',
      reason: '',
      start_time: startStr,
      expected_end_time: endStr,
      contact_phone: '',
      parent_confirmation: 1,
    });
    setSelectedStudent(null);
    setStudentSearch('');
    setSearchedStudents([]);
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !formLeave.reason || !formLeave.start_time || !formLeave.expected_end_time) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    try {
      await api.post('/leave-requests', {
        student_id: selectedStudent.id,
        ...formLeave,
      });
      alert('Nộp đơn xin phép thành công! Đang chờ Quản sinh xét duyệt.');
      setCreateModalOpen(false);
      setSelectedStudent(null);
      fetchLeaveRequests();
      triggerRealtimeSync();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi nộp đơn');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/leave-requests/${id}/approve`);
      alert('Đã phê duyệt đơn xin phép');
      fetchLeaveRequests();
      triggerRealtimeSync();
    } catch (err: any) {
      alert(err.message || 'Lỗi duyệt');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối đơn:');
    if (reason === null) return;
    try {
      await api.post(`/leave-requests/${id}/reject`, { approval_notes: reason });
      alert('Đã từ chối đơn xin phép');
      fetchLeaveRequests();
      triggerRealtimeSync();
    } catch (err: any) {
      alert(err.message || 'Lỗi từ chối');
    }
  };

  const handleCheckin = async (id: number) => {
    try {
      await api.post(`/leave-requests/${id}/checkin`);
      alert('Đã xác nhận học sinh trở về KTX');
      fetchLeaveRequests();
      triggerRealtimeSync();
    } catch (err: any) {
      alert(err.message || 'Lỗi xác nhận trở về');
    }
  };

  const handleOpenEdit = (r: LeaveRequest) => {
    setEditingLeaveId(r.id);
    setEditLeaveData({
      request_type: r.request_type || 'home',
      reason: r.reason || '',
      start_time: r.start_time || '',
      expected_end_time: r.expected_end_time || '',
      contact_phone: r.contact_phone || '',
      parent_confirmation: r.parent_confirmation ?? 1,
      status: r.status || 'pending',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaveId) return;
    try {
      await api.put(`/leave-requests/${editingLeaveId}`, editLeaveData);
      alert('Cập nhật đơn xin phép thành công!');
      setEditModalOpen(false);
      fetchLeaveRequests();
      triggerRealtimeSync();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật đơn');
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!window.confirm(`Xác nhận hủy và xóa đơn xin phép "${code}"?`)) {
      return;
    }
    try {
      await api.delete(`/leave-requests/${id}`);
      alert(`Đã xóa đơn xin phép ${code} thành công`);
      fetchLeaveRequests();
      triggerRealtimeSync();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa đơn');
    }
  };

  const typeMap: Record<string, { label: string; icon: any; color: string }> = {
    home: { label: 'Về quê cuối tuần', icon: Home, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    tutoring: { label: 'Học thêm tối', icon: Briefcase, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    medical: { label: 'Khám bệnh', icon: Activity, color: 'text-red-700 bg-red-50 border-red-200' },
    personal: { label: 'Việc riêng', icon: Clock, color: 'text-purple-700 bg-purple-50 border-purple-200' },
    other: { label: 'Khác', icon: FileText, color: 'text-slate-700 bg-slate-50 border-slate-200' },
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case 'approved': return { label: 'Đã phê duyệt', variant: 'info' as const };
      case 'pending': return { label: 'Chờ Quản sinh duyệt', variant: 'warning' as const };
      case 'rejected': return { label: 'Đã từ chối', variant: 'danger' as const };
      case 'completed': return { label: 'Đã về KTX', variant: 'success' as const };
      case 'overdue': return { label: 'Quá hạn trở lại', variant: 'danger' as const };
      default: return { label: s, variant: 'neutral' as const };
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === 'overdue' && !r.is_overdue) return false;
    return true;
  });

  const setDatePreset = (preset: 'today' | 'yesterday' | 'clear') => {
    if (preset === 'clear') {
      setDateFilter('');
      return;
    }
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDateFilter(`${y}-${m}-${day}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quản lý đơn xin phép KTX</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#0e3a7c]">
              {filteredRequests.length} đơn
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt đơn ra ngoài, về quê cuối tuần, học thêm tối, khám bệnh • Theo dõi thời gian trở lại KTX
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Mã QR cho học sinh / phụ huynh nộp đơn online bằng điện thoại"
          >
            <QrCode className="w-4 h-4 text-[#0e3a7c]" /> QR Nộp đơn Online
          </button>

          <button
            onClick={handleOpenCreateLeaveModal}
            className="px-4 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo đơn xin phép
          </button>
        </div>
      </div>

      {/* Quick Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
            statusFilter === ''
              ? 'border-[#0e3a7c] bg-blue-50/70 shadow-xs ring-2 ring-blue-100'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tất cả đơn</div>
          <div className="text-lg sm:text-xl font-black text-[#0e3a7c] mt-0.5">{requests.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
            statusFilter === 'pending'
              ? 'border-amber-400 bg-amber-50/70 shadow-xs ring-2 ring-amber-100'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wide">Chờ phê duyệt</div>
          <div className="text-lg sm:text-xl font-black text-amber-800 mt-0.5">
            {requests.filter(r => r.status === 'pending').length}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
            statusFilter === 'approved'
              ? 'border-sky-400 bg-sky-50/70 shadow-xs ring-2 ring-sky-100'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold text-sky-700 uppercase tracking-wide">Đang ra ngoài</div>
          <div className="text-lg sm:text-xl font-black text-sky-800 mt-0.5">
            {requests.filter(r => r.status === 'approved' && !r.is_overdue).length}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('overdue')}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer touch-manipulation ${
            statusFilter === 'overdue'
              ? 'border-rose-400 bg-rose-50/70 shadow-xs ring-2 ring-rose-200'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold text-rose-700 uppercase tracking-wide flex items-center justify-between">
            <span>Quá hạn</span>
            {requests.filter(r => r.is_overdue).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
            )}
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-800 mt-0.5">
            {requests.filter(r => r.is_overdue).length}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer touch-manipulation col-span-2 sm:col-span-1 ${
            statusFilter === 'completed'
              ? 'border-emerald-400 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-100'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Đã về KTX</div>
          <div className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">
            {requests.filter(r => r.status === 'completed').length}
          </div>
        </button>
      </div>

      {/* Filter Bar with Date Filter & Newest First Sort */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-[#0e3a7c]" />
            <span className="font-semibold text-slate-700">Ngày:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDatePreset('clear')}
                className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                title="Xóa lọc ngày"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dateFilter === new Date().toISOString().slice(0, 10)
                  ? 'bg-[#0e3a7c] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setDatePreset('yesterday')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Hôm qua
            </button>
            {dateFilter && (
              <button
                onClick={() => setDatePreset('clear')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                Tất cả ngày
              </button>
            )}
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Sort Control: Default Newest First */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="p-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
            >
              <option value="newest">🔥 Mới nhất trước (Mặc định)</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="start_desc">Thời gian đi mới nhất</option>
              <option value="start_asc">Thời gian đi cũ nhất</option>
            </select>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Trạng thái:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ phê duyệt</option>
              <option value="approved">Đã phê duyệt (Đang ra ngoài)</option>
              <option value="overdue">Quá hạn trở lại</option>
              <option value="completed">Đã về KTX an toàn</option>
              <option value="rejected">Bị từ chối</option>
            </select>
          </div>

          {/* Reason Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Tất cả lý do</option>
            <option value="home">Về quê cuối tuần</option>
            <option value="tutoring">Học thêm tối</option>
            <option value="medical">Khám bệnh</option>
            <option value="personal">Việc riêng gia đình</option>
          </select>
        </div>

        {/* Right side: Search & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Tìm theo tên, mã, lớp, phòng..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <button
            onClick={fetchLeaveRequests}
            disabled={loading}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0e3a7c]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Leave Requests Container: Dual View (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* MOBILE CARDS VIEW (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="px-4 py-12 text-center text-xs text-slate-400">
              Đang tải danh sách đơn xin phép...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-slate-400">
              Không có đơn xin phép nào phù hợp với bộ lọc
            </div>
          ) : (
            filteredRequests.map((r, idx) => {
              const t = typeMap[r.request_type] || typeMap.other;
              const b = statusVariant(r.status);
              const isOverdue = r.is_overdue;
              const isNewest = idx === 0 && sortOrder === 'newest';

              return (
                <div key={r.id} className={`p-3.5 space-y-2.5 transition-colors ${isNewest ? 'bg-blue-50/20' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-[#0e3a7c]">{r.code}</span>
                      {isNewest && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          Mới
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${t.color}`}>
                        {t.label}
                      </span>
                      <Badge variant={isOverdue ? 'danger' : b.variant}>
                        {isOverdue ? 'Quá hạn' : b.label}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">{r.student_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-[#0e3a7c] font-semibold">{r.student_code}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{r.class_name}</span>
                      {r.room_code && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">{r.room_code}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="text-slate-700">
                      <strong className="text-slate-800">Lý do:</strong> {r.reason}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      <strong>SĐT:</strong> {r.contact_phone || 'Chưa cung cấp'}
                    </div>
                    <div className="text-slate-600 text-[11px] pt-0.5 border-t border-slate-200/60 mt-1">
                      <div>Từ: <strong className="text-slate-800">{r.start_time?.substring(0, 16)}</strong></div>
                      <div className={isOverdue ? 'text-red-700 font-bold' : ''}>
                        Về: <strong className={isOverdue ? 'text-red-700' : 'text-slate-800'}>{r.expected_end_time?.substring(0, 16)}</strong>
                        {isOverdue && ' (QUÁ HẠN)'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {r.status === 'pending' && ['admin', 'dorm_manager'].includes(user?.role || '') && (
                        <>
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer touch-manipulation"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="px-3 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer touch-manipulation"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleCheckin(r.id)}
                          className="px-3 py-1 text-xs font-bold bg-[#0e3a7c] hover:bg-[#0a2754] text-white rounded-lg cursor-pointer touch-manipulation"
                        >
                          Đã về KTX
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer touch-manipulation"
                        title="Chỉnh sửa đơn"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, r.code)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer touch-manipulation"
                        title="Hủy / Xóa đơn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã đơn & Ngày gửi</th>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-3 py-3">Phòng / Lớp</th>
                <th className="px-3 py-3">Loại đơn</th>
                <th className="px-4 py-3">Lý do & SĐT Liên hệ</th>
                <th className="px-3 py-3">Thời gian đi & về dự kiến</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách đơn xin phép...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Không có đơn xin phép nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r, idx) => {
                  const t = typeMap[r.request_type] || typeMap.other;
                  const b = statusVariant(r.status);
                  const isOverdue = r.is_overdue;
                  const isNewest = idx === 0 && sortOrder === 'newest';

                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors ${isNewest ? 'bg-blue-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[#0e3a7c]">{r.code}</span>
                          {isNewest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                              Mới nhất
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {r.created_at ? `Gửi: ${r.created_at.substring(0, 16)}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{r.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.student_code}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        <div>{r.class_name}</div>
                        <div className="text-[11px] font-mono text-emerald-700">{r.room_code || '—'}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${t.color}`}>
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-800">{r.reason}</div>
                        <div className="text-[10px] text-slate-500">SĐT: {r.contact_phone}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        <div>Từ: {r.start_time?.substring(0, 16)}</div>
                        <div className={isOverdue ? 'text-red-700 font-bold' : ''}>
                          Về: {r.expected_end_time?.substring(0, 16)}
                          {isOverdue && ' (QUÁ HẠN)'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={isOverdue ? 'danger' : b.variant}>
                          {isOverdue ? 'Quá hạn trở lại' : b.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === 'pending' && ['admin', 'dorm_manager'].includes(user?.role || '') && (
                            <>
                              <button
                                onClick={() => handleApprove(r.id)}
                                className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                className="px-2 py-0.5 text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <button
                              onClick={() => handleCheckin(r.id)}
                              className="px-2 py-0.5 text-[11px] font-bold bg-[#0e3a7c] hover:bg-[#0a2754] text-white rounded cursor-pointer"
                            >
                              Đã về
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                            title="Chỉnh sửa đơn"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.code)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Hủy / Xóa đơn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Leave Request */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo đơn xin phép ký túc xá"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-slate-700">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">1. Tìm học sinh nội trú (*)</label>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Tìm kiếm trực tiếp
              </span>
            </div>

            {!selectedStudent ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (searchedStudents.length > 0) {
                          const st = searchedStudents[0];
                          setSelectedStudent(st);
                          setSearchedStudents([]);
                          if (st.parent_phone) {
                            setFormLeave((prev) => ({ ...prev, contact_phone: st.parent_phone || '' }));
                          }
                        }
                      }
                    }}
                    placeholder="Gõ tên hoặc Mã HS nội trú (kết quả hiển thị ngay thời gian thực)..."
                    className="w-full pl-9 pr-9 py-2.5 border-2 border-blue-400/60 focus:border-[#0e3a7c] rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none transition-all"
                  />
                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => setStudentSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isSearchingStudent ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#0e3a7c] border-t-transparent rounded-full animate-spin"></div>
                    Đang tìm học sinh nội trú thời gian thực...
                  </div>
                ) : searchedStudents.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="px-3 py-1.5 bg-slate-100 text-[11px] font-bold text-slate-600 flex justify-between items-center">
                      <span>
                        {studentSearch.trim()
                          ? `Kết quả học sinh phù hợp (${searchedStudents.length}):`
                          : `Gợi ý học sinh nội trú (${searchedStudents.length}):`}
                      </span>
                      <span className="text-blue-700 font-semibold">Nhấp hoặc nhấn Enter để chọn</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                      {searchedStudents.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            setSelectedStudent(st);
                            setSearchedStudents([]);
                            if (st.parent_phone) {
                              setFormLeave((prev) => ({ ...prev, contact_phone: st.parent_phone || '' }));
                            }
                          }}
                          className="p-2.5 hover:bg-blue-50/80 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0e3a7c] font-black text-xs flex items-center justify-center border border-blue-200">
                              {st.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 group-hover:text-[#0e3a7c]">
                                {st.full_name}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-[#0e3a7c]">{st.code}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">{st.class_name}</span>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 text-[10px] flex items-center gap-0.5">
                                  <BedDouble className="w-3 h-3" /> P{st.room_code || 'KTX'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] text-[#0e3a7c] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 group-hover:bg-[#0e3a7c] group-hover:text-white transition-all">
                            Chọn HS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : studentSearch.trim() ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Không tìm thấy học sinh nội trú nào với từ khóa "{studentSearch}"
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-black text-slate-900 text-sm">
                    {selectedStudent.full_name} ({selectedStudent.code})
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Lớp: <strong>{selectedStudent.class_name}</strong> • Phòng KTX:{' '}
                    <strong className="text-emerald-700">{selectedStudent.room_code || '---'}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentSearch('');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Đổi học sinh
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">2. Loại đơn xin phép (*)</label>
              <select
                value={formLeave.request_type}
                onChange={(e) => setFormLeave({ ...formLeave, request_type: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="home">Về quê cuối tuần</option>
                <option value="tutoring">Học thêm buổi tối</option>
                <option value="medical">Đi khám bệnh</option>
                <option value="personal">Việc riêng gia đình</option>
                <option value="other">Trường hợp khác</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SĐT liên hệ phụ huynh (*)</label>
              <input
                type="text"
                required
                value={formLeave.contact_phone}
                onChange={(e) => setFormLeave({ ...formLeave, contact_phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian ra ngoài (*)</label>
              <input
                type="datetime-local"
                required
                value={formLeave.start_time}
                onChange={(e) => setFormLeave({ ...formLeave, start_time: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian dự kiến trở lại (*)</label>
              <input
                type="datetime-local"
                required
                value={formLeave.expected_end_time}
                onChange={(e) => setFormLeave({ ...formLeave, expected_end_time: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lý do chi tiết (*)</label>
            <textarea
              required
              rows={3}
              value={formLeave.reason}
              onChange={(e) => setFormLeave({ ...formLeave, reason: e.target.value })}
              placeholder="Ghi rõ địa chỉ đến, người đón tiếp và cam kết trở lại đúng giờ quy định..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Nộp đơn xin phép
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Leave Request Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Chỉnh sửa đơn xin phép KTX"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Loại đơn xin phép (*)</label>
              <select
                value={editLeaveData.request_type}
                onChange={(e) => setEditLeaveData({ ...editLeaveData, request_type: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="home">Về quê cuối tuần</option>
                <option value="tutoring">Học thêm buổi tối</option>
                <option value="medical">Đi khám bệnh</option>
                <option value="personal">Việc riêng gia đình</option>
                <option value="other">Trường hợp khác</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái phê duyệt</label>
              <select
                value={editLeaveData.status}
                onChange={(e) => setEditLeaveData({ ...editLeaveData, status: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="pending">Chờ phê duyệt</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="rejected">Bị từ chối</option>
                <option value="completed">Đã về KTX an toàn</option>
                <option value="overdue">Quá hạn trở lại</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian ra ngoài (*)</label>
              <input
                type="datetime-local"
                required
                value={editLeaveData.start_time ? editLeaveData.start_time.replace(' ', 'T').slice(0, 16) : ''}
                onChange={(e) => setEditLeaveData({ ...editLeaveData, start_time: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thời gian dự kiến trở lại (*)</label>
              <input
                type="datetime-local"
                required
                value={editLeaveData.expected_end_time ? editLeaveData.expected_end_time.replace(' ', 'T').slice(0, 16) : ''}
                onChange={(e) => setEditLeaveData({ ...editLeaveData, expected_end_time: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SĐT liên hệ phụ huynh (*)</label>
              <input
                type="text"
                required
                value={editLeaveData.contact_phone}
                onChange={(e) => setEditLeaveData({ ...editLeaveData, contact_phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Xác nhận từ phụ huynh</label>
              <select
                value={editLeaveData.parent_confirmation}
                onChange={(e) => setEditLeaveData({ ...editLeaveData, parent_confirmation: parseInt(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={1}>Đã có xác nhận phụ huynh (Gọi điện / Zalo)</option>
                <option value={0}>Chưa xác nhận</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lý do chi tiết (*)</label>
            <textarea
              required
              rows={3}
              value={editLeaveData.reason}
              onChange={(e) => setEditLeaveData({ ...editLeaveData, reason: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal for Student Mobile Portal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Mã QR Cổng nộp đơn KTX dành cho Học sinh & Phụ huynh"
      >
        <div className="text-center p-2 space-y-4">
          <p className="text-xs text-slate-600">
            In hoặc gửi mã QR này cho học sinh / phụ huynh quét bằng điện thoại (Zalo / Camera) để nộp đơn xin phép KTX trực tuyến:
          </p>

          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-inner">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/xin-phep`)}`}
              alt="QR nộp đơn KTX"
              className="w-48 h-48 mx-auto object-contain rounded-lg"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left">
            <div className="text-slate-500 font-medium mb-1">Đường dẫn trực tiếp:</div>
            <div className="font-mono text-blue-700 font-bold break-all select-all">
              {`${window.location.origin}/xin-phep`}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/xin-phep`);
                alert('Đã sao chép link nộp đơn vào clipboard!');
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
              Mở trang nộp đơn
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};
