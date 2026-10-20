import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Student, ClassInfo } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ExcelImportModal, type ColumnMapping } from '../components/ExcelImportModal';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  GraduationCap,
  AlertCircle,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

const studentImportColumns: ColumnMapping[] = [
  { key: 'code', label: 'Mã học sinh', aliases: ['Mã học sinh', 'Mã HS', 'Ma HS', 'code', 'student_code'], required: true },
  { key: 'full_name', label: 'Họ và tên', aliases: ['Họ và tên', 'Họ tên', 'Tên học sinh', 'full_name', 'name'], required: true },
  { key: 'class', label: 'Lớp chuyên', aliases: ['Lớp chuyên', 'Lớp', 'Tên lớp', 'class', 'class_name'], required: true },
  { key: 'gender', label: 'Giới tính', aliases: ['Giới tính', 'Phái', 'gender'] },
  { key: 'dob', label: 'Ngày sinh', aliases: ['Ngày sinh', 'dob', 'birth_date'] },
  { key: 'is_boarding', label: 'Nội trú', aliases: ['Nội trú', 'Hình thức', 'is_boarding', 'noi_tru'] },
  { key: 'parent_name', label: 'Họ tên phụ huynh', aliases: ['Họ tên phụ huynh', 'Phụ huynh', 'parent_name'] },
  { key: 'parent_phone', label: 'SĐT phụ huynh', aliases: ['SĐT phụ huynh', 'Số điện thoại PH', 'parent_phone'] },
  { key: 'student_phone', label: 'SĐT học sinh', aliases: ['SĐT học sinh', 'Số điện thoại HS', 'student_phone'] },
  { key: 'hometown', label: 'Quê quán', aliases: ['Quê quán', 'Địa chỉ', 'hometown'] },
];

const sampleStudentTemplate = [
  {
    'Mã học sinh': 'HV10901',
    'Họ và tên': 'Nguyễn Văn Minh',
    'Lớp chuyên': '10 Chuyên Toán 1',
    'Giới tính': 'Nam',
    'Ngày sinh': '2010-03-15',
    'Nội trú': 'Có',
    'Họ tên phụ huynh': 'Nguyễn Văn Hùng',
    'SĐT phụ huynh': '0912345678',
    'SĐT học sinh': '0987654321',
    'Quê quán': 'Huyện Lâm Thao, Phú Thọ',
  },
  {
    'Mã học sinh': 'HV10902',
    'Họ và tên': 'Trần Thị Thu Hà',
    'Lớp chuyên': '10 Chuyên Văn 1',
    'Giới tính': 'Nữ',
    'Ngày sinh': '2010-07-22',
    'Nội trú': 'Không',
    'Họ tên phụ huynh': 'Trần Đình Nam',
    'SĐT phụ huynh': '0988112233',
    'SĐT học sinh': '0977223344',
    'Quê quán': 'TP. Việt Trì, Phú Thọ',
  },
  {
    'Mã học sinh': 'HV10903',
    'Họ và tên': 'Lê Hoàng Long',
    'Lớp chuyên': '10 Chuyên Tin',
    'Giới tính': 'Nam',
    'Ngày sinh': '2010-11-05',
    'Nội trú': 'Có',
    'Họ tên phụ huynh': 'Lê Văn Tuấn',
    'SĐT phụ huynh': '0903456789',
    'SĐT học sinh': '0912987654',
    'Quê quán': 'Thị xã Phú Thọ, Phú Thọ',
  },
];

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [classId, setClassId] = useState('');
  const [isBoarding, setIsBoarding] = useState('');
  const [gender, setGender] = useState('');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Form State for Add
  const [formData, setFormData] = useState({
    code: '',
    full_name: '',
    dob: '2010-01-01',
    gender: 'Nam',
    class_id: '',
    is_boarding: 0,
    parent_name: '',
    parent_phone: '',
    student_phone: '',
    hometown: 'TP. Việt Trì, Phú Thọ',
  });

  // Form State for Edit
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    code: '',
    full_name: '',
    dob: '2010-01-01',
    gender: 'Nam',
    class_id: '',
    is_boarding: 0,
    parent_name: '',
    parent_phone: '',
    student_phone: '',
    hometown: '',
    status: 'studying',
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/students', {
        page,
        limit: 15,
        search,
        grade,
        class_id: classId,
        is_boarding: isBoarding,
        gender,
      });
      setStudents(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data: any = await api.get('/classes');
      setClasses(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, grade, classId, isBoarding, gender]);

  // Real-time search debounce as user types student name or code
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleViewDetail = async (st: Student) => {
    try {
      const full: any = await api.get(`/students/${st.id}`);
      setSelectedStudent(full);
      setDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      setAddModalOpen(false);
      fetchStudents();
      alert('Thêm hồ sơ học sinh thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi thêm học sinh');
    }
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudentId(st.id);
    setEditFormData({
      code: st.code,
      full_name: st.full_name,
      dob: st.dob || '2010-01-01',
      gender: st.gender || 'Nam',
      class_id: String(st.class_id || ''),
      is_boarding: st.is_boarding || 0,
      parent_name: st.parent_name || '',
      parent_phone: st.parent_phone || '',
      student_phone: st.student_phone || '',
      hometown: st.hometown || '',
      status: st.status || 'studying',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    try {
      await api.put(`/students/${editingStudentId}`, editFormData);
      setEditModalOpen(false);
      fetchStudents();
      if (selectedStudent && selectedStudent.id === editingStudentId) {
        handleViewDetail(selectedStudent);
      }
      alert('Cập nhật hồ sơ học sinh thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật học sinh');
    }
  };

  const handleDeleteStudent = async (st: Student) => {
    if (!window.confirm(`Xác nhận xóa học sinh "${st.full_name}" (${st.code}) khỏi hệ thống?\nThao tác này sẽ tự động giảm sĩ số lớp và giải phóng phòng KTX (nếu có).`)) {
      return;
    }
    try {
      await api.delete(`/students/${st.id}`);
      alert(`Đã xóa học sinh ${st.full_name} thành công`);
      setDetailModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa học sinh');
    }
  };

  const handleExportCsv = () => {
    const token = localStorage.getItem('token') || '';
    window.open(`/api/students/export?grade=${grade}&class_id=${classId}&token=${encodeURIComponent(token)}`, '_blank');
  };

  const classificationVariant = (cls?: string) => {
    switch (cls) {
      case 'Xuất sắc': return 'gold';
      case 'Tốt': return 'success';
      case 'Đạt': return 'warning';
      case 'Chưa đạt': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Quản lý hồ sơ học sinh
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Tổng số: <strong className="text-[#0e3a7c]">{total.toLocaleString()}</strong> học sinh toàn trường (Khối 10, 11, 12)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer touch-action-manipulation"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Xuất CSV
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex-1 sm:flex-none justify-center px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer touch-action-manipulation"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" /> Nhập Excel
              </button>
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex-1 sm:flex-none justify-center px-3 py-1.5 sm:py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer touch-action-manipulation"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm HS
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 sm:space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo Họ tên, Mã học sinh (VD: HV100012) hoặc Quê quán..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#0e3a7c] text-white text-xs font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer touch-action-manipulation"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="col-span-2 sm:col-span-1 font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Bộ lọc:
          </span>

          <select
            value={grade}
            onChange={(e) => { setGrade(e.target.value); setClassId(''); setPage(1); }}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 w-full sm:w-auto"
          >
            <option value="">Tất cả các Khối</option>
            <option value="10">Khối 10 (17 lớp)</option>
            <option value="11">Khối 11 (17 lớp)</option>
            <option value="12">Khối 12 (20 lớp)</option>
          </select>

          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 w-full sm:w-auto max-w-full sm:max-w-xs"
          >
            <option value="">Tất cả 54 lớp chuyên</option>
            {classes
              .filter((c) => !grade || c.grade_level === Number(grade))
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>

          <select
            value={isBoarding}
            onChange={(e) => { setIsBoarding(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 w-full sm:w-auto"
          >
            <option value="">Tất cả hình thức</option>
            <option value="1">Nội trú KTX (699 HS)</option>
            <option value="0">Ngoại trú (1.181 HS)</option>
          </select>

          <select
            value={gender}
            onChange={(e) => { setGender(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 w-full sm:w-auto"
          >
            <option value="">Giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>

          {(search || grade || classId || isBoarding || gender) && (
            <button
              onClick={() => { setSearch(''); setGrade(''); setClassId(''); setIsBoarding(''); setGender(''); setPage(1); }}
              className="text-xs text-red-600 hover:underline font-semibold ml-auto"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Mã HS</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-3 py-3">Giới tính</th>
                <th className="px-3 py-3">Lớp</th>
                <th className="px-3 py-3">Hình thức</th>
                <th className="px-3 py-3">Phòng KTX</th>
                <th className="px-3 py-3">Điểm KPI</th>
                <th className="px-3 py-3">Xếp loại</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Đang tải danh sách học sinh...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0e3a7c]">
                      {st.code}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {st.full_name}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${st.gender === 'Nam' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                        {st.gender}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">
                      {st.class_name}
                    </td>
                    <td className="px-3 py-3">
                      {st.is_boarding === 1 ? (
                        <Badge variant="info">Nội trú</Badge>
                      ) : (
                        <Badge variant="neutral">Ngoại trú</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium">
                      {st.room_code ? (
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {st.room_code} (T{st.floor_number})
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-extrabold text-slate-900">
                      {st.final_score ?? 100} đ
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={classificationVariant(st.classification)}>
                        {st.classification || 'Xuất sắc'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/official-document?tab=student&id=${st.id}`)}
                          className="px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="In phiếu KPI cá nhân (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleViewDetail(st)}
                          className="px-2 py-1 text-xs font-semibold text-[#0e3a7c] hover:bg-blue-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(st)}
                              className="px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Sửa hồ sơ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(st)}
                              className="px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng {total} học sinh)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-slate-700">{page}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Student Detail Profile (Section 5.1) */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Hồ sơ học sinh: ${selectedStudent?.full_name || ''}`}
        maxWidth="2xl"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Header summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-black text-[#0e3a7c]">{selectedStudent.code}</span>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedStudent.full_name}</h4>
                <p className="text-slate-500 text-xs">
                  {selectedStudent.class_name} • GVCN: <strong>{selectedStudent.teacher_name || 'Đang cập nhật'}</strong>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-slate-900">{selectedStudent.final_score ?? 100} <span className="text-xs font-normal text-slate-500">/ 100đ</span></div>
                <Badge variant={classificationVariant(selectedStudent.classification)}>
                  {selectedStudent.classification || 'Xuất sắc'}
                </Badge>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div><strong>Ngày sinh:</strong> {selectedStudent.dob}</div>
              <div><strong>Giới tính:</strong> {selectedStudent.gender}</div>
              <div><strong>Hình thức:</strong> {selectedStudent.is_boarding === 1 ? 'Nội trú KTX' : 'Ngoại trú'}</div>
              <div><strong>Phòng KTX:</strong> {selectedStudent.room_code ? `${selectedStudent.room_code} (Tầng ${selectedStudent.floor_number})` : 'Không'}</div>
              <div><strong>Quê quán:</strong> {selectedStudent.hometown || 'Chưa cập nhật'}</div>
              <div><strong>Số CCCD:</strong> {selectedStudent.id_card_number || 'Bảo mật'}</div>
              <div><strong>Phụ huynh:</strong> {selectedStudent.parent_name || 'Chưa cập nhật'}</div>
              <div><strong>SĐT phụ huynh:</strong> {selectedStudent.parent_phone || 'Bảo mật'}</div>
            </div>

            {/* Violations History in Period */}
            <div>
              <h5 className="font-bold text-slate-900 text-xs uppercase mb-2 flex items-center gap-1.5 text-red-700">
                <AlertCircle className="w-4 h-4 text-[#d32027]" /> Lịch sử vi phạm nền nếp & trừ điểm KPI
              </h5>
              {!selectedStudent.violations || selectedStudent.violations.length === 0 ? (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-xs">
                  ✓ Học sinh gương mẫu, chưa ghi nhận bất kỳ vi phạm nào trong kỳ đánh giá.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedStudent.violations.map((v) => (
                    <div key={v.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#d32027] font-mono">[{v.rule_code}]</span>{' '}
                        <span className="font-semibold text-slate-800">{v.rule_name}</span>
                        <p className="text-[11px] text-slate-500">{v.violation_date} • {v.location} • {v.description}</p>
                      </div>
                      <div className="font-extrabold text-red-600">
                        -{v.points_deducted} điểm
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(selectedStudent)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa học sinh này
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    navigate(`/official-document?tab=student&id=${selectedStudent.id}`);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> In Phiếu KPI (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenEdit(selectedStudent);
                    }}
                    className="px-4 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa hồ sơ
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Student */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Thêm hồ sơ học sinh mới"
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã học sinh (*)</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: HV100999"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ và tên (*)</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="VD: Nguyễn Văn A"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lớp (*)</label>
              <select
                required
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Chọn lớp --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hình thức</label>
              <select
                value={formData.is_boarding}
                onChange={(e) => setFormData({ ...formData, is_boarding: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={0}>Ngoại trú</option>
                <option value={1}>Nội trú KTX</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ tên Phụ huynh</label>
              <input
                type="text"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SĐT Phụ huynh</label>
              <input
                type="text"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Quê quán</label>
            <input
              type="text"
              value={formData.hometown}
              onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Student */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Chỉnh sửa hồ sơ: ${editFormData.full_name} (${editFormData.code})`}
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã học sinh</label>
              <input
                type="text"
                disabled
                value={editFormData.code}
                className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-slate-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ và tên (*)</label>
              <input
                type="text"
                required
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Lớp (*)</label>
              <select
                required
                value={editFormData.class_id}
                onChange={(e) => setEditFormData({ ...editFormData, class_id: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">-- Chọn lớp --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
              <select
                value={editFormData.gender}
                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hình thức</label>
              <select
                value={editFormData.is_boarding}
                onChange={(e) => setEditFormData({ ...editFormData, is_boarding: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={0}>Ngoại trú</option>
                <option value={1}>Nội trú KTX</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={editFormData.dob}
                onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái học tập</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="studying">Đang học tập</option>
                <option value="reserved">Bảo lưu</option>
                <option value="transferred">Chuyển trường</option>
                <option value="graduated">Đã tốt nghiệp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Họ tên phụ huynh</label>
              <input
                type="text"
                value={editFormData.parent_name}
                onChange={(e) => setEditFormData({ ...editFormData, parent_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">SĐT phụ huynh</label>
              <input
                type="text"
                value={editFormData.parent_phone}
                onChange={(e) => setEditFormData({ ...editFormData, parent_phone: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">SĐT học sinh</label>
              <input
                type="text"
                value={editFormData.student_phone}
                onChange={(e) => setEditFormData({ ...editFormData, student_phone: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quê quán</label>
              <input
                type="text"
                value={editFormData.hometown}
                onChange={(e) => setEditFormData({ ...editFormData, hometown: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Cập nhật hồ sơ
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Import Students with Excel (.xlsx / .csv) */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Nhập danh sách học sinh từ file Excel / CSV"
        description="Hệ thống hỗ trợ tải file mẫu Excel chuẩn, kéo thả hoặc chọn file Excel (.xlsx, .xls) hoặc CSV. Hệ thống tự động nhận diện các cột, chuẩn hóa ngày sinh, phân loại nội trú/ngoại trú, kiểm tra trùng mã học sinh và đối chiếu với danh mục 54 lớp chuyên."
        templateFileName="Mau_Nhap_Hoc_Sinh_Chuyen_Hung_Vuong"
        sampleTemplateData={sampleStudentTemplate}
        columns={studentImportColumns}
        onImport={async (items) => {
          const res: any = await api.post('/students/import', { items });
          return res;
        }}
        onSuccess={() => {
          fetchStudents();
        }}
      />
    </div>
  );
};
