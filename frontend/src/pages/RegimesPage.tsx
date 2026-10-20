// frontend/src/pages/RegimesPage.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { DailyRegime } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';

export const RegimesPage: React.FC = () => {
  const [regimes, setRegimes] = useState<DailyRegime[]>([]);
  const [currentInfo, setCurrentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // CRUD state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRegimeId, setEditingRegimeId] = useState<number | null>(null);

  const [newRegime, setNewRegime] = useState({
    order_num: 12,
    name: '',
    time_start: '06:00',
    time_end: '06:30',
    description: '',
    responsible_role: 'Ban Quản sinh & GV Trực',
  });

  const [editRegime, setEditRegime] = useState({
    order_num: 1,
    name: '',
    time_start: '',
    time_end: '',
    description: '',
    responsible_role: '',
  });

  const fetchRegimesData = async () => {
    try {
      const [regList, curr]: any = await Promise.all([
        api.get('/regimes'),
        api.get('/regimes/current'),
      ]);
      setRegimes(regList || []);
      setCurrentInfo(curr);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegimesData();
    const interval = setInterval(fetchRegimesData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleCompleteRegime = async (regimeId: number) => {
    try {
      await api.post(`/regimes/${regimeId}/complete`, { note: 'Xác nhận kiểm tra hoàn thành' });
      alert('Đã xác nhận hoàn thành chế độ sinh hoạt!');
      fetchRegimesData();
    } catch (err: any) {
      alert(err.message || 'Lỗi xác nhận');
    }
  };

  const handleCreateRegime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegime.name || !newRegime.time_start || !newRegime.time_end) {
      alert('Vui lòng điền đủ tên chế độ và khung thời gian');
      return;
    }
    try {
      await api.post('/regimes', newRegime);
      alert('Tạo chế độ sinh hoạt mới thành công!');
      setCreateModalOpen(false);
      setNewRegime({
        order_num: regimes.length + 1,
        name: '',
        time_start: '06:00',
        time_end: '06:30',
        description: '',
        responsible_role: 'Ban Quản sinh & GV Trực',
      });
      fetchRegimesData();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo chế độ');
    }
  };

  const handleOpenEdit = (reg: DailyRegime) => {
    setEditingRegimeId(reg.id);
    setEditRegime({
      order_num: reg.order_num,
      name: reg.name,
      time_start: reg.time_start,
      time_end: reg.time_end,
      description: reg.description || '',
      responsible_role: reg.responsible_role || 'Ban Quản sinh & GV Trực',
    });
    setEditModalOpen(true);
  };

  const handleEditRegime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegimeId) return;
    try {
      await api.put(`/regimes/${editingRegimeId}`, editRegime);
      alert('Cập nhật chế độ thành công!');
      setEditModalOpen(false);
      fetchRegimesData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleDeleteRegime = async (id: number, name: string) => {
    if (!window.confirm(`Xác nhận xóa mốc chế độ sinh hoạt: "${name}"?`)) return;
    try {
      await api.delete(`/regimes/${id}`);
      alert(`Đã xóa mốc "${name}" thành công`);
      fetchRegimesData();
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
            11 chế độ sinh hoạt ký túc xá
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Lịch sinh hoạt nề nếp hàng ngày từ <strong>05h15</strong> đến <strong>22h30</strong> • Đồng hồ thời gian thực Asia/Ho_Chi_Minh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewRegime((prev) => ({ ...prev, order_num: regimes.length + 1 }));
              setCreateModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm chế độ mới
          </button>
          <div className="px-3.5 py-1.5 bg-blue-50 text-[#0e3a7c] border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
            <Clock className="w-4 h-4 text-[#0e3a7c]" />
            <span>Giờ máy chủ: {currentInfo?.server_time || '...'}</span>
          </div>
        </div>
      </div>

      {/* Critical Checkpoint Alert Banner if active */}
      {currentInfo?.critical_alert && (
        <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl flex items-center gap-3 text-xs text-red-800">
          <AlertTriangle className="w-5 h-5 text-[#d32027] shrink-0" />
          <div className="font-bold">{currentInfo.critical_alert}</div>
        </div>
      )}

      {/* Active Regime Spotlight Card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Chế độ đang diễn ra
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            {currentInfo?.active_regime?.name || 'Giờ tự do / nghỉ ngơi'}
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {currentInfo?.active_regime?.time_start} — {currentInfo?.active_regime?.time_end}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {currentInfo?.active_regime?.description || 'Học sinh tuân thủ nội quy chung của nhà trường và ký túc xá'}
          </p>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            Người phụ trách: {currentInfo?.active_regime?.responsible_role || 'Ban Tự quản KTX'}
          </div>
        </div>

        {/* Countdown */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Thời gian còn lại</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {currentInfo?.remaining_minutes ?? 0} <span className="text-xs font-normal text-slate-500">phút</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            Tiếp theo: <strong className="text-slate-700">{currentInfo?.next_regime?.name || '—'}</strong> ({currentInfo?.next_regime?.time_start})
          </div>
        </div>
      </div>

      {/* Timeline of 11 Regimes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0e3a7c]" /> Lịch trình chi tiết các mốc thời gian trong ngày
        </h3>

        <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6 py-2">
          {regimes.map((reg) => {
            const isCompleted = reg.execution_status === 'completed';
            const isActive = currentInfo?.active_regime?.id === reg.id;

            return (
              <div key={reg.id} className="relative group">
                {/* Timeline dot */}
                <div
                  className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                    isActive
                      ? 'bg-[#d32027] border-white ring-4 ring-red-200'
                      : isCompleted
                      ? 'bg-emerald-500 border-white ring-2 ring-emerald-100'
                      : 'bg-white border-slate-400'
                  }`}
                />

                {/* Card Container */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'border-[#0e3a7c] bg-blue-50/40 shadow-xs'
                      : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-[#0e3a7c] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {reg.time_start} — {reg.time_end}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Mốc {reg.order_num}: {reg.name}
                        </h4>
                        {isActive && (
                          <span className="text-[10px] font-bold text-white bg-[#d32027] px-2 py-0.5 rounded-full uppercase">
                            Đang diễn ra
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{reg.description}</p>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Phụ trách: <strong>{reg.responsible_role}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(reg)}
                        title="Chỉnh sửa mốc này"
                        className="p-1.5 text-slate-500 hover:text-[#0e3a7c] hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sửa</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRegime(reg.id, reg.name)}
                        title="Xóa mốc này"
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xóa</span>
                      </button>

                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã xác nhận
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCompleteRegime(reg.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-[#0e3a7c] hover:bg-[#0a2754] text-white rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          Xác nhận hoàn thành
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Checklist items */}
                  {reg.checklist && reg.checklist.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-500 text-[11px]">Danh mục kiểm tra:</div>
                      {reg.checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked={isCompleted} className="rounded text-[#0e3a7c]" />
                          <span>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Regime Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm mốc chế độ sinh hoạt mới"
      >
        <form onSubmit={handleCreateRegime} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thứ tự mốc (*)</label>
              <input
                type="number"
                required
                min={1}
                value={newRegime.order_num}
                onChange={(e) => setNewRegime({ ...newRegime, order_num: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên chế độ sinh hoạt (*)</label>
              <input
                type="text"
                required
                placeholder="VD: Tập thể dục sáng"
                value={newRegime.name}
                onChange={(e) => setNewRegime({ ...newRegime, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu (*)</label>
              <input
                type="text"
                required
                placeholder="05:15"
                value={newRegime.time_start}
                onChange={(e) => setNewRegime({ ...newRegime, time_start: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc (*)</label>
              <input
                type="text"
                required
                placeholder="05:45"
                value={newRegime.time_end}
                onChange={(e) => setNewRegime({ ...newRegime, time_end: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Bộ phận / Vai trò phụ trách (*)</label>
            <input
              type="text"
              required
              placeholder="VD: Ban Quản sinh & GV Trực"
              value={newRegime.responsible_role}
              onChange={(e) => setNewRegime({ ...newRegime, responsible_role: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả nề nếp / Việc cần thực hiện</label>
            <textarea
              rows={3}
              placeholder="Ghi rõ yêu cầu nề nếp, tác phong học sinh..."
              value={newRegime.description}
              onChange={(e) => setNewRegime({ ...newRegime, description: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
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
              Tạo chế độ mới
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Regime Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Chỉnh sửa chế độ sinh hoạt"
      >
        <form onSubmit={handleEditRegime} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Thứ tự mốc (*)</label>
              <input
                type="number"
                required
                min={1}
                value={editRegime.order_num}
                onChange={(e) => setEditRegime({ ...editRegime, order_num: parseInt(e.target.value) || 1 })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên chế độ sinh hoạt (*)</label>
              <input
                type="text"
                required
                value={editRegime.name}
                onChange={(e) => setEditRegime({ ...editRegime, name: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu (*)</label>
              <input
                type="text"
                required
                value={editRegime.time_start}
                onChange={(e) => setEditRegime({ ...editRegime, time_start: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc (*)</label>
              <input
                type="text"
                required
                value={editRegime.time_end}
                onChange={(e) => setEditRegime({ ...editRegime, time_end: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Bộ phận / Vai trò phụ trách (*)</label>
            <input
              type="text"
              required
              value={editRegime.responsible_role}
              onChange={(e) => setEditRegime({ ...editRegime, responsible_role: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả nề nếp / Việc cần thực hiện</label>
            <textarea
              rows={3}
              value={editRegime.description}
              onChange={(e) => setEditRegime({ ...editRegime, description: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg"
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
    </div>
  );
};
