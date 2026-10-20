// frontend/src/pages/StudentLeaveSubmitPage.tsx
// Cổng nộp đơn xin phép KTX trực tuyến dành cho Học sinh & Phụ huynh
// Tương thích 100% điện thoại thông minh (quét mã QR) và máy tính

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSchoolSettings } from '../context/SchoolSettingsContext';
import { SchoolLogo } from '../components/SchoolLogo';
import {
  FileText,
  User,
  GraduationCap,
  Building2,
  Calendar,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Send,
  Home,
  ArrowLeft,
  Check,
  Sparkles
} from 'lucide-react';

interface FoundStudent {
  id: number;
  code: string;
  full_name: string;
  dob: string;
  student_phone?: string;
  parent_phone?: string;
  class_name: string;
  room_code?: string;
}

export const StudentLeaveSubmitPage: React.FC = () => {
  const { settings: schoolSettings, currentSchoolCode } = useSchoolSettings();

  // Search student
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoundStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<FoundStudent | null>(null);

  // Form fields
  const [requestType, setRequestType] = useState('home');
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [expectedEndTime, setExpectedEndTime] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [parentConfirmation, setParentConfirmation] = useState(1);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    code: string;
    student_name: string;
    student_code: string;
    created_at: string;
  } | null>(null);

  // Pre-fill default start now, return tomorrow 21:00
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setStartTime(`${y}-${m}-${d}T${hh}:${mm}`);

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ty = tomorrow.getFullYear();
    const tm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const td = String(tomorrow.getDate()).padStart(2, '0');
    setExpectedEndTime(`${ty}-${tm}-${td}T21:00`);
  }, []);

  // Debounced student search
  useEffect(() => {
    if (selectedStudent) return;
    const q = searchTerm.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res: any = await api.get('/public/students-search', { q });
        setSearchResults(res || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedStudent]);

  const handleSelectStudent = (s: FoundStudent) => {
    setSelectedStudent(s);
    setSearchResults([]);
    setSearchTerm('');
    if (s.parent_phone) {
      setContactPhone(s.parent_phone);
    } else if (s.student_phone) {
      setContactPhone(s.student_phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedStudent) {
      setErrorMsg('Vui lòng tìm và chọn đúng học sinh cần nộp đơn');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập rõ lý do xin phép ra ngoài KTX');
      return;
    }

    if (!startTime || !expectedEndTime) {
      setErrorMsg('Vui lòng chọn thời gian bắt đầu và thời gian trở về dự kiến');
      return;
    }

    setIsSubmitting(true);
    try {
      const res: any = await api.post('/public/leave-requests', {
        student_id: selectedStudent.id,
        request_type: requestType,
        reason: reason.trim(),
        start_time: startTime,
        expected_end_time: expectedEndTime,
        contact_phone: contactPhone.trim(),
        parent_confirmation: parentConfirmation
      });

      setSubmittedData({
        code: res.code,
        student_name: res.student_name,
        student_code: res.student_code,
        created_at: res.created_at
      });

      // Notify other tabs via BroadcastChannel
      try {
        const bc = new BroadcastChannel('kpi_leaves_realtime');
        bc.postMessage({ type: 'NEW_LEAVE', code: res.code });
        bc.close();
      } catch {}

      window.dispatchEvent(new CustomEvent('leave-request-updated'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gửi đơn xin phép');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedStudent(null);
    setReason('');
    setSubmittedData(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-slate-50 to-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <SchoolLogo
              schoolCode={currentSchoolCode}
              schoolName={schoolSettings.school_name}
              logoUrl={schoolSettings.school_logo}
              size="md"
              className="drop-shadow-md"
            />
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase text-[#0e3a7c] tracking-tight">
            {schoolSettings.school_name || 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG'}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            CỔNG ĐIỆN TỬ TIẾP NHẬN ĐƠN XIN PHÉP RA NGOÀI KÝ TÚC XÁ
          </p>
        </div>

        {/* Success View */}
        {submittedData ? (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase tracking-wider rounded-full">
              ĐÃ GỬI THÀNH CÔNG
            </span>

            <h2 className="text-xl font-black text-slate-900 mt-3 mb-1">
              Đơn xin phép đã được gửi!
            </h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mb-6">
              Hệ thống đã chuyển trực tiếp đơn tới Ban Quản sinh và Thầy Cô trên màn hình điều hành realtime.
            </p>

            {/* Receipt Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Mã đơn xin phép:</span>
                <span className="font-mono font-extrabold text-[#0e3a7c] text-sm">
                  {submittedData.code}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-bold text-slate-800">{submittedData.student_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã học sinh:</span>
                <span className="font-mono font-semibold text-slate-700">{submittedData.student_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Chờ Quản sinh phê duyệt
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0e3a7c] hover:bg-[#1e4ea1] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Gửi thêm đơn mới
              </button>
            </div>
          </div>
        ) : (
          /* Main Submission Form */
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0e3a7c] to-[#1e4ea1] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="font-black text-sm sm:text-base leading-tight">
                    NỘP ĐƠN XIN PHÉP KTX
                  </h2>
                  <p className="text-[11px] text-blue-100">
                    Dành cho học sinh nội trú xin về quê, học thêm hoặc việc riêng
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-white/15 text-[10px] font-bold rounded-lg uppercase">
                Trực tuyến 24/7
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1: Student Lookup */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Học sinh nộp đơn <span className="text-red-500">*</span>
                </label>

                {selectedStudent ? (
                  <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0e3a7c] text-white font-black text-sm flex items-center justify-center uppercase shadow-2xs">
                        {selectedStudent.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm">
                          {selectedStudent.full_name}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-blue-700 font-bold">{selectedStudent.code}</span>
                          <span>• Lớp {selectedStudent.class_name}</span>
                          {selectedStudent.room_code && <span>• Phòng {selectedStudent.room_code}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
                    >
                      Đổi học sinh
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nhập Mã học sinh (VD: HV100031) hoặc Họ tên..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e3a7c] bg-slate-50 focus:bg-white"
                      />
                      {isSearching && (
                        <div className="w-4 h-4 border-2 border-[#0e3a7c] border-t-transparent rounded-full animate-spin absolute right-3.5 top-3.5"></div>
                      )}
                    </div>

                    {/* Suggestions dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {searchResults.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSelectStudent(s)}
                            className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {s.full_name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Mã: <span className="font-mono font-semibold text-blue-700">{s.code}</span> • Lớp: {s.class_name} {s.room_code ? `• Phòng: ${s.room_code}` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100/60 px-2 py-1 rounded">
                              Chọn
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Reason & Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Loại đơn & Lý do xin phép <span className="text-red-500">*</span>
                </label>

                {/* Pill selection for leave category */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { id: 'home', label: 'Về quê' },
                    { id: 'medical', label: 'Khám bệnh' },
                    { id: 'tutoring', label: 'Học thêm' },
                    { id: 'personal', label: 'Việc riêng' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setRequestType(cat.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        requestType === cat.id
                          ? 'bg-[#0e3a7c] text-white border-[#0e3a7c] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể (VD: Về quê ăn giỗ cùng gia đình, Đi khám mắt tại viện tỉnh...)"
                  rows={2}
                  className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e3a7c] bg-slate-50 focus:bg-white resize-none"
                  required
                />
              </div>

              {/* Step 3: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thời gian bắt đầu đi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e3a7c] bg-slate-50 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dự kiến về lại KTX <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={expectedEndTime}
                    onChange={(e) => setExpectedEndTime(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e3a7c] bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Step 4: Contact Phone & Parent Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số điện thoại phụ huynh / liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Số điện thoại phụ huynh..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e3a7c] bg-slate-50 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentConfirmation === 1}
                      onChange={(e) => setParentConfirmation(e.target.checked ? 1 : 0)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-emerald-900">
                      Đã có xác nhận của Phụ huynh
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedStudent}
                  className="w-full py-3 bg-gradient-to-r from-[#0e3a7c] to-[#1e4ea1] hover:from-[#0a254e] hover:to-[#0e3a7c] text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi đơn...' : 'GỬI ĐƠN XIN PHÉP KÝ TÚC XÁ'}</span>
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  * Đơn sẽ được thông báo tức thì lên thanh điều hành trung tâm của Ban Quản sinh.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 mt-6">
          Hệ thống Quản lý KTX & KPI Nề nếp — {schoolSettings.school_name || 'THPT Chuyên Hùng Vương'}
        </div>
      </div>
    </div>
  );
};
