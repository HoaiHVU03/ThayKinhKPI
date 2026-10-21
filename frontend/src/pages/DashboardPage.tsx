// frontend/src/pages/DashboardPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { StatCard } from '../components/StatCard';
import {
  Users,
  GraduationCap,
  Building2,
  CalendarCheck,
  Award,
  AlertTriangle,
  FileText,
  Clock,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Activity,
  RefreshCw,
  Phone,
  BedDouble,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [realtime, setRealtime] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [absentFilter, setAbsentFilter] = useState<'all' | 'unexcused' | 'excused'>('all');
  const [absentSearch, setAbsentSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchRealtime = async () => {
    try {
      const data = await api.get('/dashboard/realtime-attendance');
      setRealtime(data);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching realtime attendance:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [statsData, chartsData, realtimeData] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/realtime-attendance'),
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setRealtime(realtimeData);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRealtime();
    }, 20000); // refresh every 20 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchData(), fetchRealtime()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0e3a7c] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu thời gian thực...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0e3a7c', '#d32027', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];

  const boardingPieData = [
    { name: 'Nội trú (Nam)', value: stats?.boarding_male || 335, color: '#0e3a7c' },
    { name: 'Nội trú (Nữ)', value: stats?.boarding_female || 364, color: '#d32027' },
    { name: 'Ngoại trú', value: stats?.total_day || 1181, color: '#94a3b8' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Clean Luxury Institutional Header */}
      <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Hệ thống đánh giá KPI nền nếp học sinh trường THPT chuyên Hùng Vương Phú Thọ
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Năm học 2026 - 2027
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Theo dõi 1.880 học sinh, 54 lớp chuyên, 120 phòng KTX và 11 chế độ sinh hoạt theo thời gian thực.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/class-attendance')}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#15468d] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 touch-action-manipulation"
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" /> Điểm danh lớp
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 touch-action-manipulation"
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" /> Điểm danh KTX
          </button>
          <button
            onClick={() => navigate('/kpi')}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 touch-action-manipulation"
          >
            <Award className="w-3.5 h-3.5 shrink-0" /> Sổ vi phạm
          </button>
        </div>
      </div>

      {/* Primary Key Stats Cards Grid (Đầy đủ Tổng HS, Nội trú & Ngoại trú) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5">
        <StatCard
          title="Tổng học sinh"
          value={stats?.total_students?.toLocaleString() || '1.880'}
          subValue="54 lớp chuyên toàn trường"
          icon={Users}
          color="navy"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Học sinh Nội trú"
          value={stats?.total_boarding?.toLocaleString() || '699'}
          subValue={`Nam: ${stats?.boarding_male || 335} • Nữ: ${stats?.boarding_female || 364}`}
          icon={Building2}
          color="blue"
          onClick={() => navigate('/dormitory')}
        />
        <StatCard
          title="Học sinh Ngoại trú"
          value={(stats?.total_day || 1181).toLocaleString()}
          subValue="1.181 HS đi về trong ngày"
          icon={GraduationCap}
          color="navy"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Điểm KPI TB"
          value={`${stats?.avg_kpi || '98.4'} đ`}
          subValue="Gốc: 100 điểm / HK1"
          icon={Award}
          color="gold"
          onClick={() => navigate('/reports')}
        />
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            title="Chuyên cần KTX"
            value={`${stats?.attendance_rate || '98.4'}%`}
            subValue="120 phòng KTX hôm nay"
            icon={CalendarCheck}
            color="green"
            onClick={() => navigate('/attendance')}
          />
        </div>
      </div>

      {/* Secondary Operational Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div
          onClick={() => navigate('/dormitory')}
          className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-2xs transition-all touch-action-manipulation"
        >
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase truncate">Phòng KTX sử dụng</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">120 / 120</div>
          <div className="text-[10px] text-slate-500 truncate">56 Nam • 64 Nữ</div>
        </div>

        <div
          onClick={() => navigate('/kpi')}
          className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 hover:border-red-400 cursor-pointer shadow-2xs transition-all touch-action-manipulation"
        >
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase truncate">Vi phạm hôm nay</div>
          <div className="text-lg sm:text-xl font-bold text-[#d32027] mt-0.5">{stats?.violations_today ?? 0} vụ</div>
          <div className="text-[10px] text-slate-500 truncate">Mã lỗi L01 — L10</div>
        </div>

        <div
          onClick={() => navigate('/leaves')}
          className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 cursor-pointer shadow-2xs transition-all touch-action-manipulation"
        >
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase truncate">Đơn phép chờ duyệt</div>
          <div className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5">{stats?.pending_leaves ?? 0} đơn</div>
          <div className="text-[10px] text-slate-500 truncate">Về quê, học thêm, ốm</div>
        </div>

        <div
          onClick={() => navigate('/attendance')}
          className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 hover:border-purple-400 cursor-pointer shadow-2xs transition-all touch-action-manipulation"
        >
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase truncate">Phòng chưa báo cáo</div>
          <div className="text-lg sm:text-xl font-bold text-slate-700 mt-0.5">{realtime?.summary?.unchecked_rooms ?? stats?.uninspected_rooms ?? 0} phòng</div>
          <div className="text-[10px] text-slate-500 truncate">Mốc chốt 22h15</div>
        </div>
      </div>

      {/* REALTIME DORMITORY ATTENDANCE OVERVIEW SECTION */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Realtime Header */}
        <div className="p-3.5 sm:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Điểm danh ký túc xá — {realtime?.session?.type_label || 'Ca Tối (22h00)'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Ngày {realtime?.session?.date || 'hôm nay'}
              </span>
              {lastUpdated && (
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  • {lastUpdated}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Giám sát 120 phòng nội trú (Tầng 2 — Tầng 6) • 699 học sinh nội trú toàn trường
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 touch-action-manipulation"
              title="Làm mới dữ liệu tức thì"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : 'text-slate-400'}`} />
              {isRefreshing ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button
              onClick={() => navigate('/attendance')}
              className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#15468d] text-white text-xs font-medium rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 touch-action-manipulation"
            >
              Sổ KTX <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Realtime Key Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2.5 sm:p-4 bg-slate-50/50 border-b border-slate-200">
          {/* Checked Rooms Progress */}
          <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Tiến độ báo cáo phòng
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {realtime?.summary?.room_completion_pct || 0}%
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              {realtime?.summary?.checked_rooms || 0}/{realtime?.summary?.total_rooms || 120} phòng • Còn {realtime?.summary?.unchecked_rooms || 0}
            </div>
          </div>

          {/* Present Count */}
          <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Có mặt tại phòng
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight mt-0.5">
              {realtime?.summary?.present || 0}
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
              {realtime?.summary?.attendance_rate || 0}% chuyên cần ({realtime?.summary?.total_boarding || 699} HS)
            </div>
          </div>

          {/* Excused Absence */}
          <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Vắng có phép
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {realtime?.summary?.excused || 0}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              Ốm đau, việc hiếu, có đơn
            </div>
          </div>

          {/* Unexcused Absence */}
          <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
              Vắng không phép
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight mt-0.5">
              {realtime?.summary?.unexcused || 0}
            </div>
            <div className="text-[10px] sm:text-[11px] text-rose-600 font-medium mt-0.5 truncate">
              {(realtime?.summary?.unexcused || 0) > 0 ? 'Cần GVCN gọi PH' : 'Không có vi phạm'}
            </div>
          </div>
        </div>

        {/* Floor Breakdown Progress (Tầng 2 đến Tầng 6) */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0e3a7c]" /> Tiến độ điểm danh chi tiết 5 tầng KTX (120 Phòng)
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Mỗi tầng 24 phòng tiêu chuẩn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {realtime?.floor_breakdown?.map((fl: any) => {
              const pct = fl.total_rooms > 0 ? Math.round((fl.checked_rooms / fl.total_rooms) * 100) : 0;
              const isDone = fl.checked_rooms >= fl.total_rooms;
              return (
                <div
                  key={fl.floor}
                  onClick={() => navigate('/attendance')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                      : 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs text-slate-900">{fl.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isDone ? 'Hoàn thành' : `Chờ ${fl.total_rooms - fl.checked_rooms} P`}
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-slate-500 mb-2">{fl.zone}</div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Phòng:</span>
                      <strong className="text-slate-800">{fl.checked_rooms}/{fl.total_rooms} ({pct}%)</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-600' : 'bg-amber-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] pt-1 text-slate-500 border-t border-slate-200/60 mt-1.5">
                      <span className="text-emerald-700 font-semibold">Có mặt: {fl.present}</span>
                      <span className={fl.absent > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>
                        Vắng: {fl.absent}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Absent Students Live List Table */}
        <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Danh sách học sinh vắng mặt trong ca
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                {realtime?.absent_students?.length || 0} HS
              </span>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm phòng, tên HS..."
                  value={absentSearch}
                  onChange={(e) => setAbsentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
                />
              </div>

              <div className="flex items-center p-0.5 bg-slate-200 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setAbsentFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    absentFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({realtime?.absent_students?.length || 0})
                </button>
                <button
                  onClick={() => setAbsentFilter('unexcused')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    absentFilter === 'unexcused'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-700 hover:text-red-900'
                  }`}
                >
                  Không phép ({realtime?.absent_students?.filter((a: any) => a.status === 'unexcused_absence').length || 0})
                </button>
                <button
                  onClick={() => setAbsentFilter('excused')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    absentFilter === 'excused'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  Có phép ({realtime?.absent_students?.filter((a: any) => a.status === 'excused_absence').length || 0})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Phòng</th>
                    <th className="py-2.5 px-3">Họ và tên học sinh</th>
                    <th className="py-2.5 px-3">Lớp chuyên</th>
                    <th className="py-2.5 px-3">Trạng thái vắng</th>
                    <th className="py-2.5 px-3">Lý do / Ghi chú quản sinh</th>
                    <th className="py-2.5 px-3">SĐT Phụ huynh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filtered = (realtime?.absent_students || []).filter((st: any) => {
                      if (absentFilter === 'unexcused' && st.status !== 'unexcused_absence') return false;
                      if (absentFilter === 'excused' && st.status !== 'excused_absence') return false;
                      if (absentSearch) {
                        const q = absentSearch.toLowerCase();
                        return (
                          st.student_name?.toLowerCase().includes(q) ||
                          st.student_code?.toLowerCase().includes(q) ||
                          st.room_code?.toLowerCase().includes(q) ||
                          st.class_name?.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                            {absentSearch
                              ? 'Không tìm thấy học sinh nào phù hợp từ khóa'
                              : 'Không có học sinh nào thuộc danh mục lọc này'}
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((st: any) => {
                      const isUnexcused = st.status === 'unexcused_absence';
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-800">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[11px] border border-slate-200">
                              {st.room_code}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{st.student_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{st.student_code}</div>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-700">{st.class_name}</td>
                          <td className="py-2 px-3">
                            {isUnexcused ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <XCircle className="w-3 h-3 text-red-600" /> Vắng không phép
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Vắng có phép
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 max-w-xs truncate">
                            {st.notes || (isUnexcused ? 'Chưa rõ lý do — Đang kiểm tra' : 'Có phép')}
                          </td>
                          <td className="py-2 px-3">
                            {st.parent_phone ? (
                              <a
                                href={`tel:${st.parent_phone}`}
                                className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline"
                              >
                                <Phone className="w-3 h-3" /> {st.parent_phone}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Chưa có SĐT</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>



      {/* Main Charts Row 1: Grade Distribution & Boarding vs Day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quy mô học sinh theo Khối lớp</h3>
              <p className="text-xs text-slate-500">Tổng số học sinh và số lượng nội trú 3 khối</p>
            </div>
            <button
              onClick={() => navigate('/classes')}
              className="text-xs font-semibold text-[#0e3a7c] hover:underline flex items-center gap-1"
            >
              Chi tiết 54 lớp <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.grade_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="students" name="Tổng số học sinh" fill="#0e3a7c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="boarding" name="Học sinh Nội trú" fill="#d32027" radius={[4, 4, 0, 0]} />
                <Bar dataKey="day" name="Học sinh Ngoại trú" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Boarding vs Day Pie Chart */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tỷ lệ Nội trú & Ngoại trú</h3>
              <p className="text-xs text-slate-500">699 Nội trú (37%) / 1.181 Ngoại trú</p>
            </div>
          </div>

          <div className="h-64 flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={boardingPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {boardingPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} HS`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-1 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0e3a7c]"></span> Nam NT (335)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#d32027]"></span> Nữ NT (364)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Ngoại trú (1.181)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: L01 - L10 Violations Distribution & KPI Classification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* L01 - L10 Violations */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Phân bố vi phạm theo 10 Mã Lỗi (L01 — L10)</h3>
              <p className="text-xs text-slate-500">Số lượng biên bản ghi nhận trong học kỳ hiện tại</p>
            </div>
            <button
              onClick={() => navigate('/kpi')}
              className="text-xs font-semibold text-[#0e3a7c] hover:underline flex items-center gap-1"
            >
              Mở sổ vi phạm <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.violations_by_rule || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any, _name: any, props: any) => [
                    `${value} vụ (-${props?.payload?.deduction_points ?? 0}đ/vụ)`,
                    props?.payload?.name ?? '',
                  ]}
                />
                <Bar dataKey="count" name="Số vi phạm" fill="#d32027" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Floor Occupancy in Dormitory */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Công suất ký túc xá</h3>
              <p className="text-xs text-slate-500">Tầng 2 đến tầng 6 (Tổng 120 phòng)</p>
            </div>
            <button
              onClick={() => navigate('/dormitory')}
              className="text-xs font-semibold text-[#0e3a7c] hover:underline flex items-center gap-1"
            >
              Xem sơ đồ <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {charts?.floor_stats?.map((fl: any) => {
              const pct = fl.capacity > 0 ? Math.round((fl.occupancy / fl.capacity) * 100) : 0;
              return (
                <div key={fl.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{fl.name} ({fl.gender_zone})</span>
                    <span className="font-bold text-[#0e3a7c]">{fl.occupancy}/{fl.capacity} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 90 ? 'bg-[#d32027]' : 'bg-[#0e3a7c]'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Class Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Highest KPI Classes */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Top 5 Lớp dẫn đầu thi đua KPI
            </h3>
            <span className="text-xs text-slate-400">Điểm tối đa 100</span>
          </div>
          <div className="divide-y divide-slate-100">
            {charts?.top_classes?.map((c: any, idx: number) => (
              <div key={c.name} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{c.name}</span>
                </div>
                <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {c.avg_score} điểm
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom 5 Classes Needing Focus */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Các lớp cần tập trung chấn chỉnh nền nếp
            </h3>
            <span className="text-xs text-slate-400">Số vụ vi phạm</span>
          </div>
          <div className="divide-y divide-slate-100">
            {charts?.bottom_classes?.map((c: any, idx: number) => (
              <div key={c.name} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#d32027] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {c.avg_score} điểm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
