// frontend/src/pages/KpiPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { uploadImageFromDevice } from '../utils/imageUpload';
import type { KpiRule, Violation, Student } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ExcelImportModal, type ColumnMapping } from '../components/ExcelImportModal';
import { getTodayVN } from '../utils/dateTime';
import {
  Award,
  AlertTriangle,
  Plus,
  Upload,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ShieldAlert,
  FileCheck,
  Scale,
  Calendar,
  Edit,
  Trash2,
  Clock,
  User,
  BedDouble,
  X,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

const violationImportColumns: ColumnMapping[] = [
  { key: 'student_code', label: 'Mã học sinh', aliases: ['Mã học sinh', 'Mã HS', 'Ma HS', 'code', 'student_code'], required: true },
  { key: 'rule_code', label: 'Mã vi phạm', aliases: ['Mã vi phạm', 'Mã lỗi', 'Ma loi', 'rule_code', 'rule'], required: true },
  { key: 'violation_date', label: 'Ngày vi phạm', aliases: ['Ngày vi phạm', 'Ngày', 'violation_date', 'date'] },
  { key: 'location', label: 'Địa điểm', aliases: ['Địa điểm', 'Khu vực', 'location'] },
  { key: 'description', label: 'Mô tả vi phạm', aliases: ['Mô tả vi phạm', 'Mô tả', 'Lý do', 'description'] },
];

const sampleViolationTemplate = [
  {
    'Mã học sinh': 'HV100018',
    'Mã vi phạm': 'L01',
    'Ngày vi phạm': '2026-10-16',
    'Địa điểm': 'Cổng chính Tòa A',
    'Mô tả vi phạm': 'Đến trường lúc 07h15, muộn sau giờ quy định',
  },
  {
    'Mã học sinh': 'HV100012',
    'Mã vi phạm': 'L02',
    'Ngày vi phạm': '2026-10-16',
    'Địa điểm': 'Hành lang Tầng 3',
    'Mô tả vi phạm': 'Không đeo thẻ học sinh trong giờ học',
  },
  {
    'Mã học sinh': 'HV100031',
    'Mã vi phạm': 'L07',
    'Ngày vi phạm': '2026-10-15',
    'Địa điểm': 'Phòng KTX P201',
    'Mô tả vi phạm': 'Chưa gấp chăn màn nội vụ ca sáng 06h15',
  },
];

export const KpiPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDormManager = user?.role === 'dorm_manager';
  const isHomeroomTeacher = user?.role === 'homeroom_teacher';
  const canCreateViolation = isAdmin || isDormManager || isHomeroomTeacher;
  const canManageViolations = isAdmin || isDormManager;

  const [rules, setRules] = useState<KpiRule[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [disciplineLevels, setDisciplineLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [ruleFilter, setRuleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Violation / Bonus Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [recordType, setRecordType] = useState<'violation' | 'bonus'>('violation');
  const [importViolationModalOpen, setImportViolationModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchedStudents, setSearchedStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [currentTimeLive, setCurrentTimeLive] = useState('');

  // Helper to determine whether a rule or record is a bonus
  const isBonusRule = (r?: { code?: string; category?: string; rule_type?: string }) => {
    if (!r) return false;
    if (r.rule_type === 'bonus') return true;
    if (r.rule_type === 'deduction') return false;
    const cat = (r.category || '').toLowerCase();
    if (cat.includes('khen') || cat.includes('thuong') || cat.includes('thưởng')) return true;
    const code = (r.code || '').toUpperCase();
    if (code.startsWith('C')) return true;
    return false;
  };

  // Helper to format exact current local date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      timeWithSec: `${hours}:${minutes}:${seconds}`,
    };
  };

  const [formViolation, setFormViolation] = useState({
    rule_id: '',
    location: 'Khuôn viên trường',
    description: '',
    violation_date: getCurrentDateTime().date,
    violation_time: getCurrentDateTime().time,
    evidence_url: '',
  });

  // Edit Violation State
  const [editViolationModalOpen, setEditViolationModalOpen] = useState(false);
  const [editingViolationId, setEditingViolationId] = useState<number | null>(null);
  const [editViolationForm, setEditViolationForm] = useState({
    rule_id: '',
    location: '',
    description: '',
    violation_date: '',
    violation_time: '',
    status: 'approved',
    points_deducted: 5,
    notes: '',
    evidence_url: '',
  });

  // Device Evidence Image State & Refs
  const evidenceCreateFileInputRef = useRef<HTMLInputElement>(null);
  const evidenceEditFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [viewingEvidenceUrl, setViewingEvidenceUrl] = useState<string | null>(null);

  const handleCreateEvidenceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEvidence(true);
    try {
      const url = await uploadImageFromDevice(file, 'evidence');
      setFormViolation((prev) => ({ ...prev, evidence_url: url }));
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh minh chứng');
    } finally {
      setIsUploadingEvidence(false);
      if (evidenceCreateFileInputRef.current) evidenceCreateFileInputRef.current.value = '';
    }
  };

  const handleEditEvidenceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEvidence(true);
    try {
      const url = await uploadImageFromDevice(file, 'evidence');
      setEditViolationForm((prev) => ({ ...prev, evidence_url: url }));
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh minh chứng');
    } finally {
      setIsUploadingEvidence(false);
      if (evidenceEditFileInputRef.current) evidenceEditFileInputRef.current.value = '';
    }
  };

  // KPI Rules CRUD State
  const [createRuleModalOpen, setCreateRuleModalOpen] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    code: '',
    name: '',
    category: 'KTX',
    deduction_points: 5,
    description: '',
    rule_type: 'deduction' as 'deduction' | 'bonus',
  });

  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editRuleData, setEditRuleData] = useState({
    code: '',
    name: '',
    category: 'KTX',
    deduction_points: 5,
    description: '',
    rule_type: 'deduction' as 'deduction' | 'bonus',
  });

  const fetchRules = async () => {
    try {
      const data: any = await api.get('/kpi/rules');
      setRules(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDisciplineLevels = async () => {
    try {
      const data: any = await api.get('/kpi/discipline-levels');
      setDisciplineLevels(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/kpi/violations', {
        page,
        limit: 15,
        rule_id: ruleFilter,
        status: statusFilter,
        date: dateFilter,
        search,
      });
      setViolations(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchDisciplineLevels();

    const updateLiveClock = () => {
      const now = new Date();
      setCurrentTimeLive(
        now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateLiveClock();
    const clockInterval = setInterval(updateLiveClock, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    fetchViolations();
  }, [page, ruleFilter, statusFilter, dateFilter]);

  // Real-time table filter when typing search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchViolations();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Real-time student search as user types inside Create Violation Modal
  useEffect(() => {
    if (!createModalOpen) return;
    if (selectedStudent) return;

    const q = studentSearch.trim();
    const timer = setTimeout(async () => {
      setIsSearchingStudent(true);
      try {
        const res: any = await api.get('/students', {
          search: q,
          limit: 10,
        });
        setSearchedStudents(res?.items || []);
      } catch (err) {
        console.error('Real-time student search error:', err);
      } finally {
        setIsSearchingStudent(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [studentSearch, createModalOpen, selectedStudent]);

  // Handler to open Create Violation Modal
  const handleOpenCreateViolationModal = () => {
    const dt = getCurrentDateTime();
    setRecordType('violation');
    const firstViolationRule = rules.find((r) => !isBonusRule(r));
    setFormViolation({
      rule_id: firstViolationRule ? String(firstViolationRule.id) : '',
      location: 'Khuôn viên trường',
      description: '',
      violation_date: dt.date,
      violation_time: dt.time,
      evidence_url: '',
    });
    setSelectedStudent(null);
    setStudentSearch('');
    setSearchedStudents([]);
    setCreateModalOpen(true);
  };

  // Handler to open Create Bonus Modal (Ghi nhận điểm cộng / Khen thưởng)
  const handleOpenCreateBonusModal = () => {
    const dt = getCurrentDateTime();
    setRecordType('bonus');
    const firstBonusRule = rules.find((r) => isBonusRule(r));
    setFormViolation({
      rule_id: firstBonusRule ? String(firstBonusRule.id) : '',
      location: 'Khuôn viên trường',
      description: '',
      violation_date: dt.date,
      violation_time: dt.time,
      evidence_url: '',
    });
    setSelectedStudent(null);
    setStudentSearch('');
    setSearchedStudents([]);
    setCreateModalOpen(true);
  };

  // Button to snap date and time to the exact current moment
  const handleSnapToCurrentTime = () => {
    const dt = getCurrentDateTime();
    setFormViolation((prev) => ({
      ...prev,
      violation_date: dt.date,
      violation_time: dt.time,
    }));
  };

  const handleCreateViolationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !formViolation.rule_id || !formViolation.description) {
      alert(recordType === 'bonus' ? 'Vui lòng chọn học sinh, tiêu chí khen thưởng và nhập thành tích' : 'Vui lòng chọn học sinh, mã lỗi và nhập mô tả sự việc');
      return;
    }

    try {
      await api.post('/kpi/violations', {
        student_id: selectedStudent.id,
        rule_id: formViolation.rule_id,
        location: formViolation.location,
        description: formViolation.description,
        violation_date: formViolation.violation_date,
        violation_time: formViolation.violation_time,
        evidence_url: formViolation.evidence_url,
      });
      alert(recordType === 'bonus' ? 'Ghi nhận điểm cộng khen thưởng thành công!' : 'Lập biên bản vi phạm thành công!');
      setCreateModalOpen(false);
      setSelectedStudent(null);
      const dt = getCurrentDateTime();
      setFormViolation({
        rule_id: '',
        location: 'Khuôn viên trường',
        description: '',
        violation_date: dt.date,
        violation_time: dt.time,
        evidence_url: '',
      });
      fetchViolations();
    } catch (err: any) {
      alert(err.message || 'Lỗi ghi nhận');
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Xác nhận phê duyệt bản ghi này? Điểm KPI học sinh sẽ được tự động tính toán lại.')) return;
    try {
      await api.post(`/kpi/violations/${id}/approve`);
      alert('Đã phê duyệt thành công');
      fetchViolations();
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    try {
      await api.post(`/kpi/violations/${id}/reject`, { notes: reason });
      alert('Đã từ chối bản ghi');
      fetchViolations();
    } catch (err: any) {
      alert(err.message || 'Lỗi từ chối');
    }
  };

  const handleOpenEditViolation = (v: Violation) => {
    setEditingViolationId(v.id);
    setEditViolationForm({
      rule_id: String(v.rule_id),
      location: v.location || '',
      description: v.description || '',
      violation_date: v.violation_date || '',
      violation_time: v.violation_time || '',
      status: v.status || 'approved',
      points_deducted: v.points_deducted || 5,
      notes: (v as any).notes || '',
      evidence_url: (v as any).evidence_url || '',
    });
    setEditViolationModalOpen(true);
  };

  const handleEditViolationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingViolationId) return;
    try {
      await api.put(`/kpi/violations/${editingViolationId}`, editViolationForm);
      alert('Cập nhật bản ghi thành công!');
      setEditViolationModalOpen(false);
      fetchViolations();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleDeleteViolation = async (v: Violation) => {
    const isBonus = isBonusRule({ code: v.rule_code, category: (v as any).rule_category });
    if (!window.confirm(`Xác nhận xóa bản ghi "${v.code}" của học sinh ${v.student_name}?\nĐiểm KPI của học sinh sẽ tự động được cập nhật lại.`)) {
      return;
    }
    try {
      await api.delete(`/kpi/violations/${v.id}`);
      alert(`Đã xóa ${isBonus ? 'khen thưởng' : 'biên bản'} ${v.code} thành công`);
      fetchViolations();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/kpi/rules', newRuleData);
      alert(`Tạo quy chế ${newRuleData.code} thành công!`);
      setCreateRuleModalOpen(false);
      setNewRuleData({ code: '', name: '', category: 'KTX', deduction_points: 5, description: '', rule_type: 'deduction' });
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo quy định');
    }
  };

  const handleOpenEditRule = (r: KpiRule) => {
    const isBonus = isBonusRule(r);
    setEditingRuleId(r.id);
    setEditRuleData({
      code: r.code,
      name: r.name,
      category: (r as any).category || (isBonus ? 'khen_thưởng' : 'KTX'),
      deduction_points: r.deduction_points,
      description: r.description || '',
      rule_type: isBonus ? 'bonus' : 'deduction',
    });
    setEditRuleModalOpen(true);
  };

  const handleEditRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRuleId) return;
    try {
      await api.put(`/kpi/rules/${editingRuleId}`, editRuleData);
      alert(`Cập nhật quy định ${editRuleData.code} thành công!`);
      setEditRuleModalOpen(false);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi sửa quy định');
    }
  };

  const handleDeleteRule = async (r: KpiRule) => {
    if (!window.confirm(`Xác nhận xóa quy định "${r.code}: ${r.name}"?`)) {
      return;
    }
    try {
      await api.delete(`/kpi/rules/${r.id}`);
      alert(`Đã xóa quy định ${r.code} thành công`);
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa quy định');
    }
  };

  const statusVariant = (s: string, isBonus = false) => {
    switch (s) {
      case 'approved': return { label: isBonus ? 'Đã duyệt (+)' : 'Đã duyệt (-)', variant: isBonus ? ('success' as const) : ('danger' as const) };
      case 'pending': return { label: 'Chờ duyệt', variant: 'warning' as const };
      case 'rejected': return { label: 'Đã từ chối', variant: 'neutral' as const };
      default: return { label: s, variant: 'neutral' as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            KPI & sổ kỷ luật nền nếp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy tắc 10 Mã Lỗi Vi Phạm (L01 — L10) & 3 Tiêu Chí Điểm Cộng (C01 — C03) • Thang điểm gốc <strong>100 điểm</strong> • Cập nhật KPI thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageViolations && (
            <button
              onClick={() => setImportViolationModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#0e3a7c]" /> Nhập Excel vi phạm
            </button>
          )}
          {canCreateViolation && (
            <>
              <button
                onClick={handleOpenCreateBonusModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Award className="w-4 h-4" /> Ghi nhận điểm cộng / Khen thưởng
              </button>
              <button
                onClick={handleOpenCreateViolationModal}
                className="px-3.5 py-2 bg-[#d32027] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation"
              >
                <Plus className="w-4 h-4" /> Lập biên bản vi phạm
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rules Grid (L01 - L10 & C01 - C03) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-[#0e3a7c]" /> Quy chế 10 Mã lỗi vi phạm & 3 Tiêu chí cộng điểm thi đua KPI
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Trường THPT Chuyên Hùng Vương
            </span>
            {isAdmin && (
              <button
                onClick={() => {
                  setNewRuleData({
                    code: '',
                    name: '',
                    category: 'KTX',
                    deduction_points: 5,
                    description: '',
                    rule_type: 'deduction',
                  });
                  setCreateRuleModalOpen(true);
                }}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0e3a7c] border border-blue-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm quy định
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {rules.map((r) => {
            const isBonus = isBonusRule(r);
            return (
              <div
                key={r.code}
                className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isBonus
                    ? 'border-emerald-200 bg-emerald-50/40 hover:bg-white hover:border-emerald-500 hover:shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#0e3a7c]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {isBonus ? (
                        <span className="font-mono font-black text-xs text-emerald-800 flex items-center gap-0.5">
                          <Award className="w-3 h-3 text-emerald-600" />
                          {r.code}
                        </span>
                      ) : (
                        <span className="font-mono font-black text-xs text-[#0e3a7c]">{r.code}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isBonus ? (
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                          +{r.deduction_points} đ
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-[#d32027] bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                          -{r.deduction_points} đ
                        </span>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEditRule(r)}
                            className="text-slate-400 hover:text-amber-700 p-0.5 rounded cursor-pointer"
                            title="Sửa quy định"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(r)}
                            className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                            title="Xóa quy định"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-2" title={r.name}>
                    {r.name}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-500 line-clamp-1 truncate max-w-[120px]" title={r.description}>
                    {r.description || (isBonus ? 'Khen thưởng thi đua' : 'Nề nếp học đường')}
                  </span>
                  {isBonus ? (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1 rounded">
                      Cộng điểm
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400">
                      Điểm trừ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-[#0e3a7c]" />
            <span className="font-semibold text-slate-700">Ngày:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => { setDateFilter(''); setPage(1); }}
                className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                title="Xóa lọc ngày"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => { setDateFilter(getTodayVN()); setPage(1); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer touch-manipulation ${
              dateFilter === getTodayVN()
                ? 'bg-[#0e3a7c] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hôm nay
          </button>

          {dateFilter && (
            <button
              onClick={() => { setDateFilter(''); setPage(1); }}
              className="px-2 py-1 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              Tất cả ngày
            </button>
          )}

          <span className="text-slate-300 hidden sm:inline">|</span>

          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>

          <select
            value={ruleFilter}
            onChange={(e) => { setRuleFilter(e.target.value); setPage(1); }}
            className="p-1.5 border border-slate-300 rounded-lg bg-white flex-1 sm:flex-none text-xs"
          >
            <option value="">Tất cả quy chế (L01-L10 & C01-C03)</option>
            <optgroup label="🟢 Tiêu chí cộng điểm (Khen thưởng)">
              {rules.filter(isBonusRule).map((r) => (
                <option key={r.id} value={r.id}>{r.code} - {r.name} (+{r.deduction_points}đ)</option>
              ))}
            </optgroup>
            <optgroup label="🔴 Mã lỗi trừ điểm (Vi phạm)">
              {rules.filter(r => !isBonusRule(r)).map((r) => (
                <option key={r.id} value={r.id}>{r.code} - {r.name} (-{r.deduction_points}đ)</option>
              ))}
            </optgroup>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="p-1.5 border border-slate-300 rounded-lg bg-white flex-1 sm:flex-none text-xs"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="pending">Chờ xét duyệt</option>
            <option value="rejected">Đã từ chối</option>
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchViolations()}
            placeholder="Tìm theo Mã biên bản, tên học sinh..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Violations Container: Dual View (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* MOBILE CARD VIEW (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="px-4 py-12 text-center text-xs text-slate-400">
              Đang tải danh sách biên bản vi phạm...
            </div>
          ) : violations.length === 0 ? (
            <div className="px-4 py-12 text-center text-xs text-slate-400">
              Không có biên bản vi phạm nào phù hợp
            </div>
          ) : (
            violations.map((v, idx) => {
              const isBonus = isBonusRule({ code: v.rule_code, category: (v as any).rule_category });
              const b = statusVariant(v.status, isBonus);
              const isNewest = idx === 0 && page === 1;
              return (
                <div key={v.id} className={`p-3.5 space-y-2.5 transition-colors ${isBonus ? 'bg-emerald-50/20' : isNewest ? 'bg-blue-50/20' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-bold text-xs ${isBonus ? 'text-emerald-800' : 'text-[#0e3a7c]'}`}>{v.code}</span>
                      {isBonus && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                          Khen thưởng
                        </span>
                      )}
                      {isNewest && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          Mới
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isBonus ? (
                        <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                          +{v.points_deducted} đ
                        </span>
                      ) : (
                        <span className="font-extrabold text-xs text-[#d32027] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                          -{v.points_deducted} đ
                        </span>
                      )}
                      <Badge variant={b.variant}>{b.label}</Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">{v.student_name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-[#0e3a7c] font-semibold">{v.student_code}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{v.class_name}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      {isBonus ? (
                        <span className="font-bold text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300 text-[11px]">
                          +{v.rule_code}
                        </span>
                      ) : (
                        <span className="font-bold text-red-700 font-mono bg-red-50 px-1.5 py-0.2 rounded border border-red-200 text-[11px]">
                          {v.rule_code}
                        </span>
                      )}
                      <span className="font-semibold text-slate-800">{v.rule_name}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] pt-0.5">
                      <span className="font-medium text-slate-500">Thời gian:</span> {v.violation_date} {v.violation_time?.substring(0, 5)}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      <span className="font-medium text-slate-500">Địa điểm:</span> {v.location}
                    </div>
                    {v.description && (
                      <div className="text-slate-500 text-[11px] italic pt-0.5">
                        "{v.description}"
                      </div>
                    )}
                    {(v as any).evidence_url && (
                      <button
                        type="button"
                        onClick={() => setViewingEvidenceUrl((v as any).evidence_url)}
                        className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold cursor-pointer transition-colors touch-manipulation"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        Xem ảnh minh chứng
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {v.status === 'pending' && ['admin', 'dorm_manager', 'youth_union'].includes(user?.role || '') && (
                        <>
                          <button
                            onClick={() => handleApprove(v.id)}
                            className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer touch-manipulation"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(v.id)}
                            className="px-3 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer touch-manipulation"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditViolation(v)}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer touch-manipulation"
                        title="Chỉnh sửa bản ghi"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteViolation(v)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer touch-manipulation"
                        title="Xóa bản ghi"
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
                <th className="px-4 py-3">Mã BB / Ghi nhận</th>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-3 py-3">Lớp</th>
                <th className="px-3 py-3">Mã quy chế</th>
                <th className="px-3 py-3">Thời gian</th>
                <th className="px-4 py-3">Địa điểm & Diễn biến / Lý do</th>
                <th className="px-3 py-3">Điểm KPI (+ / -)</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách biên bản & khen thưởng...
                  </td>
                </tr>
              ) : violations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Không có bản ghi nào phù hợp
                  </td>
                </tr>
              ) : (
                violations.map((v, idx) => {
                  const isBonus = isBonusRule({ code: v.rule_code, category: (v as any).rule_category });
                  const b = statusVariant(v.status, isBonus);
                  const isNewest = idx === 0 && page === 1;
                  return (
                    <tr key={v.id} className={`hover:bg-slate-50/80 transition-colors ${isBonus ? 'bg-emerald-50/20' : isNewest ? 'bg-blue-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-mono font-bold ${isBonus ? 'text-emerald-800' : 'text-[#0e3a7c]'}`}>{v.code}</span>
                          {isBonus && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                              Khen thưởng
                            </span>
                          )}
                          {isNewest && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                              Mới nhất
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{v.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{v.student_code}</div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">
                        {v.class_name}
                      </td>
                      <td className="px-3 py-3">
                        {isBonus ? (
                          <span className="font-bold text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
                            +{v.rule_code}
                          </span>
                        ) : (
                          <span className="font-bold text-red-700 font-mono bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                            {v.rule_code}
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{v.rule_name}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {v.violation_date} {v.violation_time?.substring(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs">
                        <div className="font-medium text-slate-800">{v.location}</div>
                        <div className="text-[11px] text-slate-500 truncate" title={v.description}>
                          {v.description}
                        </div>
                        {(v as any).evidence_url && (
                          <button
                            type="button"
                            onClick={() => setViewingEvidenceUrl((v as any).evidence_url)}
                            className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold cursor-pointer transition-colors"
                            title="Bấm để xem ảnh minh chứng"
                          >
                            <Camera className="w-3 h-3 text-blue-600" />
                            Có ảnh minh chứng
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {isBonus ? (
                          <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            +{v.points_deducted} đ
                          </span>
                        ) : (
                          <span className="font-extrabold text-[#d32027]">
                            -{v.points_deducted} đ
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={b.variant}>{b.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {v.status === 'pending' && canCreateViolation && (
                            <>
                              <button
                                onClick={() => handleApprove(v.id)}
                                className="px-2 py-0.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleReject(v.id)}
                                className="px-2 py-0.5 text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {canManageViolations && (
                            <>
                              <button
                                onClick={() => handleOpenEditViolation(v)}
                                className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                                title="Chỉnh sửa biên bản"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteViolation(v)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Xóa biên bản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>Tổng: <strong>{total}</strong> biên bản ghi nhận</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            <span>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      {/* Section 9.5: 3 Cấp độ xử lý kỷ luật KTX */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-3 text-red-800">
          <ShieldAlert className="w-4 h-4 text-[#d32027]" /> 3 cấp độ xử lý nề nếp & kỷ luật ký túc xá (quy chế nhà trường)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {disciplineLevels.map((lvl) => (
            <div key={lvl.level} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase">{lvl.name}</h4>
                <p className="text-xs text-slate-600 mt-1">{lvl.description}</p>
                <div className="text-[11px] text-slate-700 font-medium mt-2 bg-white p-2 rounded border border-slate-200">
                  <strong>Biện pháp:</strong> {lvl.action}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Thẩm quyền: <strong>{lvl.authority}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Create Violation / Bonus Ticket */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={recordType === 'bonus' ? 'Ghi nhận điểm cộng / Khen thưởng thi đua KPI' : 'Lập biên bản vi phạm nề nếp mới'}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateViolationSubmit} className="space-y-4 text-xs text-slate-700">
          {/* Switch Tab: Vi phạm vs Khen thưởng */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setRecordType('violation');
                const firstV = rules.find((r) => !isBonusRule(r));
                setFormViolation((prev) => ({ ...prev, rule_id: firstV ? String(firstV.id) : '' }));
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                recordType === 'violation'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Biên bản vi phạm (Điểm trừ)
            </button>
            <button
              type="button"
              onClick={() => {
                setRecordType('bonus');
                const firstB = rules.find(isBonusRule);
                setFormViolation((prev) => ({ ...prev, rule_id: firstB ? String(firstB.id) : '' }));
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                recordType === 'bonus'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Ghi nhận khen thưởng (Điểm cộng)
            </button>
          </div>

          {/* Student Search & Select */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">
                1. {recordType === 'bonus' ? 'Tìm & Chọn học sinh khen thưởng (*)' : 'Tìm & Chọn học sinh vi phạm (*)'}
              </label>
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
                          setSelectedStudent(searchedStudents[0]);
                          setSearchedStudents([]);
                        }
                      }
                    }}
                    placeholder="Gõ tên hoặc Mã học sinh (kết quả hiển thị ngay thời gian thực)..."
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

                {/* Real-time search feedback / Results list */}
                {isSearchingStudent ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-[#0e3a7c] border-t-transparent rounded-full animate-spin"></div>
                    Đang tìm kiếm học sinh thời gian thực...
                  </div>
                ) : searchedStudents.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="px-3 py-1.5 bg-slate-100 text-[11px] font-bold text-slate-600 flex justify-between items-center">
                      <span>
                        {studentSearch.trim()
                          ? `Kết quả tìm kiếm cho "${studentSearch}" (${searchedStudents.length}):`
                          : `Gợi ý danh sách học sinh (${searchedStudents.length}):`}
                      </span>
                      <span className="text-blue-700 font-semibold">Nhấp hoặc nhấn Enter để chọn</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchedStudents.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => {
                            setSelectedStudent(st);
                            setSearchedStudents([]);
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
                                {st.is_boarding ? (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 text-[10px] flex items-center gap-0.5">
                                    <BedDouble className="w-3 h-3" /> P{st.room_code || 'KTX'}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[10px]">Ngoại trú</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-black text-emerald-700">{st.final_score ?? 100} đ</div>
                            <span className="text-[10px] text-[#0e3a7c] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 group-hover:bg-[#0e3a7c] group-hover:text-white transition-all">
                              Chọn HS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : studentSearch.trim() ? (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Không tìm thấy học sinh nào với từ khóa "{studentSearch}"
                  </div>
                ) : null}
              </div>
            ) : (
              /* Selected Student Rich Card */
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0e3a7c] text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {selectedStudent.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{selectedStudent.full_name}</span>
                      <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-300 text-[#0e3a7c]">
                        {selectedStudent.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Lớp: <strong className="text-slate-800">{selectedStudent.class_name}</strong></span>
                      <span>•</span>
                      <span>
                        {selectedStudent.is_boarding ? (
                          <strong className="text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded border border-emerald-300 text-[11px]">
                            Nội trú: Phòng {selectedStudent.room_code || '---'} (T{selectedStudent.floor_number || '2'})
                          </strong>
                        ) : (
                          <span className="text-slate-600">Ngoại trú</span>
                        )}
                      </span>
                      <span>•</span>
                      <span>KPI: <strong className="text-emerald-800">{selectedStudent.final_score ?? 100}đ</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentSearch('');
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-red-700 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Đổi học sinh
                </button>
              </div>
            )}
          </div>

          {/* Rule Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              2. {recordType === 'bonus' ? 'Tiêu chí khen thưởng / cộng điểm (*)' : 'Mã lỗi vi phạm nề nếp (*)'}
            </label>
            <select
              required
              value={formViolation.rule_id}
              onChange={(e) => setFormViolation({ ...formViolation, rule_id: e.target.value })}
              className={`w-full p-2.5 border rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 ${
                recordType === 'bonus'
                  ? 'border-emerald-300 text-emerald-900 focus:ring-emerald-500'
                  : 'border-slate-300 text-slate-800 focus:ring-blue-500'
              }`}
            >
              <option value="">{recordType === 'bonus' ? '-- Chọn tiêu chí cộng điểm C01 đến C03 --' : '-- Chọn mã lỗi L01 đến L10 --'}</option>
              {recordType === 'bonus' ? (
                rules.filter(isBonusRule).map((r) => (
                  <option key={r.id} value={r.id}>
                    🟢 {r.code}: {r.name} (+{r.deduction_points} điểm)
                  </option>
                ))
              ) : (
                rules.filter((r) => !isBonusRule(r)).map((r) => (
                  <option key={r.id} value={r.id}>
                    🔴 {r.code}: {r.name} (-{r.deduction_points} điểm)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Date, Time & Location (Tự động lấy đúng thời khắc bấm vào) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                3. {recordType === 'bonus' ? 'Thời gian & Địa điểm ghi nhận khen thưởng (*)' : 'Thời gian & Địa điểm xảy ra vi phạm (*)'}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ⏰ Hiện tại: {currentTimeLive || 'Đang cập nhật...'}
                </span>
                <button
                  type="button"
                  onClick={handleSnapToCurrentTime}
                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold rounded cursor-pointer flex items-center gap-1 transition-all"
                  title="Đặt giờ và ngày về đúng thời khắc hiện tại"
                >
                  <RotateCcw className="w-3 h-3 text-amber-600" /> Lấy thời khắc hiện tại
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {recordType === 'bonus' ? 'Ngày ghi nhận' : 'Ngày vi phạm'}
                </label>
                <input
                  type="date"
                  required
                  value={formViolation.violation_date}
                  onChange={(e) => setFormViolation({ ...formViolation, violation_date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {recordType === 'bonus' ? 'Giờ ghi nhận' : 'Giờ vi phạm'}
                </label>
                <div className="relative">
                  <input
                    type="time"
                    required
                    step="60"
                    value={formViolation.violation_time}
                    onChange={(e) => setFormViolation({ ...formViolation, violation_time: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Địa điểm</label>
                <input
                  type="text"
                  required
                  value={formViolation.location}
                  onChange={(e) => setFormViolation({ ...formViolation, location: e.target.value })}
                  placeholder="VD: Khuôn viên trường, Ký túc xá..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Quick Location Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold">Gợi ý địa điểm:</span>
              {['Khuôn viên trường', 'Ký túc xá', 'Lớp học', 'Cổng chính', 'Nhà ăn KTX', 'Phòng tự học'].map((loc) => (
                <button
                  type="button"
                  key={loc}
                  onClick={() => setFormViolation({ ...formViolation, location: loc })}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                    formViolation.location === loc
                      ? 'bg-blue-100 text-[#0e3a7c] border-blue-400 font-bold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              4. {recordType === 'bonus' ? 'Lý do / Thành tích khen thưởng (*)' : 'Mô tả chi tiết sự việc (*)'}
            </label>
            <textarea
              required
              rows={3}
              value={formViolation.description}
              onChange={(e) => setFormViolation({ ...formViolation, description: e.target.value })}
              placeholder={
                recordType === 'bonus'
                  ? 'Ghi rõ thành tích: Đạt giải HSG, NCKH, người tốt việc tốt, trực tuần xuất sắc...'
                  : 'Ghi rõ tình huống, tang vật thu giữ (nếu có), thái độ của học sinh...'
              }
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 5. Ảnh minh chứng vi phạm / Giấy khen (Chọn từ thiết bị) */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#0e3a7c]" /> 5. {recordType === 'bonus' ? 'Ảnh minh chứng / Giấy khen / Cờ thi đua (Chọn từ thiết bị)' : 'Ảnh minh chứng vi phạm / Tang vật (Chọn từ thiết bị)'}
              </label>
              {formViolation.evidence_url && (
                <button
                  type="button"
                  onClick={() => setFormViolation({ ...formViolation, evidence_url: '' })}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold cursor-pointer"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            <input
              type="file"
              ref={evidenceCreateFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleCreateEvidenceSelect}
            />

            {formViolation.evidence_url ? (
              <div className="flex items-center gap-3">
                <img
                  src={formViolation.evidence_url}
                  alt="Minh chứng"
                  className="w-20 h-20 object-cover rounded-lg border border-slate-300 shadow-2xs cursor-pointer hover:opacity-90"
                  onClick={() => setViewingEvidenceUrl(formViolation.evidence_url)}
                  title="Bấm xem phóng to"
                />
                <div className="space-y-1">
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã đính kèm ảnh minh chứng
                  </p>
                  <button
                    type="button"
                    onClick={() => evidenceCreateFileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    Chọn ảnh khác từ thiết bị
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingEvidence}
                  onClick={() => evidenceCreateFileInputRef.current?.click()}
                  className={`px-3 py-1.5 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    recordType === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0e3a7c] hover:bg-[#0a2754]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  {isUploadingEvidence ? 'Đang tải ảnh...' : 'Chụp ảnh hoặc Chọn từ thiết bị'}
                </button>
                <span className="text-[11px] text-slate-400">(Không bắt buộc, hỗ trợ PNG, JPG, WEBP)</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 ${
                recordType === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#d32027] hover:bg-[#b91c1c]'
              }`}
            >
              {recordType === 'bonus' ? (
                <>
                  <Award className="w-4 h-4" /> Lưu & Xác nhận khen thưởng (+)
                </>
              ) : (
                'Lưu & Xác nhận biên bản (-)'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Violation / Bonus Record */}
      <Modal
        isOpen={editViolationModalOpen}
        onClose={() => setEditViolationModalOpen(false)}
        title={
          isBonusRule(rules.find((r) => String(r.id) === String(editViolationForm.rule_id)))
            ? 'Chỉnh sửa ghi nhận khen thưởng / cộng điểm'
            : 'Chỉnh sửa biên bản vi phạm nề nếp'
        }
        maxWidth="lg"
      >
        <form onSubmit={handleEditViolationSubmit} className="space-y-3 text-xs">
          {(() => {
            const currentSelectedRule = rules.find((r) => String(r.id) === String(editViolationForm.rule_id));
            const isBonus = isBonusRule(currentSelectedRule);
            return (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBonus ? 'Tiêu chí khen thưởng (*)' : 'Mã lỗi vi phạm (*)'}
                    </label>
                    <select
                      required
                      value={editViolationForm.rule_id}
                      onChange={(e) => {
                        const r = rules.find((item) => String(item.id) === e.target.value);
                        setEditViolationForm({
                          ...editViolationForm,
                          rule_id: e.target.value,
                          points_deducted: r ? r.deduction_points : editViolationForm.points_deducted,
                        });
                      }}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <optgroup label="🟢 Tiêu chí cộng điểm (Khen thưởng)">
                        {rules.filter(isBonusRule).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.code} - {r.name} (+{r.deduction_points}đ)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🔴 Mã lỗi trừ điểm (Vi phạm)">
                        {rules.filter((r) => !isBonusRule(r)).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.code} - {r.name} (-{r.deduction_points}đ)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className={`block font-bold mb-1 ${isBonus ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {isBonus ? 'Số điểm cộng (+)' : 'Điểm trừ (-)'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={editViolationForm.points_deducted}
                      onChange={(e) => setEditViolationForm({ ...editViolationForm, points_deducted: Number(e.target.value) })}
                      className={`w-full p-2 border rounded-lg font-bold ${
                        isBonus ? 'border-emerald-300 text-emerald-700 bg-emerald-50/20' : 'border-slate-300 text-red-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBonus ? 'Ngày ghi nhận' : 'Ngày vi phạm'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editViolationForm.violation_date}
                      onChange={(e) => setEditViolationForm({ ...editViolationForm, violation_date: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thời gian</label>
                    <input
                      type="time"
                      value={editViolationForm.violation_time}
                      onChange={(e) => setEditViolationForm({ ...editViolationForm, violation_time: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Địa điểm</label>
                    <input
                      type="text"
                      required
                      value={editViolationForm.location}
                      onChange={(e) => setEditViolationForm({ ...editViolationForm, location: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trạng thái phê duyệt</label>
                    <select
                      value={editViolationForm.status}
                      onChange={(e) => setEditViolationForm({ ...editViolationForm, status: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="approved">{isBonus ? 'Đã phê duyệt (Cộng điểm)' : 'Đã phê duyệt (Trừ điểm)'}</option>
                      <option value="pending">Chờ xét duyệt</option>
                      <option value="rejected">{isBonus ? 'Từ chối (Không cộng điểm)' : 'Từ chối (Không trừ điểm)'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isBonus ? 'Lý do / Thành tích khen thưởng (*)' : 'Mô tả sự việc (*)'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={editViolationForm.description}
                    onChange={(e) => setEditViolationForm({ ...editViolationForm, description: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú xử lý / căn cứ</label>
                  <input
                    type="text"
                    value={editViolationForm.notes}
                    onChange={(e) => setEditViolationForm({ ...editViolationForm, notes: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Ảnh minh chứng */}
                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#0e3a7c]" /> {isBonus ? 'Ảnh minh chứng / Giấy khen' : 'Ảnh minh chứng / Tang vật'}
                    </label>
                    {editViolationForm.evidence_url && (
                      <button
                        type="button"
                        onClick={() => setEditViolationForm({ ...editViolationForm, evidence_url: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 font-bold cursor-pointer"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={evidenceEditFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleEditEvidenceSelect}
                  />

                  {editViolationForm.evidence_url ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={editViolationForm.evidence_url}
                        alt="Minh chứng"
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300 shadow-2xs cursor-pointer hover:opacity-90"
                        onClick={() => setViewingEvidenceUrl(editViolationForm.evidence_url)}
                        title="Bấm xem phóng to"
                      />
                      <div className="space-y-1">
                        <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã đính kèm ảnh minh chứng
                        </p>
                        <button
                          type="button"
                          onClick={() => evidenceEditFileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                        >
                          Chọn ảnh khác từ thiết bị
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingEvidence}
                        onClick={() => evidenceEditFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {isUploadingEvidence ? 'Đang tải ảnh...' : 'Chụp ảnh hoặc Chọn từ thiết bị'}
                      </button>
                      <span className="text-[11px] text-slate-400">(Không bắt buộc)</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditViolationModalOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-1.5 text-white font-bold rounded-lg cursor-pointer ${
                      isBonus ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0e3a7c] hover:bg-[#0a2754]'
                    }`}
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </>
            );
          })()}
        </form>
      </Modal>

      {/* Modal: Create KPI Rule */}
      <Modal
        isOpen={createRuleModalOpen}
        onClose={() => setCreateRuleModalOpen(false)}
        title={newRuleData.rule_type === 'bonus' ? 'Thêm tiêu chí cộng điểm KPI mới' : 'Thêm mã lỗi vi phạm KPI mới'}
        maxWidth="md"
      >
        <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
          {/* Rule Type Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Loại tiêu chí</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setNewRuleData({
                    ...newRuleData,
                    rule_type: 'bonus',
                    category: 'khen_thưởng',
                    code: newRuleData.code.startsWith('L') ? 'C0' + (rules.filter(isBonusRule).length + 1) : newRuleData.code,
                  })
                }
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  newRuleData.rule_type === 'bonus'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" /> 🟢 Điểm cộng (Khen thưởng)
              </button>
              <button
                type="button"
                onClick={() =>
                  setNewRuleData({
                    ...newRuleData,
                    rule_type: 'deduction',
                    category: 'KTX',
                    code: newRuleData.code.startsWith('C') ? 'L' + (rules.filter((r) => !isBonusRule(r)).length + 1) : newRuleData.code,
                  })
                }
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  newRuleData.rule_type === 'deduction'
                    ? 'bg-red-50 border-red-400 text-red-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> 🔴 Điểm trừ (Vi phạm)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {newRuleData.rule_type === 'bonus' ? 'Mã tiêu chí (*)' : 'Mã lỗi (*)'}
              </label>
              <input
                type="text"
                required
                placeholder={newRuleData.rule_type === 'bonus' ? 'VD: C04' : 'VD: L11'}
                value={newRuleData.code}
                onChange={(e) => setNewRuleData({ ...newRuleData, code: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-slate-300 rounded-lg uppercase font-mono font-bold"
              />
            </div>
            <div>
              <label className={`block font-bold mb-1 ${newRuleData.rule_type === 'bonus' ? 'text-emerald-700' : 'text-slate-700'}`}>
                {newRuleData.rule_type === 'bonus' ? 'Số điểm cộng (+)*' : 'Điểm trừ (-)*'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                required
                value={newRuleData.deduction_points}
                onChange={(e) => setNewRuleData({ ...newRuleData, deduction_points: Number(e.target.value) })}
                className={`w-full p-2 border rounded-lg font-bold ${
                  newRuleData.rule_type === 'bonus'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50/20'
                    : 'border-slate-300 text-red-600'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {newRuleData.rule_type === 'bonus' ? 'Tên tiêu chí khen thưởng / thi đua (*)' : 'Tên hành vi vi phạm (*)'}
            </label>
            <input
              type="text"
              required
              placeholder={newRuleData.rule_type === 'bonus' ? 'VD: Đạt giải Nhất HSG Quốc gia, NCKH xuất sắc...' : 'VD: Sử dụng điện thoại trong giờ học...'}
              value={newRuleData.name}
              onChange={(e) => setNewRuleData({ ...newRuleData, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phân loại lĩnh vực</label>
            <select
              value={newRuleData.category}
              onChange={(e) => setNewRuleData({ ...newRuleData, category: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="khen_thưởng">Khen thưởng & Thi đua học đường</option>
              <option value="KTX">Ký túc xá & Nề nếp nội trú</option>
              <option value="Học tập">Học tập & Tòa nhà A</option>
              <option value="Chung">Nội quy chung toàn trường</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả và hướng dẫn xử lý / căn cứ</label>
            <textarea
              rows={2}
              value={newRuleData.description}
              onChange={(e) => setNewRuleData({ ...newRuleData, description: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateRuleModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white font-bold rounded-lg cursor-pointer ${
                newRuleData.rule_type === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0e3a7c] hover:bg-[#0a2754]'
              }`}
            >
              Tạo tiêu chí mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit KPI Rule (Hỗ trợ cả Tiêu chí cộng điểm & Mã lỗi trừ điểm) */}
      <Modal
        isOpen={editRuleModalOpen}
        onClose={() => setEditRuleModalOpen(false)}
        title={
          editRuleData.rule_type === 'bonus'
            ? `Chỉnh sửa tiêu chí cộng điểm: ${editRuleData.code}`
            : `Chỉnh sửa quy định vi phạm: ${editRuleData.code}`
        }
        maxWidth="md"
      >
        <form onSubmit={handleEditRule} className="space-y-3 text-xs">
          {/* Rule Type Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Loại tiêu chí</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditRuleData({ ...editRuleData, rule_type: 'bonus', category: 'khen_thưởng' })}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  editRuleData.rule_type === 'bonus'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" /> 🟢 Điểm cộng (Khen thưởng)
              </button>
              <button
                type="button"
                onClick={() => setEditRuleData({ ...editRuleData, rule_type: 'deduction', category: 'KTX' })}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  editRuleData.rule_type === 'deduction'
                    ? 'bg-red-50 border-red-400 text-red-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> 🔴 Điểm trừ (Vi phạm)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {editRuleData.rule_type === 'bonus' ? 'Mã tiêu chí' : 'Mã lỗi'}
              </label>
              <input
                type="text"
                disabled
                value={editRuleData.code}
                className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg uppercase font-mono font-bold text-slate-600"
              />
            </div>
            <div>
              <label className={`block font-bold mb-1 ${editRuleData.rule_type === 'bonus' ? 'text-emerald-700' : 'text-slate-700'}`}>
                {editRuleData.rule_type === 'bonus' ? 'Số điểm cộng (+)*' : 'Điểm trừ (-)*'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                required
                value={editRuleData.deduction_points}
                onChange={(e) => setEditRuleData({ ...editRuleData, deduction_points: Number(e.target.value) })}
                className={`w-full p-2 border rounded-lg font-bold ${
                  editRuleData.rule_type === 'bonus'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50/20'
                    : 'border-slate-300 text-red-600'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {editRuleData.rule_type === 'bonus' ? 'Tên tiêu chí khen thưởng / thi đua (*)' : 'Tên hành vi vi phạm (*)'}
            </label>
            <input
              type="text"
              required
              value={editRuleData.name}
              onChange={(e) => setEditRuleData({ ...editRuleData, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phân loại lĩnh vực</label>
            <select
              value={editRuleData.category}
              onChange={(e) => setEditRuleData({ ...editRuleData, category: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="khen_thưởng">Khen thưởng & Thi đua học đường</option>
              <option value="KTX">Ký túc xá & Nề nếp nội trú</option>
              <option value="Học tập">Học tập & Tòa nhà A</option>
              <option value="Chung">Nội quy chung toàn trường</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả và hướng dẫn xử lý / căn cứ</label>
            <textarea
              rows={2}
              value={editRuleData.description}
              onChange={(e) => setEditRuleData({ ...editRuleData, description: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditRuleModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-white font-bold rounded-lg cursor-pointer ${
                editRuleData.rule_type === 'bonus' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#0e3a7c] hover:bg-[#0a2754]'
              }`}
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Import Violations with Excel (.xlsx / .csv) */}
      <ExcelImportModal
        isOpen={importViolationModalOpen}
        onClose={() => setImportViolationModalOpen(false)}
        title="Nhập biên bản vi phạm nề nếp từ file Excel / CSV"
        description="Cho phép ban quản nhiệm, ban thi đua cờ đỏ hoặc đoàn thanh niên tải file mẫu, kéo thả hoặc chọn file Excel (.xlsx, .xls) hoặc CSV để ghi nhận hàng loạt biên bản vi phạm trong tuần. Hệ thống tự động đối soát mã học sinh, mã lỗi (L01-L10), tự động trừ điểm KPI và cập nhật bảng xếp loại."
        templateFileName="Mau_Nhap_Vi_Pham_KPI_Hung_Vuong"
        sampleTemplateData={sampleViolationTemplate}
        columns={violationImportColumns}
        onImport={async (items) => {
          const res: any = await api.post('/kpi/violations/import', { items });
          return res;
        }}
        onSuccess={() => {
          fetchViolations();
        }}
      />

      {/* Modal Lightbox: Xem ảnh minh chứng phóng to */}
      <Modal
        isOpen={!!viewingEvidenceUrl}
        onClose={() => setViewingEvidenceUrl(null)}
        title="Ảnh minh chứng vi phạm nề nếp"
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[300px] max-h-[70vh]">
            {viewingEvidenceUrl && (
              <img
                src={viewingEvidenceUrl}
                alt="Minh chứng vi phạm"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ảnh chụp thực tế từ thiết bị của người lập biên bản.</span>
            {viewingEvidenceUrl && (
              <a
                href={viewingEvidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#0e3a7c] hover:underline font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Mở trong tab mới
              </a>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
