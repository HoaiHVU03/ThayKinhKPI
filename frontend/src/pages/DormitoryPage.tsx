// frontend/src/pages/DormitoryPage.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { DormRoom, FloorOverview } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { ExcelImportModal, type ColumnMapping } from '../components/ExcelImportModal';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Phone,
  Search,
  Filter,
  UserPlus,
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Plus,
  Upload,
  Edit,
  Trash2,
  UserMinus,
  GraduationCap,
  BedDouble,
  ShieldCheck,
  Check,
  ArrowRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

const roomAssignImportColumns: ColumnMapping[] = [
  { key: 'student_code', label: 'Mã học sinh', aliases: ['Mã học sinh', 'Mã HS', 'Ma HS', 'code', 'student_code'], required: true },
  { key: 'room_code', label: 'Số phòng KTX', aliases: ['Số phòng KTX', 'Mã phòng', 'Phòng', 'Số phòng', 'room_code', 'room'], required: true },
  { key: 'bed_number', label: 'Số giường', aliases: ['Số giường', 'Giường', 'bed_number', 'bed'] },
];

const sampleRoomAssignTemplate = [
  {
    'Mã học sinh': 'HV100031',
    'Số phòng KTX': 'P201',
    'Số giường': 1,
  },
  {
    'Mã học sinh': 'HV100018',
    'Số phòng KTX': 'P410',
    'Số giường': 2,
  },
  {
    'Mã học sinh': 'HV100012',
    'Số phòng KTX': 'P409',
    'Số giường': 3,
  },
];

export const DormitoryPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [rooms, setRooms] = useState<DormRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('2');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Room detail modal
  const [activeRoom, setActiveRoom] = useState<DormRoom | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);

  // Transfer / Assign modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [importRoomAssignModalOpen, setImportRoomAssignModalOpen] = useState(false);
  const [transferStudentId, setTransferStudentId] = useState<number | null>(null);
  const [targetRoomId, setTargetRoomId] = useState<string>('');

  // Room CRUD Modals
  const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    code: '',
    floor_number: 2,
    gender: 'Nam',
    capacity: 8,
  });

  const [editRoomModalOpen, setEditRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editRoomData, setEditRoomData] = useState({
    code: '',
    floor_number: 2,
    gender: 'Nam',
    capacity: 8,
    status: 'active',
  });

  // Tab switcher: 'rooms' | 'students'
  const [activeTab, setActiveTab] = useState<'rooms' | 'students'>('rooms');

  // Day vs Boarding Students Tab state
  const [studentTypeFilter, setStudentTypeFilter] = useState<'all' | 'boarding' | 'day'>('all');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentSearch, setStudentSearch] = useState('');
  const [allDormRooms, setAllDormRooms] = useState<any[]>([]);

  // Assign Day student to room modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState<any | null>(null);
  const [assignSelectedRoomId, setAssignSelectedRoomId] = useState<string>('');

  const fetchOverview = async () => {
    try {
      const data: any = await api.get('/dormitory/overview');
      setOverview(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/dormitory/rooms', {
        floor: selectedFloor,
        gender: genderFilter,
        search,
      });
      setRooms(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res: any = await api.get('/dormitory/students', {
        type: studentTypeFilter,
        search: studentSearch,
        page: studentsPage,
        limit: 50,
      });
      setStudentsList(res.students || []);
      setStudentsTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAllDormRooms = async () => {
    try {
      const res: any = await api.get('/dormitory/rooms');
      setAllDormRooms(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchAllDormRooms();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedFloor, genderFilter]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab, studentTypeFilter, studentsPage]);

  const handleSearchStudents = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentsPage(1);
    fetchStudents();
  };

  const handleOpenAssignModal = (student: any) => {
    setStudentToAssign(student);
    setAssignSelectedRoomId(student.dorm_room_id ? String(student.dorm_room_id) : '');
    setAssignModalOpen(true);
  };

  const handleAssignBoardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToAssign || !assignSelectedRoomId) return;
    try {
      await api.post('/dormitory/students/convert', {
        student_id: studentToAssign.id,
        type: 'boarding',
        room_id: Number(assignSelectedRoomId),
      });
      alert(`Đã xếp học sinh ${studentToAssign.full_name} vào phòng KTX thành công!`);
      setAssignModalOpen(false);
      fetchStudents();
      fetchOverview();
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xếp phòng');
    }
  };

  const handleConvertToDay = async (student: any) => {
    if (!window.confirm(`Xác nhận trả phòng cho học sinh "${student.full_name}"?\nHọc sinh sẽ được chuyển sang diện Ngoại trú.`)) {
      return;
    }
    try {
      await api.post('/dormitory/students/convert', {
        student_id: student.id,
        type: 'day',
      });
      alert(`Đã chuyển học sinh ${student.full_name} sang diện Ngoại trú thành công!`);
      fetchStudents();
      fetchOverview();
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi trả phòng');
    }
  };

  const handleOpenRoom = async (room: DormRoom) => {
    setRoomModalOpen(true);
    setRoomLoading(true);
    try {
      const full: any = await api.get(`/dormitory/rooms/${room.id}`);
      setActiveRoom(full);
    } catch (err) {
      console.error(err);
    } finally {
      setRoomLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !transferStudentId || !targetRoomId) return;

    try {
      await api.post(`/dormitory/rooms/${targetRoomId}/assign`, { student_id: transferStudentId });
      alert('Chuyển phòng cho học sinh thành công!');
      setTransferModalOpen(false);
      handleOpenRoom(activeRoom); // refresh
      fetchRooms();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xếp phòng');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dormitory/rooms', newRoomData);
      alert(`Tạo phòng ${newRoomData.code} thành công!`);
      setCreateRoomModalOpen(false);
      setNewRoomData({ code: '', floor_number: Number(selectedFloor) || 2, gender: 'Nam', capacity: 8 });
      fetchRooms();
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo phòng');
    }
  };

  const handleOpenEditRoom = (room: DormRoom, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRoomId(room.id);
    setEditRoomData({
      code: room.code,
      floor_number: room.floor_number,
      gender: room.gender,
      capacity: room.capacity,
      status: room.status || 'active',
    });
    setEditRoomModalOpen(true);
  };

  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomId) return;
    try {
      await api.put(`/dormitory/rooms/${editingRoomId}`, editRoomData);
      alert('Cập nhật thông tin phòng KTX thành công!');
      setEditRoomModalOpen(false);
      fetchRooms();
      fetchOverview();
      if (activeRoom && activeRoom.id === editingRoomId) {
        handleOpenRoom(activeRoom);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật phòng');
    }
  };

  const handleDeleteRoom = async (room: DormRoom, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (room.current_occupancy > 0) {
      alert(`Không thể xóa phòng ${room.code} vì đang có ${room.current_occupancy} học sinh đang ở. Hãy chuyển hoặc trả phòng cho học sinh trước.`);
      return;
    }
    if (!window.confirm(`Xác nhận xóa phòng KTX "${room.code}" khỏi hệ thống?`)) {
      return;
    }
    try {
      await api.delete(`/dormitory/rooms/${room.id}`);
      alert(`Đã xóa phòng ${room.code} thành công`);
      setRoomModalOpen(false);
      fetchRooms();
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa phòng');
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!activeRoom) return;
    if (!window.confirm(`Xác nhận làm thủ tục trả phòng cho học sinh "${studentName}" khỏi phòng ${activeRoom.code}?\nHọc sinh sẽ được chuyển sang diện Ngoại trú.`)) {
      return;
    }
    try {
      await api.post(`/dormitory/rooms/${activeRoom.id}/remove-student`, { student_id: studentId });
      alert(`Đã trả phòng cho học sinh ${studentName} thành công`);
      handleOpenRoom(activeRoom);
      fetchRooms();
      fetchOverview();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi trả phòng cho học sinh');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Title & Clean Header */}
      <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Quản lý ký túc xá — Phân định nội trú & ngoại trú
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Năm học 2026 - 2027
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
            Quản lý 1.880 học sinh (699 nội trú, 1.181 ngoại trú) • 120 phòng KTX đạt chuẩn Tầng 2 — Tầng 6
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setImportRoomAssignModalOpen(true)}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 touch-action-manipulation"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Nhập Excel
          </button>
          <button
            onClick={() => {
              setNewRoomData({ ...newRoomData, floor_number: Number(selectedFloor) || 2 });
              setCreateRoomModalOpen(true);
            }}
            className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#15468d] text-white text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all touch-action-manipulation"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" /> Thêm phòng
          </button>
        </div>
      </div>

      {/* Top 5 Key StatCards Grid (Rõ ràng Nội trú & Ngoại trú) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5">
        <StatCard
          title="Tổng học sinh"
          value={overview?.total_students?.toLocaleString() || '1.880'}
          subValue="54 lớp chuyên toàn trường"
          icon={Users}
          color="navy"
        />
        <StatCard
          title="Học sinh Nội trú"
          value={overview?.total_boarding?.toLocaleString() || '699'}
          subValue={`Nam: ${overview?.male_boarding || 335} • Nữ: ${overview?.female_boarding || 364}`}
          icon={Building2}
          color="blue"
          onClick={() => { setActiveTab('students'); setStudentTypeFilter('boarding'); }}
        />
        <StatCard
          title="Học sinh Ngoại trú"
          value={(overview?.total_day || 1181).toLocaleString()}
          subValue="1.181 HS đi về trong ngày"
          icon={GraduationCap}
          color="navy"
          onClick={() => { setActiveTab('students'); setStudentTypeFilter('day'); }}
        />
        <StatCard
          title="Quy mô phòng ở"
          value={`${overview?.total_rooms || 120} phòng`}
          subValue={`Nam: ${overview?.male_rooms || 56} • Nữ: ${overview?.female_rooms || 64}`}
          icon={BedDouble}
          color="gold"
          onClick={() => setActiveTab('rooms')}
        />
        <div className="col-span-2 sm:col-span-1 lg:col-span-1">
          <StatCard
            title="Tỷ lệ lấp đầy KTX"
            value="100%"
            subValue="Đã xếp 699/699 chỗ (6 HS/phòng)"
            icon={CheckCircle2}
            color="green"
          />
        </div>
      </div>

      {/* Tab Selector: Sơ đồ phòng vs Phân loại học sinh Nội/Ngoại trú */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-slate-200 pb-1.5">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 touch-action-manipulation ${
            activeTab === 'rooms'
              ? 'bg-[#0e3a7c] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Sơ đồ 120 Phòng KTX ({overview?.total_boarding || 699} HS)</span>
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 touch-action-manipulation ${
            activeTab === 'students'
              ? 'bg-[#0e3a7c] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>DS Học sinh Nội trú & Ngoại trú ({overview?.total_students || 1880} HS)</span>
        </button>
      </div>

      {activeTab === 'rooms' && (
        <>
          {/* Subheader: Floor navigation tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto no-scrollbar">
              {[
                { num: '2', label: 'Tầng 2 (Nam)', zone: 'Nam', count: 24 },
                { num: '3', label: 'Tầng 3 (Nam)', zone: 'Nam', count: 24 },
                { num: '4', label: 'Tầng 4 (Hỗn hợp)', zone: 'Nam/Nữ', count: 24 },
                { num: '5', label: 'Tầng 5 (Nữ)', zone: 'Nữ', count: 24 },
                { num: '6', label: 'Tầng 6 (Nữ)', zone: 'Nữ', count: 24 },
              ].map((f) => (
                <button
                  key={f.num}
                  onClick={() => setSelectedFloor(f.num)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer touch-action-manipulation ${
                    selectedFloor === f.num
                      ? 'bg-[#0e3a7c] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 hidden sm:block">
              Đang xem: <strong>24 phòng Tầng {selectedFloor}</strong>
            </div>
          </div>

          {/* Filter and Search */}
          <div className="p-3 sm:p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
              <span className="font-semibold text-slate-500 shrink-0">Giới tính:</span>
              <button
                onClick={() => setGenderFilter('')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer shrink-0 touch-action-manipulation ${genderFilter === '' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setGenderFilter('Nam')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer shrink-0 touch-action-manipulation ${genderFilter === 'Nam' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}
              >
                Nam
              </button>
              <button
                onClick={() => setGenderFilter('Nữ')}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer shrink-0 touch-action-manipulation ${genderFilter === 'Nữ' ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-700'}`}
              >
                Nữ
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo số phòng (VD: P201)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0e3a7c]"
              />
            </div>
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3.5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Đang tải sơ đồ phòng Tầng {selectedFloor}...
          </div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            Không tìm thấy phòng KTX nào
          </div>
        ) : (
          rooms.map((room) => {
            const isFull = room.current_occupancy >= room.capacity;
            const isReported = room.attendance_status === 'reported';
            const isMale = room.gender === 'Nam';

            return (
              <div
                key={room.id}
                onClick={() => handleOpenRoom(room)}
                className={`p-2.5 sm:p-3.5 bg-white rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between shadow-2xs hover:shadow-md touch-action-manipulation ${
                  isReported
                    ? 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-[#0e3a7c]'
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      isMale ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'
                    }`}>
                      {room.gender}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] sm:text-[10px] font-semibold text-amber-700 flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5 text-amber-600" /> {room.cleanliness_score || 95}đ
                      </span>
                      <button
                        onClick={(e) => handleOpenEditRoom(room, e)}
                        className="text-slate-400 hover:text-amber-700 p-0.5 rounded cursor-pointer touch-action-manipulation"
                        title="Sửa phòng"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRoom(room, e)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded cursor-pointer touch-action-manipulation"
                        title="Xóa phòng"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Room Code */}
                  <h3 className="text-base sm:text-lg font-black font-mono text-slate-900 group-hover:text-[#0e3a7c] transition-colors">
                    {room.code}
                  </h3>

                  {/* Room Leader */}
                  <p className="text-[11px] text-slate-500 truncate mt-0.5" title={room.room_leader_name || 'Chưa phân công'}>
                    TP: <strong className="text-slate-700">{room.room_leader_name ? room.room_leader_name.split(' ').slice(-2).join(' ') : '—'}</strong>
                  </p>
                </div>

                {/* Occupancy and Attendance Status Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Sĩ số:</span>
                    <span className={`font-bold ${isFull ? 'text-amber-600' : 'text-slate-800'}`}>
                      {room.current_occupancy} / {room.capacity}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-amber-500' : isMale ? 'bg-blue-600' : 'bg-pink-600'}`}
                      style={{ width: `${(room.current_occupancy / room.capacity) * 100}%` }}
                    />
                  </div>

                  {/* Attendance badge */}
                  <div className="mt-2 text-center">
                    {isReported ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Đã điểm danh
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Chờ báo cáo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  )}

  {/* Tab 2: Day vs Boarding Student Classification (Phân loại Nội trú & Ngoại trú) */}
  {activeTab === 'students' && (
    <div className="space-y-4">
      {/* Subheader and Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => { setStudentTypeFilter('all'); setStudentsPage(1); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              studentTypeFilter === 'all' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({overview?.total_students || 1883})
          </button>
          <button
            onClick={() => { setStudentTypeFilter('boarding'); setStudentsPage(1); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studentTypeFilter === 'boarding' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700 hover:bg-blue-100'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" /> Học sinh Nội trú ({overview?.total_boarding || 702})
          </button>
          <button
            onClick={() => { setStudentTypeFilter('day'); setStudentsPage(1); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              studentTypeFilter === 'day' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" /> Học sinh Ngoại trú ({overview?.total_day || 1181})
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchStudents} className="flex items-center gap-2">
          <div className="relative w-64 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Tìm theo tên HS, mã HS, phòng, lớp..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0e3a7c]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg cursor-pointer"
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={() => { setStudentSearch(''); setStudentsPage(1); fetchStudents(); }}
            className="p-1.5 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-3 py-3">STT</th>
                <th className="px-3 py-3">Mã HS</th>
                <th className="px-3 py-3">Họ và tên</th>
                <th className="px-2 py-3">Lớp</th>
                <th className="px-2 py-3">Giới tính</th>
                <th className="px-3 py-3">Diện quản lý</th>
                <th className="px-3 py-3">Phòng KTX</th>
                <th className="px-2 py-3">Điểm KPI</th>
                <th className="px-3 py-3">Quê quán</th>
                <th className="px-3 py-3">SĐT Phụ huynh</th>
                <th className="px-3 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentsLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#0e3a7c] border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách học sinh...</span>
                    </div>
                  </td>
                </tr>
              ) : studentsList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                studentsList.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-slate-400">{(studentsPage - 1) * 50 + idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-[#0e3a7c]">{st.code}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{st.full_name}</td>
                    <td className="px-2 py-2 font-semibold text-slate-700">{st.class_name}</td>
                    <td className="px-2 py-2">{st.gender}</td>
                    <td className="px-3 py-2">
                      {st.is_boarding === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <BedDouble className="w-3 h-3" /> Nội trú KTX
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <GraduationCap className="w-3 h-3" /> Ngoại trú
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {st.room_code ? (
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          Phòng {st.room_code} (T{st.floor_number})
                        </span>
                      ) : (
                        <span className="text-slate-400">Đi về trong ngày</span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-extrabold text-slate-900">{st.final_kpi_score ?? 100} đ</td>
                    <td className="px-3 py-2 text-slate-500 truncate max-w-[140px]">{st.hometown || 'Phú Thọ'}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono text-[11px]">{st.parent_phone || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {st.is_boarding === 1 ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAssignModal(st)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold cursor-pointer border border-blue-200"
                            title="Đổi sang phòng KTX khác"
                          >
                            Đổi phòng
                          </button>
                          <button
                            onClick={() => handleConvertToDay(st)}
                            className="px-2 py-1 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-200 hover:border-red-200"
                            title="Trả phòng KTX, chuyển sang diện ngoại trú"
                          >
                            Trả phòng
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(st)}
                          className="px-2.5 py-1 bg-[#0e3a7c] hover:bg-[#0a2754] text-white rounded text-[11px] font-bold cursor-pointer shadow-2xs flex items-center gap-1 ml-auto"
                          title="Đăng ký vào KTX và xếp phòng"
                        >
                          <UserPlus className="w-3 h-3" /> Xếp phòng KTX
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <strong>{studentsList.length}</strong> / <strong>{studentsTotal}</strong> học sinh
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={studentsPage <= 1}
              onClick={() => setStudentsPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Trang trước
            </button>
            <span className="font-bold text-slate-800">Trang {studentsPage}</span>
            <button
              disabled={studentsList.length < 50}
              onClick={() => setStudentsPage(p => p + 1)}
              className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Room Detail Modal (Section 6.2) */}
      <Modal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        title={activeRoom ? `Chi tiết phòng ${activeRoom.code} — Tầng ${activeRoom.floor_number}` : ''}
        maxWidth="2xl"
      >
        {activeRoom && (
          <div className="space-y-4 text-xs text-slate-700">
            {/* Room Header Info */}
            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-blue-800 uppercase tracking-wide">
                  Khu {activeRoom.gender} • Tầng {activeRoom.floor_number}
                </span>
                <h4 className="text-lg sm:text-xl font-black font-mono text-[#0e3a7c] mt-0.5">{activeRoom.code}</h4>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                  Trưởng phòng: <strong>{activeRoom.room_leader_name || 'Chưa phân công'}</strong>
                  {activeRoom.room_leader_phone && ` • SĐT: ${activeRoom.room_leader_phone}`}
                </p>
              </div>

              <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <div className="text-base sm:text-lg font-black text-slate-900">
                  {activeRoom.current_occupancy} <span className="text-xs font-normal text-slate-500">/ {activeRoom.capacity} HS</span>
                </div>
                <div className="text-[11px] sm:text-xs text-amber-700 font-bold sm:mt-1">
                  Điểm nội vụ: {activeRoom.cleanliness_score || 95} đ
                </div>
              </div>
            </div>

            {/* Students List in Room */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0e3a7c]" /> Danh sách học sinh nội trú trong phòng
                </h5>
                <span className="text-[11px] text-slate-500">
                  {activeRoom.students?.length || 0} học sinh
                </span>
              </div>

              {!activeRoom.students || activeRoom.students.length === 0 ? (
                <div className="p-4 bg-slate-50 text-center text-slate-400 rounded-lg">
                  Phòng hiện đang trống, chưa có học sinh nào được xếp vào phòng này.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {activeRoom.students.map((st) => (
                    <div key={st.id} className="p-2.5 sm:p-3 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-mono font-bold text-[#0e3a7c] text-xs">{st.code}</span>
                          <span className="font-bold text-slate-900 text-xs">{st.full_name}</span>
                          <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                            {st.class_name}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                          Quê: {st.hometown || 'Chưa cập nhật'} • SĐT: {st.student_phone || 'Bảo mật'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className="font-extrabold text-slate-800 text-xs">
                          {st.final_score ?? 100} đ
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setTransferStudentId(st.id);
                              setTransferModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded border border-blue-200 cursor-pointer touch-action-manipulation"
                          >
                            Đổi phòng
                          </button>
                          <button
                            onClick={() => handleRemoveStudent(st.id, st.full_name)}
                            className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200 cursor-pointer touch-action-manipulation"
                          >
                            Trả phòng
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Room Actions */}
            <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDeleteRoom(activeRoom)}
                className="justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg border border-red-200 text-xs cursor-pointer inline-flex items-center gap-1.5 touch-action-manipulation"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa phòng
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="flex-1 sm:flex-none justify-center px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 text-xs cursor-pointer touch-action-manipulation"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditRoom(activeRoom)}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg shadow-xs text-xs cursor-pointer inline-flex items-center gap-1.5 touch-action-manipulation"
                >
                  <Edit className="w-3.5 h-3.5" /> Sửa thông tin
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Transfer / Reassign Student (Section 6.3) */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Chuyển học sinh sang phòng khác"
        maxWidth="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs text-slate-700">
          <p>
            Chọn phòng KTX mục tiêu để chuyển học sinh. Hệ thống sẽ tự động kiểm tra giới tính và sức chứa tối đa của phòng mới.
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Chọn phòng KTX nhận (*)</label>
            <select
              required
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Chọn phòng trống --</option>
              {rooms
                .filter((r) => r.id !== activeRoom?.id && r.current_occupancy < r.capacity)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} (Tầng {r.floor_number} - {r.gender} • Hiện có: {r.current_occupancy}/{r.capacity})
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Xác nhận Chuyển Phòng
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Room */}
      <Modal
        isOpen={createRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        title="Thêm phòng ký túc xá mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mã phòng (*)</label>
            <input
              type="text"
              required
              placeholder="VD: P.225 hoặc P.425"
              value={newRoomData.code}
              onChange={(e) => setNewRoomData({ ...newRoomData, code: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tầng KTX</label>
              <select
                value={newRoomData.floor_number}
                onChange={(e) => setNewRoomData({ ...newRoomData, floor_number: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={2}>Tầng 2</option>
                <option value={3}>Tầng 3</option>
                <option value={4}>Tầng 4</option>
                <option value={5}>Tầng 5</option>
                <option value={6}>Tầng 6</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khu giới tính</label>
              <select
                value={newRoomData.gender}
                onChange={(e) => setNewRoomData({ ...newRoomData, gender: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sức chứa tối đa</label>
              <input
                type="number"
                min={1}
                max={12}
                value={newRoomData.capacity}
                onChange={(e) => setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateRoomModalOpen(false)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Tạo phòng KTX
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Room */}
      <Modal
        isOpen={editRoomModalOpen}
        onClose={() => setEditRoomModalOpen(false)}
        title={`Chỉnh sửa thông tin phòng: ${editRoomData.code}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditRoom} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mã phòng</label>
            <input
              type="text"
              disabled
              value={editRoomData.code}
              className="w-full p-2 border border-slate-200 bg-slate-100 rounded-lg font-mono font-bold text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tầng KTX</label>
              <select
                value={editRoomData.floor_number}
                onChange={(e) => setEditRoomData({ ...editRoomData, floor_number: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value={2}>Tầng 2</option>
                <option value={3}>Tầng 3</option>
                <option value={4}>Tầng 4</option>
                <option value={5}>Tầng 5</option>
                <option value={6}>Tầng 6</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khu giới tính</label>
              <select
                value={editRoomData.gender}
                onChange={(e) => setEditRoomData({ ...editRoomData, gender: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sức chứa tối đa (giường)</label>
              <input
                type="number"
                min={1}
                max={12}
                value={editRoomData.capacity}
                onChange={(e) => setEditRoomData({ ...editRoomData, capacity: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái phòng</label>
              <select
                value={editRoomData.status}
                onChange={(e) => setEditRoomData({ ...editRoomData, status: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="active">Hoạt động bình thường</option>
                <option value="maintenance">Đang bảo trì / Sửa chữa</option>
                <option value="locked">Tạm khóa</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditRoomModalOpen(false)}
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

      {/* Modal: Import Room Assignments with Excel (.xlsx / .csv) */}
      <ExcelImportModal
        isOpen={importRoomAssignModalOpen}
        onClose={() => setImportRoomAssignModalOpen(false)}
        title="Nhập danh sách xếp phòng KTX từ file Excel / CSV"
        description="Cho phép quản sinh ký túc xá tải file mẫu, kéo thả hoặc chọn file Excel (.xlsx, .xls) hoặc CSV để phân bổ phòng nội trú hàng loạt đầu năm học hoặc đầu kỳ. Hệ thống tự động kiểm tra giới tính phòng, sĩ số và công suất tối đa của từng phòng."
        templateFileName="Mau_Xep_Phong_KTX_Hung_Vuong"
        sampleTemplateData={sampleRoomAssignTemplate}
        columns={roomAssignImportColumns}
        onImport={async (items) => {
          const res: any = await api.post('/dormitory/rooms/import-assignments', { items });
          return res;
        }}
        onSuccess={() => {
          fetchRooms();
          fetchOverview();
        }}
      />

      {/* Modal: Assign / Transfer Student into Room */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={studentToAssign ? `Xếp phòng KTX cho học sinh: ${studentToAssign.full_name}` : 'Xếp phòng KTX'}
        maxWidth="md"
      >
        {studentToAssign && (
          <form onSubmit={handleAssignBoardingSubmit} className="space-y-3.5 text-xs text-slate-700">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">{studentToAssign.full_name}</p>
                <p className="text-slate-500 mt-0.5">Mã HS: <strong>{studentToAssign.code}</strong> • Lớp: <strong>{studentToAssign.class_name}</strong></p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                  studentToAssign.is_boarding === 1 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {studentToAssign.is_boarding === 1 ? `Nội trú: ${studentToAssign.room_code || ''}` : 'Ngoại trú'}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Giới tính: <strong>{studentToAssign.gender}</strong></p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chọn phòng KTX cần xếp vào (*)
              </label>
              <select
                required
                value={assignSelectedRoomId}
                onChange={(e) => setAssignSelectedRoomId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="">-- Chọn 1 trong 120 phòng KTX --</option>
                {allDormRooms
                  .filter(r => !studentToAssign.gender || r.gender === studentToAssign.gender || r.floor_number === 4)
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.code} - Tầng {r.floor_number} ({r.gender}) - Đang ở: {r.current_occupancy}/{r.capacity} HS
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Hệ thống tự động lọc phòng phù hợp giới tính ({studentToAssign.gender}) của học sinh.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Xác nhận xếp phòng
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
