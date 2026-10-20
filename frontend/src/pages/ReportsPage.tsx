// frontend/src/pages/ReportsPage.tsx

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { KpiRule } from '../types';
import { Badge } from '../components/Badge';
import {
  TableProperties,
  Download,
  Filter,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  GraduationCap,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [rules, setRules] = useState<KpiRule[]>([]);
  const [studentsKpi, setStudentsKpi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'students'>('matrix');
  const [selectedGrade, setSelectedGrade] = useState<string>('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [mRes, sRes]: any = await Promise.all([
        api.get('/reports/matrix', { grade: selectedGrade }),
        api.get('/reports/students-kpi', { grade: selectedGrade }),
      ]);
      setMatrixData(mRes.matrix || []);
      setRules(mRes.rules || []);
      setStudentsKpi(sRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedGrade]);

  const handleExportCsv = () => {
    const token = localStorage.getItem('token') || '';
    window.open(`/api/students/export?grade=${selectedGrade}&token=${encodeURIComponent(token)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Báo cáo thống kê & ma trận vi phạm L01 — L10
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp dữ liệu nền nếp 54 lớp chuyên • Đánh giá KPI học kỳ 1 (Năm học 2026 - 2027)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/official-document')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Mẫu in A4 (NĐ 30/2020)
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Xuất bảng điểm 1.880 HS (CSV)
          </button>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Switcher */}
        <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'matrix' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ma trận 54 lớp x 10 mã lỗi
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'students' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bảng điểm KPI từng học sinh
          </button>
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500">Lọc theo Khối:</span>
          {['', '10', '11', '12'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                selectedGrade === g
                  ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {g === '' ? 'Tất cả (54 Lớp)' : `Khối ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Content View 1: Matrix 54 Classes x 10 Rules L01-L10 */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Ma trận số vụ vi phạm 54 lớp chuyên theo mã lỗi L01 — L10
            </h3>
            <span className="text-[11px] text-slate-500">
              Điểm trừ: L01 (-1đ), L02-L04 (-3đ), L05-L06 (-5đ), L07-L08 (-3đ), L09 (-10đ), L10 (-20đ)
            </span>
          </div>

          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-center text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300 z-10">
                <tr>
                  <th className="px-3 py-2.5 text-left">Mã lớp</th>
                  <th className="px-3 py-2.5 text-left">Tên lớp chuyên</th>
                  <th className="px-2 py-2.5">Sĩ số</th>
                  {rules.map((r) => (
                    <th key={r.code} className="px-2 py-2.5" title={`${r.code}: ${r.name} (-${r.deduction_points}đ)`}>
                      <span className="text-[#0e3a7c] font-bold">{r.code}</span>
                      <div className="text-[9px] text-slate-400 font-normal">-{r.deduction_points}đ</div>
                    </th>
                  ))}
                  <th className="px-2.5 py-2.5 text-red-700">Tổng vụ</th>
                  <th className="px-2.5 py-2.5 text-red-700">Tổng trừ</th>
                  <th className="px-3 py-2.5 bg-blue-50 text-[#0e3a7c]">KPI TB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.map((row) => (
                  <tr key={row.class_id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 text-left font-mono font-bold text-slate-500">
                      {row.class_code}
                    </td>
                    <td className="px-3 py-2 text-left font-bold text-slate-900 whitespace-nowrap">
                      {row.class_name}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {row.total_students}
                    </td>
                    {rules.map((r) => {
                      const count = row.rules[r.code] || 0;
                      return (
                        <td
                          key={r.code}
                          className={`px-2 py-2 font-mono ${
                            count > 0 ? 'font-bold text-red-600 bg-red-50/40' : 'text-slate-300'
                          }`}
                        >
                          {count > 0 ? count : '—'}
                        </td>
                      );
                    })}
                    <td className="px-2.5 py-2 font-bold text-red-700 bg-red-50/20">
                      {row.total_violations}
                    </td>
                    <td className="px-2.5 py-2 font-bold text-red-700">
                      -{row.total_deductions}đ
                    </td>
                    <td className="px-3 py-2 font-black text-[#0e3a7c] bg-blue-50/40">
                      {row.avg_kpi} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content View 2: Students KPI Ranking Table */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Bảng tổng hợp điểm rèn luyện KPI học sinh toàn trường
            </h3>
            <span className="text-[11px] text-slate-500">
              Xếp hạng từ thấp lên cao để dễ dàng theo dõi các trường hợp cần rèn luyện
            </span>
          </div>

          <div className="overflow-x-auto max-h-[65vh]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] border-b border-slate-300 z-10">
                <tr>
                  <th className="px-4 py-2.5">Mã HS</th>
                  <th className="px-4 py-2.5">Họ và tên</th>
                  <th className="px-3 py-2.5">Lớp</th>
                  <th className="px-3 py-2.5">Hình thức</th>
                  <th className="px-3 py-2.5">Phòng KTX</th>
                  <th className="px-3 py-2.5 text-center">Điểm gốc</th>
                  <th className="px-3 py-2.5 text-center text-red-600">Tổng trừ</th>
                  <th className="px-3 py-2.5 text-center font-bold text-[#0e3a7c]">Điểm còn lại</th>
                  <th className="px-4 py-2.5 text-right">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsKpi.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-2.5 font-mono font-bold text-[#0e3a7c]">
                      {st.code}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {st.full_name}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-700">
                      {st.class_name}
                    </td>
                    <td className="px-3 py-2.5">
                      {st.is_boarding === 1 ? 'Nội trú' : 'Ngoại trú'}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      {st.room_code || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-500">
                      100
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-red-600">
                      {st.total_deducted > 0 ? `-${st.total_deducted}` : '0'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-black text-slate-900 text-sm">
                      {st.final_score} đ
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        st.classification === 'Xuất sắc' ? 'bg-amber-100 text-amber-900' :
                        st.classification === 'Tốt' ? 'bg-emerald-100 text-emerald-800' :
                        st.classification === 'Đạt' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {st.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
