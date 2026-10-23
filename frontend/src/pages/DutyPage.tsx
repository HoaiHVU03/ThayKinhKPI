// frontend/src/pages/DutyPage.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { DutySchedule } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { getTodayVN } from '../utils/dateTime';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Calendar,
  UserCheck,
  CheckSquare,
  Square,
  AlertTriangle,
  Building,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

export const DutyPage: React.FC = () => {
  const [schedules, setSchedules] = useState<DutySchedule[]>([]);
  const [todayDuty, setTodayDuty] = useState<DutySchedule | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // CRUD Modals State
  const [createScheduleModalOpen, setCreateScheduleModalOpen] = useState(false);
  const [newScheduleData, setNewScheduleData] = useState({
    teacher_id: '',
    duty_date: getTodayVN(),
    shift_name: '06:55 - 07:15',
    location: 'Tòa nhà A',
    notes: 'Trực ban buổi sáng',
  });

  const [editScheduleModalOpen, setEditScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [editScheduleData, setEditScheduleData] = useState({
    teacher_id: '',
    duty_date: '',
    shift_name: '',
    location: '',
    status: 'pending',
    notes: '',
  });

  const fetchDutyData = async () => {
    try {
      const [list, curr, tList]: any = await Promise.all([
        api.get('/duty/schedules'),
        api.get('/duty/today'),
        api.get('/duty/teachers'),
      ]);
      setSchedules(list || []);
      setTodayDuty(curr);
      setTeachers(tList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDutyData();
  }, []);

  const handleToggleStep = async (scheduleId: number, stepNumber: number, currentCompleted: number) => {
    try {
      await api.post(`/duty/${scheduleId}/step`, {
        step_number: stepNumber,
        is_completed: currentCompleted ? 0 : 1,
      });
      fetchDutyData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật bước trực ban');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleData.teacher_id) {
      alert('Vui lòng chọn giáo viên trực ban');
      return;
    }
    try {
      await api.post('/duty/schedules', newScheduleData);
      alert('Phân công ca trực ban mới thành công!');
      setCreateScheduleModalOpen(false);
      fetchDutyData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phân công');
    }
  };

  const handleOpenEditSchedule = (sch: DutySchedule) => {
    setEditingScheduleId(sch.id);
    setEditScheduleData({
      teacher_id: String((sch as any).teacher_id || ''),
      duty_date: sch.duty_date,
      shift_name: sch.shift_name,
      location: sch.location,
      status: sch.status || 'pending',
      notes: (sch as any).notes || '',
    });
    setEditScheduleModalOpen(true);
  };

  const handleEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduleId) return;
    try {
      await api.put(`/duty/schedules/${editingScheduleId}`, editScheduleData);
      alert('Cập nhật ca trực ban thành công!');
      setEditScheduleModalOpen(false);
      fetchDutyData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleDeleteSchedule = async (sch: DutySchedule) => {
    if (!window.confirm(`Xác nhận xóa ca trực ngày ${sch.duty_date} của giáo viên ${sch.teacher_name}?`)) {
      return;
    }
    try {
      await api.delete(`/duty/schedules/${sch.id}`);
      alert('Đã xóa ca trực ban thành công');
      fetchDutyData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Trực ban tòa nhà A (37 giáo viên)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy trình kiểm tra 4 bước • Khung giờ: <strong>06h55 – 07h15</strong> sáng • Quản lý hộp điện thoại 15 phút truy bài
          </p>
        </div>

        <button
          onClick={() => setCreateScheduleModalOpen(true)}
          className="px-3.5 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Phân công ca trực mới
        </button>
      </div>

      {/* Today Duty Spotlight Card */}
      {todayDuty && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Ca trực hôm nay ({todayDuty.duty_date})
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Giáo viên trực: {todayDuty.teacher_name} ({todayDuty.teacher_code})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bộ môn: {todayDuty.subject} • SĐT: {todayDuty.teacher_phone} • Vị trí: {todayDuty.location}
              </p>
            </div>

            <div>
              {todayDuty.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded text-xs border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn thành ca trực
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded text-xs border border-slate-200">
                  <Clock className="w-3.5 h-3.5" /> Đang trong ca trực (06h55 - 07h15)
                </span>
              )}
            </div>
          </div>

          {/* 4 Steps Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {todayDuty.steps?.map((step) => {
              const done = step.is_completed === 1;
              return (
                <div
                  key={step.step_number}
                  onClick={() => handleToggleStep(todayDuty.id, step.step_number, step.is_completed)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                    done
                      ? 'bg-slate-50 border-emerald-300 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="pt-0.5">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-snug">
                      Bước {step.step_number}: {step.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {done ? '✓ Đã hoàn tất ghi nhận' : '○ Bấm vào để xác nhận thực hiện'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Duty Schedules Calendar History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0e3a7c]" /> Lịch phân công trực ban của 37 giáo viên
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">Ngày trực</th>
                <th className="px-4 py-3">Khung giờ</th>
                <th className="px-4 py-3">Giáo viên phụ trách</th>
                <th className="px-3 py-3">Bộ môn</th>
                <th className="px-3 py-3">Vị trí</th>
                <th className="px-3 py-3">Tiến độ 4 bước</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((sch) => {
                const doneSteps = sch.steps?.filter((s) => s.is_completed === 1).length || 0;
                return (
                  <tr key={sch.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {sch.duty_date}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {sch.shift_name}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0e3a7c]">
                      {sch.teacher_name} ({sch.teacher_code})
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {sch.subject}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {sch.location}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${doneSteps === 4 ? 'bg-emerald-500' : 'bg-[#0e3a7c]'}`}
                            style={{ width: `${(doneSteps / 4) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{doneSteps}/4</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {sch.status === 'completed' ? (
                        <Badge variant="success">Hoàn thành</Badge>
                      ) : (
                        <Badge variant="warning">Đang chờ</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditSchedule(sch)}
                          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          title="Sửa lịch trực"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(sch)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="Xóa lịch trực"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Duty Schedule */}
      <Modal
        isOpen={createScheduleModalOpen}
        onClose={() => setCreateScheduleModalOpen(false)}
        title="Phân công lịch trực ban tòa nhà A mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Giáo viên trực ban (*)</label>
            <select
              required
              value={newScheduleData.teacher_id}
              onChange={(e) => setNewScheduleData({ ...newScheduleData, teacher_id: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Chọn giáo viên từ 37 thầy cô trực ban --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.code}) - {t.subject} (SĐT: {t.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày trực (*)</label>
              <input
                type="date"
                required
                value={newScheduleData.duty_date}
                onChange={(e) => setNewScheduleData({ ...newScheduleData, duty_date: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khung giờ trực</label>
              <input
                type="text"
                value={newScheduleData.shift_name}
                onChange={(e) => setNewScheduleData({ ...newScheduleData, shift_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Vị trí trực</label>
            <input
              type="text"
              value={newScheduleData.location}
              onChange={(e) => setNewScheduleData({ ...newScheduleData, location: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú</label>
            <input
              type="text"
              value={newScheduleData.notes}
              onChange={(e) => setNewScheduleData({ ...newScheduleData, notes: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateScheduleModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg cursor-pointer"
            >
              Phân công ca trực
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Duty Schedule */}
      <Modal
        isOpen={editScheduleModalOpen}
        onClose={() => setEditScheduleModalOpen(false)}
        title="Chỉnh sửa ca trực ban"
        maxWidth="md"
      >
        <form onSubmit={handleEditSchedule} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Giáo viên phụ trách (*)</label>
            <select
              required
              value={editScheduleData.teacher_id}
              onChange={(e) => setEditScheduleData({ ...editScheduleData, teacher_id: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Chọn giáo viên --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.code}) - {t.subject}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày trực (*)</label>
              <input
                type="date"
                required
                value={editScheduleData.duty_date}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, duty_date: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Khung giờ</label>
              <input
                type="text"
                value={editScheduleData.shift_name}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, shift_name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vị trí trực</label>
              <input
                type="text"
                value={editScheduleData.location}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, location: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái ca trực</label>
              <select
                value={editScheduleData.status}
                onChange={(e) => setEditScheduleData({ ...editScheduleData, status: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="pending">Đang chờ</option>
                <option value="completed">Đã hoàn thành</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi chú</label>
            <input
              type="text"
              value={editScheduleData.notes}
              onChange={(e) => setEditScheduleData({ ...editScheduleData, notes: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditScheduleModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg cursor-pointer"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
