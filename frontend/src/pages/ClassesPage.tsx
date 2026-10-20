import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { ClassInfo, Student } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ExcelImportModal, type ColumnMapping } from '../components/ExcelImportModal';
import {
  GraduationCap,
  Users,
  Building,
  Award,
  AlertCircle,
  Eye,
  Filter,
  Search,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Printer,
  Upload,
  CalendarCheck2,
  UserCheck,
  UserPlus,
} from 'lucide-react';

interface TeacherOption {
  id: number;
  code: string;
  full_name: string;
  phone?: string;
  email?: string;
  subject?: string;
  is_duty_teacher?: number;
  current_class_id?: number | null;
  current_class_name?: string | null;
}
import { useAuth } from '../context/AuthContext';
import { useSchoolSettings } from '../context/SchoolSettingsContext';

const classImportColumns: ColumnMapping[] = [
  { key: 'code', label: 'Mã lớp', aliases: ['Mã lớp', 'Mã', 'code', 'class_code'], required: true },
  { key: 'name', label: 'Tên lớp chuyên', aliases: ['Tên lớp chuyên', 'Tên lớp', 'Lớp', 'name', 'class_name'], required: true },
  { key: 'grade_level', label: 'Khối lớp', aliases: ['Khối lớp', 'Khối', 'grade', 'grade_level'] },
  { key: 'room_location', label: 'Phòng học / Vị trí', aliases: ['Phòng học', 'Địa điểm', 'Phòng', 'room_location', 'location'] },
  { key: 'teacher_name', label: 'Họ tên GVCN', aliases: ['Họ tên GVCN', 'GVCN', 'Giáo viên chủ nhiệm', 'teacher_name'] },
];

const sampleClassTemplate = [
  {
    'Mã lớp': '10T1',
    'Tên lớp chuyên': '10 Chuyên Toán 1',
    'Khối lớp': 10,
    'Phòng học / Vị trí': 'Phòng 101 - Tòa nhà A',
    'Họ tên GVCN': 'Nguyễn Văn Kính',
  },
  {
    'Mã lớp': '10Tin',
    'Tên lớp chuyên': '10 Chuyên Tin',
    'Khối lớp': 10,
    'Phòng học / Vị trí': 'Phòng 103 - Tòa nhà A',
    'Họ tên GVCN': 'Trần Văn Tuấn',
  },
  {
    'Mã lớp': '11L1',
    'Tên lớp chuyên': '11 Chuyên Lý 1',
    'Khối lớp': 11,
    'Phòng học / Vị trí': 'Phòng 201 - Tòa nhà A',
    'Họ tên GVCN': 'Lê Thị Thu',
  },
  {
    'Mã lớp': '12A1',
    'Tên lớp chuyên': '12 Chuyên Anh 1',
    'Khối lớp': 12,
    'Phòng học / Vị trí': 'Phòng 301 - Tòa nhà A',
    'Họ tên GVCN': 'Phạm Hoàng Long',
  },
  {
    'Mã lớp': '12H1',
    'Tên lớp chuyên': '12 Chuyên Hóa 1',
    'Khối lớp': 12,
    'Phòng học / Vị trí': 'Phòng 305 - Tòa nhà A',
    'Họ tên GVCN': 'Bùi Thị Hà',
  },
];

export const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Selected class modal
  const [activeClass, setActiveClass] = useState<ClassInfo | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [modalStudentSearch, setModalStudentSearch] = useState<string>('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // CRUD & Import Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClassData, setNewClassData] = useState({
    code: '',
    name: '',
    grade_level: 10,
    room_location: 'Tòa nhà A',
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editClassData, setEditClassData] = useState<{
    code: string;
    name: string;
    grade_level: number;
    room_location: string;
    homeroom_teacher_id: number | string;
  }>({
    code: '',
    name: '',
    grade_level: 10,
    room_location: '',
    homeroom_teacher_id: '',
  });

  // Teacher management state
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [changeTeacherModalOpen, setChangeTeacherModalOpen] = useState(false);
  const [targetClassForTeacher, setTargetClassForTeacher] = useState<ClassInfo | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(''); // '' | id | 'new'
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherSubject, setNewTeacherSubject] = useState('');
  const [savingTeacher, setSavingTeacher] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/classes', { grade: selectedGrade });
      setClasses(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data: any = await api.get('/classes/teachers-list');
      setTeachers(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách GV:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [selectedGrade]);

  const handleOpenClass = async (cls: ClassInfo) => {
    setActiveClass(cls);
    setModalStudentSearch('');
    setModalOpen(true);
    setStudentsLoading(true);
    try {
      const data: any = await api.get(`/classes/${cls.id}/students`);
      setClassStudents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classes', newClassData);
      alert('Tạo lớp chuyên mới thành công!');
      setCreateModalOpen(false);
      setNewClassData({ code: '', name: '', grade_level: 10, room_location: 'Tòa nhà A' });
      fetchClasses();
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo lớp');
    }
  };

  const handleOpenEdit = (cls: ClassInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClassId(cls.id);
    const matched = teachers.find(
      (t) => t.id === (cls as any).teacher_id || t.id === (cls as any).homeroom_teacher_id || t.full_name === cls.teacher_name
    );
    setEditClassData({
      code: cls.code,
      name: cls.name,
      grade_level: cls.grade_level,
      room_location: (cls as any).room_location || 'Tòa nhà A',
      homeroom_teacher_id: matched ? matched.id : '',
    });
    setEditModalOpen(true);
  };

  const handleEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassId) return;
    try {
      const payload = {
        ...editClassData,
        homeroom_teacher_id: editClassData.homeroom_teacher_id ? Number(editClassData.homeroom_teacher_id) : null,
      };
      await api.put(`/classes/${editingClassId}`, payload);
      alert('Cập nhật thông tin lớp thành công!');
      setEditModalOpen(false);
      fetchClasses();
      fetchTeachers();
      if (activeClass && activeClass.id === editingClassId) {
        const t = teachers.find((item) => item.id === Number(editClassData.homeroom_teacher_id));
        setActiveClass({
          ...activeClass,
          name: editClassData.name,
          grade_level: editClassData.grade_level,
          room_location: editClassData.room_location,
          teacher_id: t ? t.id : undefined,
          teacher_name: t ? t.full_name : activeClass.teacher_name,
          teacher_phone: t ? t.phone : activeClass.teacher_phone,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật lớp');
    }
  };

  const handleOpenChangeTeacher = (cls: ClassInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetClassForTeacher(cls);
    const matched = teachers.find(
      (t) => t.id === (cls as any).teacher_id || t.id === (cls as any).homeroom_teacher_id || t.full_name === cls.teacher_name
    );
    if (matched) {
      setSelectedTeacherId(String(matched.id));
    } else {
      setSelectedTeacherId('');
    }
    setNewTeacherName('');
    setNewTeacherPhone('');
    setNewTeacherSubject('Bộ môn');
    setChangeTeacherModalOpen(true);
  };

  const handleChangeTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClassForTeacher) return;
    setSavingTeacher(true);
    try {
      let payload: any = {};
      if (selectedTeacherId === 'new') {
        if (!newTeacherName.trim()) {
          alert('Vui lòng nhập họ và tên của giáo viên mới');
          setSavingTeacher(false);
          return;
        }
        payload = {
          teacher_id: null,
          teacher_name: newTeacherName.trim(),
          phone: newTeacherPhone.trim(),
          subject: newTeacherSubject.trim() || 'Bộ môn',
        };
      } else if (selectedTeacherId) {
        payload = {
          teacher_id: Number(selectedTeacherId),
        };
      } else {
        payload = {
          teacher_id: null,
          teacher_name: '',
        };
      }

      const res: any = await api.post(`/classes/${targetClassForTeacher.id}/change-teacher`, payload);
      alert(res?.message || 'Cập nhật Giáo viên chủ nhiệm thành công!');
      setChangeTeacherModalOpen(false);
      fetchClasses();
      fetchTeachers();
      if (activeClass && activeClass.id === targetClassForTeacher.id) {
        const updatedTeacher = res?.data?.teacher;
        setActiveClass({
          ...activeClass,
          teacher_id: updatedTeacher ? updatedTeacher.id : undefined,
          teacher_name: updatedTeacher ? updatedTeacher.full_name : (selectedTeacherId === 'new' ? newTeacherName : ''),
          teacher_phone: updatedTeacher ? updatedTeacher.phone : (selectedTeacherId === 'new' ? newTeacherPhone : ''),
        });
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi cập nhật Giáo viên chủ nhiệm');
    } finally {
      setSavingTeacher(false);
    }
  };

  const handleDeleteClass = async (cls: ClassInfo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (cls.total_students > 0) {
      alert(`Không thể xóa lớp "${cls.name}" vì đang có ${cls.total_students} học sinh. Hãy điều chuyển học sinh trước.`);
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lớp chuyên "${cls.name}" (${cls.code}) khỏi hệ thống?`)) {
      return;
    }
    try {
      await api.delete(`/classes/${cls.id}`);
      alert(`Đã xóa lớp ${cls.name} thành công`);
      setModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa lớp');
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.teacher_name && c.teacher_name.toLowerCase().includes(search.toLowerCase()))
  );

  const { settings: schoolSettings } = useSchoolSettings();
  const countAll = classes.length;
  const countK10 = classes.filter(c => String(c.grade_level) === '10').length;
  const countK11 = classes.filter(c => String(c.grade_level) === '11').length;
  const countK12 = classes.filter(c => String(c.grade_level) === '12').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {classes.length > 0 ? `${classes.length} lớp học` : 'Danh sách lớp học'} — {schoolSettings.school_name || 'Hệ thống'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {classes.length > 0 ? (
              <>Khối 10 ({countK10} lớp) • Khối 11 ({countK11} lớp) • Khối 12 ({countK12} lớp)</>
            ) : (
              'Không gian trường học mới • Chưa có lớp học nào trong hệ thống'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Grade tabs */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedGrade('')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap touch-manipulation ${
                selectedGrade === '' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả ({countAll})
            </button>
            <button
              onClick={() => setSelectedGrade('10')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap touch-manipulation ${
                selectedGrade === '10' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Khối 10 ({countK10})
            </button>
            <button
              onClick={() => setSelectedGrade('11')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap touch-manipulation ${
                selectedGrade === '11' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Khối 11 ({countK11})
            </button>
            <button
              onClick={() => setSelectedGrade('12')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap touch-manipulation ${
                selectedGrade === '12' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Khối 12 ({countK12})
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all touch-manipulation"
              >
                <Upload className="w-4 h-4 text-[#0e3a7c]" /> Nhập Excel
              </button>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex-1 sm:flex-none px-3 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all touch-manipulation"
              >
                <Plus className="w-4 h-4" /> Thêm lớp
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên lớp, chuyên môn hoặc tên GVCN..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c] bg-white shadow-2xs"
        />
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredClasses.map((cls) => {
          const kpiScore = cls.avg_kpi || 100.0;
          return (
            <div
              key={cls.id}
              onClick={() => handleOpenClass(cls)}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-[#0e3a7c] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {cls.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {kpiScore} đ
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/official-document?tab=class&id=${cls.id}`);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="In bảng điểm KPI lớp này (A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/class-attendance');
                      }}
                      className="p-1 text-slate-400 hover:text-[#0e3a7c] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Điểm danh đầu giờ lớp này"
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => handleOpenEdit(cls, e)}
                          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                          title="Sửa thông tin lớp"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenChangeTeacher(cls, e)}
                          className="p-1 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          title="Đổi Giáo viên chủ nhiệm (GVCN)"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClass(cls, e)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Xóa lớp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#0e3a7c] transition-colors">
                  {cls.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <p className="truncate mr-1">
                    GVCN: <strong className="text-slate-800">{cls.teacher_name || 'Đang cập nhật'}</strong>
                  </p>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleOpenChangeTeacher(cls, e)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 rounded cursor-pointer transition-colors shrink-0"
                      title="Thay đổi Giáo viên chủ nhiệm"
                    >
                      <UserCheck className="w-3 h-3" /> Đổi GVCN
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> Sĩ số: <strong>{cls.total_students}</strong>
                  </span>
                  <span className="font-extrabold text-[#0e3a7c]">
                    KPI: {cls.avg_kpi || 100} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    <Building className="w-3 h-3" /> Nội trú: <strong>{cls.boarding_students}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    Ngoại trú: <strong>{Math.max(0, cls.total_students - cls.boarding_students)}</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when school is clean slate */}
      {filteredClasses.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0e3a7c] flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 mb-1">
            Không gian trường học đang trắng tinh!
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Hệ thống độc lập của <strong>{schoolSettings.school_name || 'trường'}</strong> đã sẵn sàng. Bạn có thể nạp toàn bộ danh sách lớp và học sinh từ file Excel hoặc tạo lớp thủ công.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setImportModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" /> Nạp danh sách lớp bằng Excel
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-[#0e3a7c]" /> Thêm lớp thủ công
            </button>
          </div>
        </div>
      )}

      {/* Class Students Roster Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeClass ? `Danh sách học sinh: ${activeClass.name}` : ''}
        maxWidth="4xl"
      >
        {activeClass && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
              <div className="flex items-center gap-2">
                <span>
                  GVCN: <strong className="text-slate-900">{activeClass.teacher_name || 'Chưa phân công'}</strong>
                  {activeClass.teacher_phone ? ` • SĐT: ${activeClass.teacher_phone}` : ''}
                </span>
                <button
                  onClick={() => handleOpenChangeTeacher(activeClass)}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded flex items-center gap-1 shadow-2xs cursor-pointer transition-colors ml-1"
                  title="Thay đổi Giáo viên chủ nhiệm cho lớp này"
                >
                  <UserCheck className="w-3 h-3" /> Đổi GVCN
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span>Sĩ số: <strong>{activeClass.total_students}</strong> HS</span>
                <span className="text-blue-700 font-semibold">Nội trú: <strong>{activeClass.boarding_students}</strong> HS</span>
                <span className="text-slate-600 font-semibold">Ngoại trú: <strong>{Math.max(0, activeClass.total_students - activeClass.boarding_students)}</strong> HS</span>
                <span className="text-[#0e3a7c] font-extrabold">Điểm KPI TB: {activeClass.avg_kpi} đ</span>
                <button
                  onClick={() => navigate(`/official-document?tab=class&id=${activeClass.id}`)}
                  className="px-2.5 py-1 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer ml-1"
                >
                  <Printer className="w-3.5 h-3.5" /> In Bảng KPI Lớp (A4)
                </button>
              </div>
            </div>

            {/* Modal Student Search & Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={modalStudentSearch}
                  onChange={(e) => setModalStudentSearch(e.target.value)}
                  placeholder="Tìm học sinh theo tên, mã HS, phòng..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c] bg-white shadow-2xs"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Danh sách: <strong className="text-slate-800">{
                  classStudents.filter(st =>
                    st.full_name.toLowerCase().includes(modalStudentSearch.toLowerCase()) ||
                    st.code.toLowerCase().includes(modalStudentSearch.toLowerCase()) ||
                    (st.room_code && st.room_code.toLowerCase().includes(modalStudentSearch.toLowerCase()))
                  ).length
                }</strong> / {classStudents.length} học sinh
              </div>
            </div>

            {studentsLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0e3a7c] border-t-transparent rounded-full animate-spin" />
                <span>Đang tải danh sách học sinh của lớp...</span>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[50vh] border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">STT</th>
                      <th className="px-3 py-2.5">Mã HS</th>
                      <th className="px-3 py-2.5">Họ và tên</th>
                      <th className="px-2 py-2.5">Giới tính</th>
                      <th className="px-3 py-2.5">Hình thức</th>
                      <th className="px-3 py-2.5">Phòng KTX</th>
                      <th className="px-2 py-2.5">Điểm KPI</th>
                      <th className="px-3 py-2.5">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.filter(st =>
                      st.full_name.toLowerCase().includes(modalStudentSearch.toLowerCase()) ||
                      st.code.toLowerCase().includes(modalStudentSearch.toLowerCase()) ||
                      (st.room_code && st.room_code.toLowerCase().includes(modalStudentSearch.toLowerCase()))
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                          {classStudents.length === 0
                            ? 'Lớp này hiện chưa có dữ liệu học sinh.'
                            : 'Không tìm thấy học sinh nào phù hợp với từ khóa tìm kiếm.'}
                        </td>
                      </tr>
                    ) : (
                      classStudents.filter(st =>
                        st.full_name.toLowerCase().includes(modalStudentSearch.toLowerCase()) ||
                        st.code.toLowerCase().includes(modalStudentSearch.toLowerCase()) ||
                        (st.room_code && st.room_code.toLowerCase().includes(modalStudentSearch.toLowerCase()))
                      ).map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-[#0e3a7c]">{st.code}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{st.full_name}</td>
                          <td className="px-2 py-2">{st.gender}</td>
                          <td className="px-3 py-2">
                            {st.is_boarding === 1 ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Nội trú
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                Ngoại trú
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {st.room_code ? (
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                {st.room_code}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 font-extrabold text-slate-900">{st.final_score ?? 100} đ</td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              st.classification === 'Xuất sắc' ? 'bg-amber-100 text-amber-900' :
                              st.classification === 'Tốt' ? 'bg-emerald-100 text-emerald-800' :
                              st.classification === 'Đạt' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {st.classification || 'Xuất sắc'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleDeleteClass(activeClass)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa lớp này
                </button>
              ) : <div />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-xs cursor-pointer"
                >
                  Đóng
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeClass)}
                    className="px-4 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg shadow-xs text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa lớp
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Class */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm lớp chuyên mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mã lớp (*)</label>
            <input
              type="text"
              required
              placeholder="VD: 10T3 hoặc 11SINH2"
              value={newClassData.code}
              onChange={(e) => setNewClassData({ ...newClassData, code: e.target.value.toUpperCase() })}
              className="w-full p-2 border border-slate-300 rounded-lg uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên lớp đầy đủ (*)</label>
            <input
              type="text"
              required
              placeholder="VD: 10 Chuyên Toán 3"
              value={newClassData.name}
              onChange={(e) => setNewClassData({ ...newClassData, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khối lớp (*)</label>
              <select
                value={newClassData.grade_level}
                onChange={(e) => setNewClassData({ ...newClassData, grade_level: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vị trí phòng học</label>
              <input
                type="text"
                placeholder="VD: P.204 - Tòa A"
                value={newClassData.room_location}
                onChange={(e) => setNewClassData({ ...newClassData, room_location: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Tạo lớp mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Class */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Chỉnh sửa lớp: ${editClassData.name} (${editClassData.code})`}
        maxWidth="md"
      >
        <form onSubmit={handleEditClass} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mã lớp</label>
            <input
              type="text"
              disabled
              value={editClassData.code}
              className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-slate-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên lớp đầy đủ (*)</label>
            <input
              type="text"
              required
              value={editClassData.name}
              onChange={(e) => setEditClassData({ ...editClassData, name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khối lớp (*)</label>
              <select
                value={editClassData.grade_level}
                onChange={(e) => setEditClassData({ ...editClassData, grade_level: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vị trí phòng học</label>
              <input
                type="text"
                value={editClassData.room_location}
                onChange={(e) => setEditClassData({ ...editClassData, room_location: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">Giáo viên chủ nhiệm (GVCN)</label>
              <span className="text-[11px] text-slate-400 font-normal">Tự động đồng bộ quyền tài khoản</span>
            </div>
            <select
              value={editClassData.homeroom_teacher_id}
              onChange={(e) => setEditClassData({ ...editClassData, homeroom_teacher_id: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Chưa phân công GVCN --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.subject || 'Bộ môn'}{t.current_class_name && t.current_class_id !== editingClassId ? ` - Đang CN ${t.current_class_name}` : ''})
                </option>
              ))}
            </select>
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
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Change Homeroom Teacher */}
      <Modal
        isOpen={changeTeacherModalOpen}
        onClose={() => setChangeTeacherModalOpen(false)}
        title="Thay đổi Giáo viên Chủ nhiệm (GVCN)"
        maxWidth="md"
      >
        {targetClassForTeacher && (
          <form onSubmit={handleChangeTeacherSubmit} className="space-y-4 text-xs">
            {/* Target Class Info Card */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/70">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#0e3a7c]">
                  {targetClassForTeacher.name} ({targetClassForTeacher.code})
                </span>
                <span className="px-2 py-0.5 bg-white font-bold text-[11px] text-slate-600 rounded border border-slate-200">
                  Khối {targetClassForTeacher.grade_level} • {targetClassForTeacher.total_students} HS
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-700 flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-500">GVCN hiện tại:</span>
                <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {targetClassForTeacher.teacher_name || 'Chưa phân công'}
                </strong>
                {targetClassForTeacher.teacher_phone && (
                  <span className="text-slate-500">({targetClassForTeacher.teacher_phone})</span>
                )}
              </div>
            </div>

            {/* Select Teacher Mode */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Chọn Giáo viên Chủ nhiệm mới (*):
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-[#0e3a7c]"
                >
                  <option value="">-- Hủy phân công (Trống GVCN) --</option>
                  <optgroup label={`Danh sách Giáo viên nhà trường (${teachers.length} GV)`}>
                    {teachers.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.full_name} — {t.subject || 'Bộ môn'} {t.current_class_name ? `(Đang CN ${t.current_class_name})` : '(Chưa phụ trách lớp nào)'}
                      </option>
                    ))}
                  </optgroup>
                  <option value="new" className="font-bold text-indigo-700">
                    ➕ Thêm mới Giáo viên khác (chưa có trong danh sách)
                  </option>
                </select>
              </div>

              {/* Inputs for New Teacher */}
              {selectedTeacherId === 'new' && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-2.5">
                  <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-indigo-600" /> Nhập thông tin Giáo viên mới
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Họ và tên Giáo viên (*)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Cô Nguyễn Thị Mai"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="text"
                        placeholder="VD: 0987654321"
                        value={newTeacherPhone}
                        onChange={(e) => setNewTeacherPhone(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Bộ môn giảng dạy
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Toán, Ngữ văn..."
                        value={newTeacherSubject}
                        onChange={(e) => setNewTeacherSubject(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Permission and Security Notice */}
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>⚡ Tự động phân quyền:</strong> Khi lưu, hệ thống sẽ tự động cập nhật phạm vi quản trị lớp cho tài khoản GVCN mới để xem điểm danh và theo dõi hồ sơ thi đua KPI của học sinh. Quyền của GVCN cũ sẽ tự động được điều chỉnh.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setChangeTeacherModalOpen(false)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={savingTeacher}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {savingTeacher ? 'Đang cập nhật...' : 'Xác nhận chuyển đổi GVCN'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Nhập danh sách lớp chuyên từ file Excel / CSV"
        description="Hệ thống hỗ trợ tải file mẫu Excel chuẩn, kéo thả hoặc chọn file Excel (.xlsx, .xls) hoặc CSV. Hệ thống tự động nhận diện các cột, phân loại khối 10-11-12, đối chiếu GVCN và cập nhật danh mục 54 lớp chuyên."
        templateFileName="Mau_Nhap_Lop_Chuyen_Hung_Vuong"
        sampleTemplateData={sampleClassTemplate}
        columns={classImportColumns}
        onImport={async (items) => {
          const res: any = await api.post('/classes/import', { items });
          return res;
        }}
        onSuccess={() => {
          fetchClasses();
        }}
      />
    </div>
  );
};
