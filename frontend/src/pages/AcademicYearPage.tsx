// frontend/src/pages/AcademicYearPage.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Archive,
  History,
  GraduationCap,
} from 'lucide-react';

export const AcademicYearPage: React.FC = () => {
  const { user } = useAuth();
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  const fetchPreview = async () => {
    try {
      const data: any = await api.get('/academic-year/preview');
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleCommitTransition = async () => {
    if (!confirm('XÁC NHẬN CHUYỂN NIÊN KHÓA?\n\nHành động này sẽ nâng lớp cho học sinh Khối 10 & 11, đồng thời xét tốt nghiệp cho Khối 12. Dữ liệu lịch sử cũ sẽ được lưu trữ an toàn.')) {
      return;
    }

    setCommitting(true);
    try {
      await api.post('/academic-year/commit', { next_year: '2027-2028' });
      setCommitted(true);
      alert('Chuyển niên khóa sang năm học 2027-2028 thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi chuyển niên khóa');
    } finally {
      setCommitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Đang tải cấu hình chuyển niên khóa...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Công cụ chuyển niên khóa & lên lớp
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy trình chuyển khối tự động: <strong>Khối 10 → Khối 11</strong>, <strong>Khối 11 → Khối 12</strong>, <strong>Khối 12 → Tốt nghiệp</strong>
        </p>
      </div>

      {/* Warning Box */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-extrabold uppercase">Nguyên tắc bảo vệ dữ liệu lịch sử (Phân hệ 11)</div>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            Hệ thống tuân thủ nghiêm ngặt quy chế: <strong>Tuyệt đối không xóa hồ sơ lịch sử</strong> (điểm KPI, biên bản vi phạm, nhật ký điểm danh KTX, đơn xin phép). Toàn bộ dữ liệu của năm học cũ được chuyển vào trạng thái lưu trữ (Archive) và có thể truy xuất bất kỳ lúc nào.
          </p>
        </div>
      </div>

      {/* Transition Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {previewData?.transitions?.map((tr: any, idx: number) => (
          <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
                <span>Bước {idx + 1}</span>
                <span className="text-[#0e3a7c]">{tr.classes_count} Lớp</span>
              </div>

              <div className="flex items-center gap-3 my-4">
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg font-bold text-xs text-[#0e3a7c]">
                  {tr.source_grade}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-xs text-emerald-800">
                  {tr.target_grade}
                </div>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900">
                {tr.action}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Số lượng: <strong className="text-slate-800">{tr.students_count?.toLocaleString()}</strong> học sinh
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã kiểm tra hợp lệ
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Box */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Xác nhận nâng niên khóa: <span className="text-[#0e3a7c]">2026 - 2027</span> → <span className="text-emerald-700 font-black">2027 - 2028</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chỉ thực hiện thao tác này sau khi đã hoàn thành tổng kết Học kỳ 2 và khóa sổ KPI rèn luyện.
          </p>
        </div>

        <button
          disabled={committing || committed || user?.role !== 'admin'}
          onClick={handleCommitTransition}
          className="px-6 py-2.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {committing ? (
            'Đang thực hiện chuyển niên khóa...'
          ) : committed ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Đã hoàn thành chuyển năm học
            </>
          ) : (
            <>
              <CalendarDays className="w-4 h-4" /> Bắt đầu Chuyển Niên Khóa
            </>
          )}
        </button>
      </div>
    </div>
  );
};
