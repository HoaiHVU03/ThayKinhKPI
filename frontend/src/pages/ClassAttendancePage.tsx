// frontend/src/pages/ClassAttendancePage.tsx
// Điểm danh học sinh theo lớp đầu giờ: Ghi nhận thời gian & Thống kê theo ngày, tuần, tháng (Từng lớp, Toàn khối, Toàn trường)

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSchoolSettings } from '../context/SchoolSettingsContext';
import { Modal } from '../components/Modal';
import * as XLSX from 'xlsx';
import {
  CalendarCheck2,
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Check,
  Search,
  Filter,
  GraduationCap,
  RefreshCw,
  Phone,
  Printer,
  FileSpreadsheet,
  ChevronRight,
  ShieldAlert,
  Building2,
  Calendar,
  Layers,
  ChevronLeft,
  BarChart3,
  Award,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

export const ClassAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { settings: schoolSettings } = useSchoolSettings();

  const isStudent = user?.role === 'student';
  const canTakeAttendance = ['admin', 'homeroom_teacher', 'class_cadre'].includes(user?.role || '');
  const canCreateViolation = ['admin', 'dorm_manager', 'homeroom_teacher'].includes(user?.role || '');

  // Selected date for Daily view & Roll call
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'classes' | 'statistics' | 'absent_list' | 'report'>('classes');

  // Classes session data (Daily)
  const [loading, setLoading] = useState<boolean>(true);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null);

  // Filters for classes list (Tab 1)
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'unrecorded'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Roll-call Modal state
  const [rollCallModalOpen, setRollCallModalOpen] = useState<boolean>(false);
  const [activeClassId, setActiveClassId] = useState<number | null>(null);
  const [activeClassInfo, setActiveClassInfo] = useState<any>(null);
  const [rollCallStudents, setRollCallStudents] = useState<any[]>([]);
  const [classNotes, setClassNotes] = useState<string>('');
  const [shiftName, setShiftName] = useState<string>('Đầu giờ sáng');
  const [sessionTime, setSessionTime] = useState<string>('07:00');
  const [rollCallLoading, setRollCallLoading] = useState<boolean>(false);
  const [savingRollCall, setSavingRollCall] = useState<boolean>(false);

  // Absent list state (Tab 3)
  const [absentStudents, setAbsentStudents] = useState<any[]>([]);
  const [absentFilter, setAbsentFilter] = useState<string>('all');
  const [absentLoading, setAbsentLoading] = useState<boolean>(false);

  // Dynamic KPI rules from database
  const [kpiRules, setKpiRules] = useState<any[]>([]);
  const [ruleModalStudent, setRuleModalStudent] = useState<any | null>(null);
  const [selectedCustomRule, setSelectedCustomRule] = useState<string>('L01');

  // =========================================================================
  // MULTI-DIMENSIONAL STATISTICS STATE (Tab 2: Ngày, Tuần, Tháng x Lớp, Khối, Trường)
  // =========================================================================
  const [statPeriodType, setStatPeriodType] = useState<'day' | 'week' | 'month'>('week');
  const [statScope, setStatScope] = useState<'school' | 'grade' | 'class'>('school');
  const [statGrade, setStatGrade] = useState<string>('all');
  const [statClassId, setStatClassId] = useState<number | 'all'>('all');
  const [statDate, setStatDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Fetch classes and daily statistics for selected date
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/class-attendance/sessions', {
        date: selectedDate,
        grade: gradeFilter !== 'all' ? gradeFilter : undefined,
        search: searchTerm || undefined,
      });
      setClassesData(res.items || []);
      setDailyStats(res.statistics || null);
    } catch (err: any) {
      console.error('Error fetching class attendance sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch absent students list
  const fetchAbsentList = async () => {
    setAbsentLoading(true);
    try {
      const res: any = await api.get('/class-attendance/absent-list', {
        date: selectedDate,
        status: absentFilter !== 'all' ? absentFilter : undefined,
      });
      setAbsentStudents(res.items || []);
    } catch (err: any) {
      console.error('Error fetching absent list:', err);
    } finally {
      setAbsentLoading(false);
    }
  };

  // Fetch multi-dimensional statistics (Day, Week, Month x School, Grade, Class)
  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const res: any = await api.get('/class-attendance/statistics', {
        period_type: statPeriodType,
        date: statDate,
        scope: statScope,
        grade: statGrade !== 'all' ? statGrade : undefined,
        class_id: statClassId !== 'all' ? statClassId : undefined,
      });
      setStatsData(res);
    } catch (err: any) {
      console.error('Error fetching attendance statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedDate, gradeFilter, searchTerm]);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res: any = await api.get('/kpi/rules');
        setKpiRules(res || []);
      } catch (err) {
        console.error('Error fetching KPI rules:', err);
      }
    };
    fetchRules();
  }, []);

  useEffect(() => {
    if (activeTab === 'absent_list') {
      fetchAbsentList();
    }
  }, [activeTab, selectedDate, absentFilter]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab, statPeriodType, statScope, statGrade, statClassId, statDate]);

  // Open Roll Call Modal for a specific class
  const handleOpenRollCall = async (classId: number) => {
    setActiveClassId(classId);
    setRollCallModalOpen(true);
    setRollCallLoading(true);
    try {
      const res: any = await api.get(`/class-attendance/classes/${classId}`, {
        date: selectedDate,
      });
      setActiveClassInfo(res.class);
      setClassNotes(res.session?.notes || '');
      setShiftName(res.session?.shift_name || 'Đầu giờ sáng');
      // If session already has recorded time, use it; otherwise use current local time
      const currentTimeStr = new Date().toTimeString().slice(0, 5);
      setSessionTime(res.session?.session_time || currentTimeStr);
      setRollCallStudents(
        (res.students || []).map((s: any) => ({
          ...s,
          currentStatus: s.attendance_status || 'present',
          currentNote: s.attendance_note || '',
        }))
      );
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải danh sách học sinh của lớp');
      setRollCallModalOpen(false);
    } finally {
      setRollCallLoading(false);
    }
  };

  // Mark 1 student status in roll call modal
  const handleSetStudentStatus = (studentId: number, status: string) => {
    setRollCallStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, currentStatus: status } : s))
    );
  };

  // Set student note
  const handleSetStudentNote = (studentId: number, note: string) => {
    setRollCallStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, currentNote: note } : s))
    );
  };

  // Quick mark all present inside modal
  const handleModalMarkAllPresent = () => {
    setRollCallStudents((prev) =>
      prev.map((s) => ({ ...s, currentStatus: 'present', currentNote: '' }))
    );
  };

  // Save roll call submit with exact recorded time
  const handleSaveRollCall = async () => {
    if (!activeClassId) return;
    setSavingRollCall(true);
    try {
      const records = rollCallStudents.map((s) => ({
        student_id: s.id,
        status: s.currentStatus,
        note: s.currentNote,
      }));

      const res: any = await api.post(`/class-attendance/classes/${activeClassId}/save`, {
        session_date: selectedDate,
        session_time: sessionTime || new Date().toTimeString().slice(0, 5),
        shift_name: shiftName,
        notes: classNotes,
        records,
      });

      alert(res?.message || `Đã chốt sổ điểm danh đầu giờ cho lớp ${activeClassInfo?.name || ''} lúc ${sessionTime}!`);
      setRollCallModalOpen(false);
      fetchSessions();
      if (activeTab === 'statistics') fetchStatistics();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu điểm danh');
    } finally {
      setSavingRollCall(false);
    }
  };

  // 1-touch mark all present from table
  const handleQuickMarkAllPresent = async (classId: number, className: string) => {
    const curTime = new Date().toTimeString().slice(0, 5);
    if (!confirm(`Xác nhận đánh dấu 100% học sinh lớp ${className} có mặt đầy đủ đầu giờ lúc ${curTime} (ngày ${selectedDate})?`)) {
      return;
    }
    try {
      const res: any = await api.post(`/class-attendance/classes/${classId}/mark-all-present`, {
        session_date: selectedDate,
        session_time: curTime,
      });
      alert(res?.message || `Đã chốt nhanh 1 CHẠM — ĐỦ MẶT cho lớp ${className} lúc ${curTime}!`);
      fetchSessions();
      if (activeTab === 'statistics') fetchStatistics();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi nhận');
    }
  };

  // L01 rule from DB (Đi học muộn, Vắng không phép)
  const l01Rule = useMemo(() => {
    return kpiRules.find((r) => r.code === 'L01') || {
      code: 'L01',
      name: 'Đi học muộn, Vắng không phép (sau 7h00)',
      deduction_points: 1,
    };
  }, [kpiRules]);

  // Specific rule for absence if exists, otherwise L01
  const absenceRule = useMemo(() => {
    const r = kpiRules.find((r) => r.code === 'L01' || r.name?.toLowerCase().includes('vắng'));
    return r || l01Rule;
  }, [kpiRules, l01Rule]);

  // 1-touch create violation ticket from absent/late record linked directly to KPI rules
  const handleCreateViolation = async (student: any, ruleCode: string = 'L01') => {
    const rule = kpiRules.find((r) => r.code === ruleCode) || (ruleCode === 'L01' ? l01Rule : { code: ruleCode, name: 'Vi phạm nề nếp', deduction_points: 1 });
    const ruleName = `${rule.code} - ${rule.name}`;
    const pts = rule.deduction_points ?? 1;

    if (!confirm(`Lập biên bản vi phạm nề nếp "${ruleName}" (Trừ ${pts} điểm KPI) cho học sinh ${student.student_name || student.full_name}?`)) {
      return;
    }
    try {
      const res: any = await api.post('/class-attendance/create-violation', {
        student_id: student.student_id || student.id,
        rule_code: rule.code,
        date: selectedDate,
        note: student.note || student.currentNote || (student.status === 'late' ? 'Đi học muộn đầu giờ' : 'Vắng mặt không phép đầu giờ'),
      });
      alert(res?.message || `Đã lập biên bản vi phạm nề nếp ${rule.code} (-${pts} điểm) thành công! Điểm KPI của học sinh đã được tự động trừ theo quy chế.`);
      if (activeTab === 'absent_list') fetchAbsentList();
      setRuleModalStudent(null);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lập biên bản');
    }
  };

  // Filtered classes list for Tab 1
  const filteredClasses = useMemo(() => {
    return classesData.filter((c) => {
      if (gradeFilter !== 'all' && String(c.grade_level) !== gradeFilter) return false;
      if (statusFilter === 'completed' && c.session_status !== 'completed') return false;
      if (statusFilter === 'unrecorded' && c.session_status === 'completed') return false;
      return true;
    });
  }, [classesData, gradeFilter, statusFilter]);

  // Export Excel handler
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary / Ranking of classes
      const sheet1Data = (statsData?.class_breakdown || classesData).map((c: any, idx: number) => ({
        'STT': idx + 1,
        'Mã lớp': c.class_code || c.code,
        'Tên lớp chuyên': c.class_name || c.name,
        'Khối': c.grade_level,
        'Phòng học': c.room_location || 'Nhà A',
        'Giáo viên chủ nhiệm': c.teacher_name || 'Chưa phân công',
        'SĐT GVCN': c.teacher_phone || '',
        'Sĩ số': c.total_students,
        'Số buổi điểm danh': c.sessions_count ?? (c.session_status === 'completed' ? 1 : 0),
        'Có mặt': c.present_count,
        'Có phép': c.excused_count,
        'Không phép': c.unexcused_count,
        'Đi muộn': c.late_count,
        'Tỷ lệ chuyên cần (%)': `${c.attendance_rate || 0}%`,
        'Thời gian ghi nhận': c.last_session_time || c.session_time || '07:00',
      }));

      const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
      XLSX.utils.book_append_sheet(wb, ws1, 'Thống kê theo lớp');

      // Sheet 2: Absent / Late list
      if (absentStudents && absentStudents.length > 0) {
        const sheet2Data = absentStudents.map((s: any, idx: number) => ({
          'STT': idx + 1,
          'Mã học sinh': s.student_code,
          'Họ và tên': s.student_name,
          'Lớp': s.class_name,
          'Khối': s.grade_level,
          'Trạng thái': s.status === 'unexcused_absence' ? 'Không phép' : s.status === 'excused_absence' ? 'Có phép' : 'Đi muộn',
          'Thời gian ghi nhận': s.recorded_at ? new Date(s.recorded_at).toLocaleTimeString('vi-VN') : '',
          'Ghi chú / Lý do': s.note || '',
          'Phụ huynh': s.parent_name || '',
          'SĐT Phụ huynh': s.parent_phone || '',
          'GVCN': s.teacher_name || '',
        }));
        const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
        XLSX.utils.book_append_sheet(wb, ws2, 'Học sinh vắng muộn');
      }

      const fileName = `DiemDanhDauGio_${statPeriodType}_${statScope}_${statDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Lỗi khi xuất tệp Excel');
    }
  };

  // Helper for navigating weeks / months
  const handleShiftDate = (direction: -1 | 1) => {
    const cur = new Date(statDate);
    if (statPeriodType === 'day') {
      cur.setDate(cur.getDate() + direction);
    } else if (statPeriodType === 'week') {
      cur.setDate(cur.getDate() + direction * 7);
    } else if (statPeriodType === 'month') {
      cur.setMonth(cur.getMonth() + direction);
    }
    setStatDate(cur.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            Hệ thống nề nếp chuyên cần 54 lớp chuyên
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#0e3a7c] shrink-0" />
            <span>Điểm danh học sinh theo lớp đầu giờ</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Ghi nhận thời gian điểm danh chính xác • Thống kê chuyên cần Ngày, Tuần, Tháng (Từng lớp, Khối, Toàn trường)
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              fetchSessions();
              if (activeTab === 'statistics') fetchStatistics();
              if (activeTab === 'absent_list') fetchAbsentList();
            }}
            className="p-2 sm:p-2.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer touch-action-manipulation shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin text-[#0e3a7c]' : ''}`} />
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all touch-action-manipulation"
            title="Xuất bảng điểm danh 54 lớp ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className="flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all touch-action-manipulation"
            title="In phiếu tổng hợp nề nếp chuyên cần khổ A4"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>In mẫu A4</span>
          </button>
        </div>
      </div>

      {/* Metric Ribbon Summary (Real-time for selected Date) */}
      {dailyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">Tiến độ chốt sổ</span>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {dailyStats.completed_classes} <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {dailyStats.total_classes} lớp</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#0e3a7c] h-full rounded-full transition-all"
                style={{ width: `${(dailyStats.completed_classes / Math.max(dailyStats.total_classes, 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">Sĩ số học sinh</span>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {dailyStats.total_students} <span className="text-[10px] sm:text-xs font-normal text-slate-400">HS</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500 mt-2 block truncate">54 lớp chuyên</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">Có mặt đầu giờ</span>
            <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
              {dailyStats.present_count} <span className="text-[10px] sm:text-xs font-bold text-emerald-600">({dailyStats.attendance_rate}%)</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 font-medium mt-2 block truncate">Chuyên cần cao</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">Nghỉ có phép</span>
            <div className="text-base sm:text-lg font-black text-amber-700 mt-0.5">
              {dailyStats.excused_count} <span className="text-[10px] sm:text-xs font-normal text-slate-400">HS</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500 mt-2 block truncate">Đã có đơn PH</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">Vắng không phép</span>
            <div className="text-base sm:text-lg font-black text-rose-700 mt-0.5">
              {dailyStats.unexcused_count} <span className="text-[10px] sm:text-xs font-normal text-slate-400">HS</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-rose-600 font-semibold mt-2 block truncate">Cần GVCN gọi</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block">Đi học muộn</span>
            <div className="text-base sm:text-lg font-black text-purple-700 mt-0.5">
              {dailyStats.late_count} <span className="text-[10px] sm:text-xs font-normal text-slate-400">HS</span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-500 mt-2 block truncate">Sau 07h00</span>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 touch-action-manipulation ${
              activeTab === 'classes'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 shrink-0" />
            <span><span className="hidden sm:inline">1. DS 54 lớp & </span>Điểm danh</span>
          </button>

          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 touch-action-manipulation ${
              activeTab === 'statistics'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span><span className="hidden sm:inline">2. </span>Thống kê Ngày/Tuần/Tháng</span>
          </button>

          <button
            onClick={() => setActiveTab('absent_list')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 touch-action-manipulation ${
              activeTab === 'absent_list'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span><span className="hidden sm:inline">3. </span>Vắng & Muộn</span>
            {dailyStats?.unexcused_count > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-black">
                {dailyStats.unexcused_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 touch-action-manipulation ${
              activeTab === 'report'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span><span className="hidden sm:inline">4. </span>Phiếu A4</span>
          </button>
        </div>

        {/* Date Selector for Tab 1 / Tab 3 */}
        {activeTab !== 'statistics' && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs self-start sm:self-auto shrink-0">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0e3a7c]" /> Ngày:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-none font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              className="text-[11px] font-bold text-blue-700 hover:underline px-1.5 py-0.5 rounded bg-blue-50 cursor-pointer touch-action-manipulation"
            >
              Hôm nay
            </button>
          </div>
        )}
      </div>


      {/* =================================================================== */}
      {/* TAB 1: DANH SÁCH 54 LỚP & GHI NHẬN ĐIỂM DANH (CÓ THỜI GIAN)        */}
      {/* =================================================================== */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
              <span className="font-bold text-slate-600 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Khối:
              </span>
              {['all', '10', '11', '12'].map((g) => (
                <button
                  key={g}
                  onClick={() => setGradeFilter(g)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 touch-action-manipulation ${
                    gradeFilter === g
                      ? 'bg-[#0e3a7c] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {g === 'all' ? 'Tất cả' : `Khối ${g}`}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block shrink-0"></div>

              <span className="font-bold text-slate-600 shrink-0">Trạng thái:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 touch-action-manipulation ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 touch-action-manipulation ${
                  statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Đã chốt
              </button>
              <button
                onClick={() => setStatusFilter('unrecorded')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 touch-action-manipulation ${
                  statusFilter === 'unrecorded' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Chưa chốt
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm lớp hoặc tên GVCN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Dedicated Mobile Cards for 54 Classes (block md:hidden) */}
          <div className="block md:hidden space-y-2.5">
            {loading ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0e3a7c]" />
                Đang tải danh sách điểm danh 54 lớp...
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                Không tìm thấy lớp học nào phù hợp với bộ lọc
              </div>
            ) : (
              filteredClasses.map((c) => {
                const isCompleted = c.session_status === 'completed';
                const rate = c.total_students > 0 ? Math.round((c.present_count / c.total_students) * 100) : 0;
                return (
                  <div key={c.class_id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{c.class_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {c.room_location || 'Nhà A'} • GVCN: {c.teacher_name || 'Chưa phân công'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-emerald-600" /> {c.session_time || '07:00'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Chưa chốt sổ
                          </span>
                        )}
                        <div className="text-xs font-black text-slate-900 mt-1">
                          {c.total_students} HS • <span className={rate >= 95 ? 'text-emerald-700' : 'text-blue-700'}>{rate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance metrics pill row */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Có mặt</span>
                        <strong className="text-emerald-700 font-black text-xs">{isCompleted ? c.present_count : '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Có phép</span>
                        <strong className="text-amber-800 font-bold text-xs">{isCompleted ? c.excused_count : '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">K.phép</span>
                        <strong className="text-rose-700 font-bold text-xs">{isCompleted ? c.unexcused_count : '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Muộn</span>
                        <strong className="text-purple-700 font-bold text-xs">{isCompleted ? c.late_count : '-'}</strong>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {canTakeAttendance ? (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenRollCall(c.class_id)}
                          className="flex-1 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg text-xs shadow-2xs flex items-center justify-center gap-1 cursor-pointer touch-action-manipulation"
                        >
                          Điểm danh <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleQuickMarkAllPresent(c.class_id, c.class_name)}
                          className="flex-1 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer touch-action-manipulation"
                        >
                          <Check className="w-3.5 h-3.5" /> 1 chạm đủ
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-1.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1"><UserCheck className="w-3 h-3 text-[#0e3a7c]" /> Học sinh: Xem kết quả chuyên cần</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Classes Table (hidden md:block) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Lớp chuyên</th>
                    <th className="px-3 py-3">Phòng học</th>
                    <th className="px-3 py-3">Giáo viên chủ nhiệm</th>
                    <th className="px-3 py-3 text-center">Sĩ số</th>
                    <th className="px-3 py-3 text-center text-emerald-700">Có mặt</th>
                    <th className="px-3 py-3 text-center text-amber-700">Có phép</th>
                    <th className="px-3 py-3 text-center text-rose-700">Không phép</th>
                    <th className="px-3 py-3 text-center text-purple-700">Muộn</th>
                    <th className="px-3 py-3 text-center">Chuyên cần</th>
                    <th className="px-3 py-3 text-center">Thời gian điểm danh</th>
                    <th className="px-4 py-3 text-right">Thao tác ghi nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0e3a7c]" />
                        Đang tải danh sách điểm danh 54 lớp...
                      </td>
                    </tr>
                  ) : filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                        Không tìm thấy lớp học nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((c) => {
                      const isCompleted = c.session_status === 'completed';
                      const rate = c.total_students > 0 ? Math.round((c.present_count / c.total_students) * 100) : 0;
                      return (
                        <tr key={c.class_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-900">{c.class_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Mã: {c.class_code} • Khối {c.grade_level}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-slate-700">
                            {c.room_location || 'Nhà A'}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-800">{c.teacher_name || 'Chưa phân công'}</div>
                            {c.teacher_phone && (
                              <a
                                href={`tel:${c.teacher_phone}`}
                                className="text-[10px] text-slate-500 hover:text-[#0e3a7c] flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-2.5 h-2.5" /> {c.teacher_phone}
                              </a>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-900">
                            {c.total_students}
                          </td>
                          <td className="px-3 py-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40">
                            {isCompleted ? c.present_count : '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-amber-800 bg-amber-50/30">
                            {isCompleted ? (c.excused_count > 0 ? c.excused_count : 0) : '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-rose-700 bg-rose-50/30">
                            {isCompleted ? (c.unexcused_count > 0 ? c.unexcused_count : 0) : '-'}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-purple-700 bg-purple-50/30">
                            {isCompleted ? (c.late_count > 0 ? c.late_count : 0) : '-'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {isCompleted ? (
                              <div className="space-y-1">
                                <span className={`font-black text-xs ${rate >= 95 ? 'text-emerald-700' : rate >= 90 ? 'text-blue-700' : 'text-amber-700'}`}>
                                  {rate}%
                                </span>
                                <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${rate >= 95 ? 'bg-emerald-500' : rate >= 90 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                    style={{ width: `${rate}%` }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          {/* Thời gian điểm danh column */}
                          <td className="px-3 py-3 text-center">
                            {isCompleted ? (
                              <div className="flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  {c.session_time || '07:00'}
                                </span>
                                {c.updated_at && (
                                  <span className="text-[9px] text-slate-400 mt-0.5">
                                    Chốt: {new Date(c.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 mx-auto w-fit">
                                <Clock className="w-2.5 h-2.5 text-amber-500" /> Dự kiến 07:00
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canTakeAttendance ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenRollCall(c.class_id)}
                                  className="px-2.5 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  Điểm danh
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleQuickMarkAllPresent(c.class_id, c.class_name)}
                                  className="px-2 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-lg text-xs cursor-pointer transition-all"
                                  title="Đánh dấu 100% học sinh có mặt chỉ 1 click"
                                >
                                  1 chạm đủ
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium italic">Chỉ xem</span>
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
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: TRUNG TÂM THỐNG KÊ ĐA CHIỀU (NGÀY, TUẦN, THÁNG x LỚP, KHỐI, TRƯỜNG) */}
      {/* =================================================================== */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* CONTROL STRIP: BỘ LỌC THỜI GIAN & PHẠM VI */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            {/* Row 1: Time Dimension */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-4 h-4 text-[#0e3a7c]" /> Thời gian:
                </span>
                <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setStatPeriodType('day')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap touch-action-manipulation ${
                      statPeriodType === 'day' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ngày
                  </button>
                  <button
                    onClick={() => setStatPeriodType('week')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap touch-action-manipulation ${
                      statPeriodType === 'week' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    onClick={() => setStatPeriodType('month')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap touch-action-manipulation ${
                      statPeriodType === 'month' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tháng
                  </button>
                </div>

                {/* Quick Nav for Day / Week / Month */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => handleShiftDate(-1)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer touch-action-manipulation"
                    title="Lùi về trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type={statPeriodType === 'month' ? 'month' : 'date'}
                    value={statPeriodType === 'month' ? statDate.slice(0, 7) : statDate}
                    onChange={(e) => {
                      if (statPeriodType === 'month') {
                        setStatDate(`${e.target.value}-01`);
                      } else {
                        setStatDate(e.target.value);
                      }
                    }}
                    className="border-none font-bold text-slate-800 bg-transparent text-xs cursor-pointer focus:outline-none"
                  />
                  <button
                    onClick={() => handleShiftDate(1)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer touch-action-manipulation"
                    title="Tiến về sau"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setStatDate(new Date().toISOString().slice(0, 10))}
                  className="px-2.5 py-1 text-xs font-bold text-[#0e3a7c] bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer touch-action-manipulation"
                >
                  {statPeriodType === 'day' ? 'Hôm nay' : statPeriodType === 'week' ? 'Tuần này' : 'Tháng này'}
                </button>
              </div>

              {/* Time Label Badge */}
              <div className="text-[11px] sm:text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                📅 {statsData?.period?.label || 'Đang tải dữ liệu...'}
              </div>
            </div>

            {/* Row 2: Scope Dimension (Toàn trường / Toàn khối / Từng lớp) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 shrink-0">
                  <Building2 className="w-4 h-4 text-emerald-700" /> Phạm vi:
                </span>

                {/* Scope selector buttons */}
                <button
                  onClick={() => {
                    setStatScope('school');
                    setStatGrade('all');
                    setStatClassId('all');
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 touch-action-manipulation ${
                    statScope === 'school' && statGrade === 'all' && statClassId === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Toàn trường (54 lớp)
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <span className="font-semibold text-slate-500 shrink-0">Khối:</span>
                {['10', '11', '12'].map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setStatScope('grade');
                      setStatGrade(g);
                      setStatClassId('all');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 touch-action-manipulation ${
                      statScope === 'grade' && statGrade === g
                        ? 'bg-[#0e3a7c] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Khối {g}
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
                  <span className="font-semibold text-slate-500 shrink-0">Lớp:</span>
                  <select
                    value={statClassId}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                      setStatClassId(val);
                      if (val !== 'all') {
                        setStatScope('class');
                      } else {
                        setStatScope('school');
                      }
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <option value="all">-- Chọn 1 lớp trong 54 lớp --</option>
                  {classesData.map((c) => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_name} (Khối {c.grade_level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-slate-500 text-[11px]">
              Đang xem: <strong className="text-slate-900">{statsData?.summary?.total_classes || 0} lớp</strong> • <strong className="text-slate-900">{statsData?.summary?.total_students || 0} học sinh</strong>
            </div>
          </div>
        </div>

          {/* KPI METRIC STRIP FOR SELECTED PERIOD & SCOPE */}
          {statsData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Số lớp theo dõi</span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {statsData.summary.total_classes} <span className="text-xs font-normal text-slate-400">lớp</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">
                  Đã chốt: {statsData.summary.total_sessions_recorded} lượt
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Tỷ lệ chuyên cần</span>
                <div className="text-lg font-black text-emerald-700 mt-0.5">
                  {statsData.summary.attendance_rate}%
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${statsData.summary.attendance_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Tổng lượt có mặt</span>
                <div className="text-lg font-black text-emerald-800 mt-0.5">
                  {statsData.summary.total_present}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium mt-2 block">Tham gia học tập đầy đủ</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Nghỉ có phép</span>
                <div className="text-lg font-black text-amber-700 mt-0.5">
                  {statsData.summary.total_excused} <span className="text-xs font-normal text-slate-400">lượt</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Đơn phép hợp lệ</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Nghỉ không phép</span>
                <div className="text-lg font-black text-rose-700 mt-0.5">
                  {statsData.summary.total_unexcused} <span className="text-xs font-normal text-slate-400">lượt</span>
                </div>
                <span className="text-[10px] text-rose-600 font-semibold mt-2 block">Cần trừ KPI nề nếp</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Đi học muộn</span>
                <div className="text-lg font-black text-purple-700 mt-0.5">
                  {statsData.summary.total_late} <span className="text-xs font-normal text-slate-400">lượt</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Sau mốc kiểm diện</span>
              </div>
            </div>
          )}

          {/* CHARTS: TIMELINE & GRADE COMPARISON */}
          {statsData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Timeline Chart */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#0e3a7c]" />
                      Diễn biến tỷ lệ chuyên cần theo thời gian
                    </h3>
                    <p className="text-xs text-slate-500">
                      Thống kê theo từng ngày trong {statPeriodType === 'week' ? 'tuần' : statPeriodType === 'month' ? 'tháng' : 'ngày'}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#0e3a7c] border border-blue-200">
                    {statsData.period?.label}
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statsData.timeline || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date_formatted" tick={{ fontSize: 11 }} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, 'Chuyên cần']}
                        labelFormatter={(label) => `Ngày ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        name="Chuyên cần (%)"
                        stroke="#0e3a7c"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0e3a7c' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grade comparison chart */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-700" />
                      So sánh 3 khối chuyên cần
                    </h3>
                    <p className="text-xs text-slate-500">Khối 10 • Khối 11 • Khối 12</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">Tỷ lệ %</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.grade_breakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="grade" tickFormatter={(g) => `Khối ${g}`} tick={{ fontSize: 11 }} />
                      <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Chuyên cần']} />
                      <Bar dataKey="attendance_rate" name="Chuyên cần (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {(statsData.grade_breakdown || []).map((g: any) => (
                    <div key={g.grade} className="p-2 bg-slate-50 rounded-lg text-center">
                      <div className="font-black text-slate-800">Khối {g.grade}</div>
                      <div className="text-emerald-700 font-extrabold text-sm mt-0.5">{g.attendance_rate}%</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Vắng: {g.excused_count + g.unexcused_count} • Muộn: {g.late_count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DETAILED CLASS RANKING / BREAKDOWN TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  Bảng tổng hợp & xếp hạng chuyên cần từng lớp trong kỳ
                </h3>
                <p className="text-xs text-slate-500">
                  Phân tích chi tiết số buổi điểm danh, lượt có mặt, vắng, muộn và thời gian ghi nhận gần nhất
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                Hiển thị: <strong>{statsData?.class_breakdown?.length || 0} lớp</strong>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="px-3 py-3 text-center w-12">Hạng</th>
                    <th className="px-4 py-3">Lớp chuyên</th>
                    <th className="px-3 py-3">Phòng học</th>
                    <th className="px-3 py-3">Giáo viên chủ nhiệm</th>
                    <th className="px-3 py-3 text-center">Sĩ số</th>
                    <th className="px-3 py-3 text-center">Số buổi chốt</th>
                    <th className="px-3 py-3 text-center text-emerald-700">Có mặt</th>
                    <th className="px-3 py-3 text-center text-amber-700">Có phép</th>
                    <th className="px-3 py-3 text-center text-rose-700">Không phép</th>
                    <th className="px-3 py-3 text-center text-purple-700">Muộn</th>
                    <th className="px-3 py-3 text-center">Chuyên cần</th>
                    <th className="px-3 py-3 text-center">Thời gian gần nhất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statsLoading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0e3a7c]" />
                        Đang tổng hợp số liệu thống kê...
                      </td>
                    </tr>
                  ) : !statsData?.class_breakdown || statsData.class_breakdown.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                        Không có dữ liệu trong khoảng thời gian đã chọn
                      </td>
                    </tr>
                  ) : (
                    statsData.class_breakdown.map((c: any, idx: number) => {
                      const rate = c.attendance_rate || 0;
                      return (
                        <tr key={c.class_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 text-center font-bold">
                            {idx === 0 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black mx-auto text-xs shadow-2xs">1</span>
                            ) : idx === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-black mx-auto text-xs">2</span>
                            ) : idx === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black mx-auto text-xs">3</span>
                            ) : (
                              <span className="text-slate-500 font-mono">{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-900">{c.class_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Mã: {c.class_code} • Khối {c.grade_level}
                            </div>
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-700">
                            {c.room_location || 'Nhà A'}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-bold text-slate-800">{c.teacher_name}</div>
                            {c.teacher_phone && (
                              <div className="text-[10px] text-slate-500">{c.teacher_phone}</div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-900">
                            {c.total_students}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-slate-700">
                            {c.sessions_count} buổi
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                            {c.present_count}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-amber-700 bg-amber-50/20">
                            {c.excused_count}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-rose-700 bg-rose-50/20">
                            {c.unexcused_count}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-purple-700 bg-purple-50/20">
                            {c.late_count}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-xs ${
                                rate >= 98
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rate >= 95
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rate}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {c.last_session_time ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 flex items-center justify-center gap-1 mx-auto w-fit">
                                <Clock className="w-3 h-3 text-slate-500" /> {c.last_session_time}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
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

          {/* TOP HỌC SINH VẮNG / ĐI MUỘN NHIỀU NHẤT TRONG KỲ */}
          {statsData?.top_absent_students && statsData.top_absent_students.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Học sinh có số lượt vắng / đi muộn nhiều nhất trong {statPeriodType === 'week' ? 'tuần' : statPeriodType === 'month' ? 'tháng' : 'ngày'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cơ sở dữ liệu đôn đốc nề nếp, kết nối phụ huynh và áp dụng quy chế trừ điểm KPI
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg">
                  {statsData.top_absent_students.length} học sinh cần lưu ý
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-10">TT</th>
                      <th className="px-4 py-2.5">Học sinh</th>
                      <th className="px-3 py-2.5">Lớp & Khối</th>
                      <th className="px-3 py-2.5 text-center text-amber-700">Có phép</th>
                      <th className="px-3 py-2.5 text-center text-rose-700">Không phép</th>
                      <th className="px-3 py-2.5 text-center text-purple-700">Đi muộn</th>
                      <th className="px-3 py-2.5 text-center font-bold">Tổng lượt vi phạm</th>
                      <th className="px-4 py-2.5">Liên hệ Phụ huynh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statsData.top_absent_students.map((st: any, idx: number) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold text-slate-900">
                          {st.full_name}
                          <span className="text-[10px] text-slate-500 font-mono ml-1.5">({st.code})</span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-700">
                          {st.class_name} (Khối {st.grade_level})
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-amber-700">{st.excused_count}</td>
                        <td className="px-3 py-2 text-center font-bold text-rose-700">{st.unexcused_count}</td>
                        <td className="px-3 py-2 text-center font-bold text-purple-700">{st.late_count}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-rose-800 bg-rose-100 text-xs">
                            {st.total_issues} lượt
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-slate-800 font-medium">{st.parent_name || 'Phụ huynh'}</span>
                          {st.parent_phone && (
                            <a
                              href={`tel:${st.parent_phone}`}
                              className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" /> {st.parent_phone}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: DANH SÁCH HỌC SINH VẮNG & ĐI MUỘN (THAO TÁC XỬ LÝ)           */}
      {/* =================================================================== */}
      {activeTab === 'absent_list' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Phân loại:
              </span>
              <button
                onClick={() => setAbsentFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  absentFilter === 'all' ? 'bg-[#0e3a7c] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Tất cả ({absentStudents.length})
              </button>
              <button
                onClick={() => setAbsentFilter('unexcused_absence')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  absentFilter === 'unexcused_absence' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Vắng không phép (Cần xử lý)
              </button>
              <button
                onClick={() => setAbsentFilter('excused_absence')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  absentFilter === 'excused_absence' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Vắng có phép
              </button>
              <button
                onClick={() => setAbsentFilter('late')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  absentFilter === 'late' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Đi muộn đầu giờ
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Tổng cộng: <strong className="text-slate-900">{absentStudents.length}</strong> học sinh trong danh sách theo dõi
            </div>
          </div>

          {/* Absent Students Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[11px] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Mã & Họ tên học sinh</th>
                    <th className="px-3 py-3">Lớp & Khối</th>
                    <th className="px-3 py-3">Trạng thái đầu giờ</th>
                    <th className="px-3 py-3">Thời gian ghi nhận</th>
                    <th className="px-3 py-3">Lý do / Ghi chú</th>
                    <th className="px-3 py-3">Thông tin Phụ huynh</th>
                    <th className="px-3 py-3">GVCN liên hệ</th>
                    <th className="px-4 py-3 text-right">Biên bản KPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {absentLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-[#0e3a7c]" />
                        Đang tải danh sách học sinh vắng & muộn...
                      </td>
                    </tr>
                  ) : absentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Không có học sinh nào thuộc danh mục này trong ngày {selectedDate}
                      </td>
                    </tr>
                  ) : (
                    absentStudents.map((s) => (
                      <tr key={s.record_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-slate-900">{s.student_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{s.student_code}</span>
                            <span>•</span>
                            <span>{s.gender}</span>
                            <span>•</span>
                            {s.is_boarding ? (
                              <span className="text-emerald-700 font-bold">P{s.room_code || 'KTX'}</span>
                            ) : (
                              <span>Ngoại trú</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-800">{s.class_name}</div>
                          <div className="text-[10px] text-slate-500">Khối {s.grade_level}</div>
                        </td>
                        <td className="px-3 py-3">
                          {s.status === 'unexcused_absence' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                              Vắng không phép
                            </span>
                          ) : s.status === 'excused_absence' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Nghỉ có phép
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Đi muộn đầu giờ
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-600 font-mono text-[11px]">
                          {s.recorded_at ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(s.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            '07:00'
                          )}
                        </td>
                        <td className="px-3 py-3 max-w-xs text-slate-700">
                          {s.note ? (
                            <div className="text-[11px] font-medium italic">{s.note}</div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có ghi chú</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-800">{s.parent_name || 'Phụ huynh'}</div>
                          {s.parent_phone ? (
                            <a
                              href={`tel:${s.parent_phone}`}
                              className="text-[10px] text-[#0e3a7c] font-bold hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-2.5 h-2.5" /> {s.parent_phone}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chưa có SĐT</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-bold text-slate-800">{s.teacher_name || 'GVCN'}</div>
                          {s.teacher_phone && (
                            <div className="text-[10px] text-slate-500">{s.teacher_phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canCreateViolation ? (
                            <>
                              {s.violation_id ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold shadow-2xs whitespace-nowrap"
                                  title={`Đã lập biên bản ${s.violation_code} (-${s.violation_points}đ) lúc điểm danh`}
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Đã phạt {s.violation_rule_code || 'L01'} (-{s.violation_points}đ)
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  {s.status === 'unexcused_absence' && (
                                    <button
                                      onClick={() => handleCreateViolation(s, absenceRule.code)}
                                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1 whitespace-nowrap"
                                      title={`Tạo biên bản trừ điểm KPI (${absenceRule.code} - ${absenceRule.name}: -${absenceRule.deduction_points}đ)`}
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      Phạt {absenceRule.code} (-{absenceRule.deduction_points}đ)
                                    </button>
                                  )}
                                  {s.status === 'late' && (
                                    <button
                                      onClick={() => handleCreateViolation(s, l01Rule.code)}
                                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold cursor-pointer transition-all shadow-2xs inline-flex items-center gap-1 whitespace-nowrap"
                                      title={`Tạo biên bản trừ điểm KPI (${l01Rule.code} - ${l01Rule.name}: -${l01Rule.deduction_points}đ)`}
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      Phạt {l01Rule.code} (-{l01Rule.deduction_points}đ)
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setRuleModalStudent(s);
                                      setSelectedCustomRule(s.status === 'late' ? 'L01' : 'L01');
                                    }}
                                    className="px-1.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-[10px] font-semibold border border-slate-200 cursor-pointer whitespace-nowrap"
                                    title="Chọn mã lỗi khác (L01 - L10) từ Quy chế"
                                  >
                                    Mã khác...
                                  </button>
                                  {s.status === 'excused_absence' && (
                                    <span className="text-slate-400 text-[10px] italic">Có phép</span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Theo dõi</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: XUẤT EXCEL & BIỂU MẪU IN ẤN A4                                */}
      {/* =================================================================== */}
      {activeTab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Export Options (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Xuất dữ liệu Excel (.xlsx)</h3>
                  <p className="text-xs text-slate-500">Tải tệp bảng tính đối soát nề nếp</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-800">Cấu trúc file Excel bao gồm:</div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">Sheet 1:</span>
                  <span>Tổng hợp sĩ số, số có mặt, vắng phép, không phép, đi muộn và thời gian ghi nhận của 54 lớp.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-rose-700">Sheet 2:</span>
                  <span>Danh sách chi tiết toàn bộ học sinh vắng & đi muộn (họ tên, lớp, SĐT phụ huynh, lý do).</span>
                </div>
              </div>

              <button
                onClick={handleExportExcel}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Tải xuống file Excel (.xlsx)
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-[#0e3a7c]">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">In phiếu nộp Ban Thi đua (Khổ A4)</h3>
                  <p className="text-xs text-slate-500">Chuẩn quy cách mẫu văn bản hành chính</p>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Phiếu tổng hợp chuyên cần đầu buổi sáng dùng để lưu hồ sơ giám thị, báo cáo Ban Giám hiệu hoặc lưu trữ theo ngày.
              </p>

              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                In phiếu tổng hợp A4 ngay
              </button>
            </div>
          </div>

          {/* Official A4 Document Preview (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-slate-300 shadow-sm space-y-5 text-slate-900 font-serif">
            {/* Header official document */}
            <div className="flex items-start justify-between border-b border-slate-300 pb-4 text-center">
              <div className="text-left space-y-0.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ
                </div>
                <div className="text-xs font-black uppercase text-slate-900">
                  {schoolSettings.school_name || 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG'}
                </div>
                <div className="text-[10px] text-slate-500">Số: ...... /TB-CHV</div>
              </div>

              <div className="text-right space-y-0.5">
                <div className="text-[11px] font-black uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[10px] font-bold underline decoration-slate-400">
                  Độc lập - Tự do - Hạnh phúc
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  Phú Thọ, ngày {new Date(selectedDate).getDate()} tháng {new Date(selectedDate).getMonth() + 1} năm {new Date(selectedDate).getFullYear()}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
                BẢNG TỔNG HỢP SĨ SỐ & NỀ NẾP CHUYÊN CẦN ĐẦU GIỜ SÁNG
              </h2>
              <p className="text-xs text-slate-600 italic">
                (Áp dụng toàn bộ 54 lớp chuyên • Mốc kiểm diện: 07 giờ 00 phút)
              </p>
            </div>

            {/* Summary Statistics Table */}
            {dailyStats && (
              <div className="border border-slate-400 rounded overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px] text-slate-800">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Nội dung theo dõi</th>
                      <th className="p-2 text-center border-r border-slate-300">Khối 10</th>
                      <th className="p-2 text-center border-r border-slate-300">Khối 11</th>
                      <th className="p-2 text-center border-r border-slate-300">Khối 12</th>
                      <th className="p-2 text-center font-black bg-slate-200/60">Toàn trường</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    <tr>
                      <td className="p-2 font-bold border-r border-slate-300">1. Tổng số lớp đã chốt sổ</td>
                      <td className="p-2 text-center border-r border-slate-300">17 / 17</td>
                      <td className="p-2 text-center border-r border-slate-300">17 / 17</td>
                      <td className="p-2 text-center border-r border-slate-300">20 / 20</td>
                      <td className="p-2 text-center font-bold bg-slate-50">54 / 54 lớp</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold border-r border-slate-300">2. Tổng quân số học sinh</td>
                      <td className="p-2 text-center border-r border-slate-300">598</td>
                      <td className="p-2 text-center border-r border-slate-300">595</td>
                      <td className="p-2 text-center border-r border-slate-300">690</td>
                      <td className="p-2 text-center font-black bg-slate-50 text-slate-900">{dailyStats.total_students} HS</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-emerald-800 border-r border-slate-300">3. Số học sinh có mặt</td>
                      <td className="p-2 text-center text-emerald-800 font-bold border-r border-slate-300">
                        {dailyStats.grade_breakdown?.[0]?.present || 0}
                      </td>
                      <td className="p-2 text-center text-emerald-800 font-bold border-r border-slate-300">
                        {dailyStats.grade_breakdown?.[1]?.present || 0}
                      </td>
                      <td className="p-2 text-center text-emerald-800 font-bold border-r border-slate-300">
                        {dailyStats.grade_breakdown?.[2]?.present || 0}
                      </td>
                      <td className="p-2 text-center font-black text-emerald-900 bg-emerald-50">
                        {dailyStats.present_count} ({dailyStats.attendance_rate}%)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-amber-900 border-r border-slate-300">4. Vắng mặt có phép</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[0]?.excused || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[1]?.excused || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[2]?.excused || 0}</td>
                      <td className="p-2 text-center font-bold bg-amber-50 text-amber-900">{dailyStats.excused_count} HS</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-rose-800 border-r border-slate-300">5. Vắng mặt không phép</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[0]?.unexcused || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[1]?.unexcused || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[2]?.unexcused || 0}</td>
                      <td className="p-2 text-center font-black bg-rose-50 text-rose-800">{dailyStats.unexcused_count} HS</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold text-purple-900 border-r border-slate-300">6. Đi học muộn đầu giờ</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[0]?.late || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[1]?.late || 0}</td>
                      <td className="p-2 text-center border-r border-slate-300">{dailyStats.grade_breakdown?.[2]?.late || 0}</td>
                      <td className="p-2 text-center font-bold bg-purple-50 text-purple-900">{dailyStats.late_count} HS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Area */}
            <div className="grid grid-cols-2 pt-6 text-center text-xs">
              <div>
                <div className="font-bold uppercase text-slate-800 text-[11pt]">BÍ THƯ ĐOÀN TRƯỜNG / TRƯỞNG BAN GIÁM THỊ</div>
                <div className="h-14 flex items-center justify-center italic text-slate-500 text-[10pt]">(Ký và ghi rõ họ tên)</div>
                <div className="font-bold text-slate-900 text-[11pt] mt-2">
                  {schoolSettings.youth_union_secretary || schoolSettings.dorm_manager_name || 'VŨ VĂN HIỀN'}
                </div>
              </div>
              <div>
                <div className="font-bold uppercase text-slate-800 text-[11pt]">HIỆU TRƯỞNG</div>
                <div className="h-14 flex items-center justify-center italic text-slate-500 text-[10pt]">(Ký và đóng dấu)</div>
                <div className="font-bold text-slate-900 text-[11pt] mt-2">
                  {schoolSettings.principal_name || 'ĐÀO MẠNH THẮNG'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ĐIỂM DANH HỌC SINH TỪNG LỚP (GHI NHẬN THỜI GIAN ĐIỂM DANH)   */}
      {/* =================================================================== */}
      <Modal
        isOpen={rollCallModalOpen}
        onClose={() => setRollCallModalOpen(false)}
        title={`Sổ điểm danh đầu giờ: ${activeClassInfo?.name || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Header Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-black text-sm text-[#0e3a7c]">
                {activeClassInfo?.name} (Mã: {activeClassInfo?.code})
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                GVCN: <strong>{activeClassInfo?.teacher_name}</strong> • SĐT: {activeClassInfo?.teacher_phone} • Phòng: {activeClassInfo?.room_location || 'Nhà A'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleModalMarkAllPresent}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Đánh dấu tất cả có mặt
              </button>
            </div>
          </div>

          {/* Timestamp & Shift Recording Strip (Ghi nhận thời gian) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-blue-50/50 border border-blue-200/70 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Ngày điểm danh</span>
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-[#0e3a7c]" /> {selectedDate}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0e3a7c]" /> Thời gian ghi nhận
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-xs text-slate-800 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setSessionTime(new Date().toTimeString().slice(0, 5))}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 font-semibold cursor-pointer"
                  title="Lấy giờ hiện tại trên thiết bị"
                >
                  Giờ này
                </button>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Phiên điểm danh</span>
              <div className="font-bold text-slate-900 text-xs mt-1">
                {shiftName || 'Đầu giờ sáng (07h00 - 07h30)'}
              </div>
            </div>
          </div>

          {/* Quick Stats inside modal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-center">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-slate-500 text-[10px]">Sĩ số</div>
              <div className="text-base font-black text-slate-900">{rollCallStudents.length}</div>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-emerald-700 text-[10px] font-bold">Có mặt</div>
              <div className="text-base font-black text-emerald-700">
                {rollCallStudents.filter((s) => s.currentStatus === 'present').length}
              </div>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-amber-800 text-[10px] font-bold">Có phép</div>
              <div className="text-base font-black text-amber-800">
                {rollCallStudents.filter((s) => s.currentStatus === 'excused_absence').length}
              </div>
            </div>
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-rose-700 text-[10px] font-bold">Không phép / Muộn</div>
              <div className="text-base font-black text-rose-700">
                {rollCallStudents.filter((s) => s.currentStatus === 'unexcused_absence' || s.currentStatus === 'late').length}
              </div>
            </div>
          </div>

          {/* Dedicated Mobile Roll-Call Cards for Students (block sm:hidden) */}
          <div className="block sm:hidden space-y-2.5 max-h-[50vh] overflow-y-auto pr-0.5">
            {rollCallLoading ? (
              <div className="p-8 text-center text-slate-400">Đang tải danh sách học sinh...</div>
            ) : (
              rollCallStudents.map((st, idx) => (
                <div key={st.id} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{st.full_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {st.code} • {st.is_boarding ? `P${st.room_code || '---'}` : 'Ngoại trú'}
                    </span>
                  </div>

                  {/* 4 Attendance Status Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(st.id, 'present')}
                      className={`py-1.5 rounded text-[11px] font-bold transition-all touch-action-manipulation ${
                        st.currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Có mặt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(st.id, 'excused_absence')}
                      className={`py-1.5 rounded text-[11px] font-bold transition-all touch-action-manipulation ${
                        st.currentStatus === 'excused_absence' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Có phép
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(st.id, 'unexcused_absence')}
                      className={`py-1.5 rounded text-[11px] font-bold transition-all touch-action-manipulation ${
                        st.currentStatus === 'unexcused_absence' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      K.phép
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetStudentStatus(st.id, 'late')}
                      className={`py-1.5 rounded text-[11px] font-bold transition-all touch-action-manipulation ${
                        st.currentStatus === 'late' ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      Muộn
                    </button>
                  </div>

                  {/* Note / time input */}
                  {st.currentStatus !== 'present' && (
                    <input
                      type="text"
                      placeholder={st.currentStatus === 'late' ? 'VD: Đến lúc 07:15...' : 'Lý do nghỉ...'}
                      value={st.currentNote}
                      onChange={(e) => handleSetStudentNote(st.id, e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Students List Table (hidden sm:block) */}
          <div className="hidden sm:block border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 w-10">STT</th>
                  <th className="px-3 py-2">Học sinh</th>
                  <th className="px-3 py-2 text-center w-56">Trạng thái điểm danh</th>
                  <th className="px-3 py-2">Lý do / Thời gian đến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rollCallLoading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-slate-400">
                      Đang tải danh sách học sinh...
                    </td>
                  </tr>
                ) : (
                  rollCallStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono text-slate-400 text-center">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-extrabold text-slate-900">{st.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {st.code} • {st.is_boarding ? `Nội trú P${st.room_code || '---'}` : 'Ngoại trú'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(st.id, 'present')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer touch-action-manipulation ${
                              st.currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Có mặt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(st.id, 'excused_absence')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer touch-action-manipulation ${
                              st.currentStatus === 'excused_absence'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Có phép
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(st.id, 'unexcused_absence')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer touch-action-manipulation ${
                              st.currentStatus === 'unexcused_absence'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            K.phép
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetStudentStatus(st.id, 'late')}
                            className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer touch-action-manipulation ${
                              st.currentStatus === 'late'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Muộn
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder={st.currentStatus === 'late' ? 'VD: Đến lúc 07:18...' : 'Lý do nghỉ hoặc ghi chú...'}
                          value={st.currentNote}
                          onChange={(e) => handleSetStudentNote(st.id, e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Notes for class */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú chung của lớp đầu giờ sáng</label>
            <input
              type="text"
              placeholder="VD: Lớp nề nếp tốt, 1 bạn sốt đã có đơn phụ huynh..."
              value={classNotes}
              onChange={(e) => setClassNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <span className="text-slate-500 text-[11px] text-center sm:text-left">
              Ngày: <strong>{selectedDate}</strong> • Giờ ghi nhận: <strong>{sessionTime}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRollCallModalOpen(false)}
                className="flex-1 sm:flex-none justify-center px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer touch-action-manipulation"
              >
                Đóng
              </button>
              {canTakeAttendance && (
                <button
                  type="button"
                  disabled={savingRollCall}
                  onClick={handleSaveRollCall}
                  className="flex-1 sm:flex-none justify-center px-5 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-black rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 touch-action-manipulation"
                >
                  {savingRollCall ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {savingRollCall ? 'Đang lưu...' : 'Lưu & Chốt sổ'}
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Chọn Mã Lỗi Quy Chế KPI Trừ Điểm (L01 - L10) */}
      {ruleModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0e3a7c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-sm">CHỌN MÃ LỖI QUY CHẾ KPI ĐỂ TRỪ ĐIỂM</h3>
              </div>
              <button
                type="button"
                onClick={() => setRuleModalStudent(null)}
                className="p-1 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <div className="font-bold text-slate-900 text-sm">{ruleModalStudent.student_name}</div>
                <div className="text-slate-600 mt-0.5">
                  Lớp {ruleModalStudent.class_name} • Trạng thái điểm danh:{' '}
                  <span className="font-bold text-[#0e3a7c]">
                    {ruleModalStudent.status === 'late'
                      ? 'Đi muộn đầu giờ'
                      : ruleModalStudent.status === 'unexcused_absence'
                      ? 'Vắng không phép'
                      : 'Nghỉ có phép'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn mã lỗi vi phạm theo khung 10 mã quy chế nhà trường:
                </label>
                <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {kpiRules
                    .filter((r) => !r.code.startsWith('C'))
                    .map((r) => {
                      const isSel = selectedCustomRule === r.code;
                      return (
                        <div
                          key={r.id || r.code}
                          onClick={() => setSelectedCustomRule(r.code)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            isSel
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <input
                              type="radio"
                              name="attendance_rule_select"
                              checked={isSel}
                              onChange={() => setSelectedCustomRule(r.code)}
                              className="text-[#0e3a7c]"
                            />
                            <span className="font-mono text-blue-700 font-extrabold">{r.code}</span>
                            <span className="truncate">{r.name}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                            -{r.deduction_points}đ
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRuleModalStudent(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateViolation(ruleModalStudent, selectedCustomRule)}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Xác nhận lập biên bản (-
                  {(kpiRules.find((r) => r.code === selectedCustomRule)?.deduction_points ?? 1)}đ)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
