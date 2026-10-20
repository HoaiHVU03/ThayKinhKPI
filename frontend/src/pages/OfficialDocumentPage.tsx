// frontend/src/pages/OfficialDocumentPage.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSchoolSettings } from '../context/SchoolSettingsContext';
import {
  Printer,
  FileDown,
  ArrowLeft,
  Building2,
  GraduationCap,
  User,
  Search,
} from 'lucide-react';

export const OfficialDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings: schoolSettings } = useSchoolSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: 'school' | 'class' | 'student'
  const activeTab = (searchParams.get('tab') as 'school' | 'class' | 'student') || 'school';
  const paramId = searchParams.get('id');

  // School doc state
  const [schoolDoc, setSchoolDoc] = useState<any>(null);

  // Class doc state
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(paramId ? parseInt(paramId) : 1);
  const [classDoc, setClassDoc] = useState<any>(null);

  // Student doc state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<number | 'all'>('all');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(paramId ? parseInt(paramId) : 1);
  const [studentDoc, setStudentDoc] = useState<any>(null);

  const [, setLoading] = useState(true);

  // Fetch initial metadata: school doc and classes list
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [docData, classesData]: any = await Promise.all([
          api.get('/reports/official-document'),
          api.get('/classes'),
        ]);
        setSchoolDoc(docData);
        setClassesList(classesData || []);
        if (classesData && classesData.length > 0 && !paramId) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (err) {
        console.error('Error fetching init document data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, [paramId]);

  // Fetch student candidates when student tab is active
  useEffect(() => {
    if (activeTab !== 'student') return;
    const fetchStudents = async () => {
      try {
        let url = `/students?limit=100`;
        if (studentClassFilter !== 'all') {
          url += `&class_id=${studentClassFilter}`;
        }
        if (studentSearch.trim()) {
          url += `&search=${encodeURIComponent(studentSearch.trim())}`;
        }
        const res: any = await api.get(url);
        const items = res?.items || [];
        setStudentsList(items);
        if (items.length > 0 && (!selectedStudentId || !items.some((s: any) => s.id === selectedStudentId))) {
          if (!paramId) {
            setSelectedStudentId(items[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching students list:', err);
      }
    };
    fetchStudents();
  }, [activeTab, studentClassFilter, studentSearch, paramId, selectedStudentId]);

  // Fetch Class Doc when selectedClassId changes
  useEffect(() => {
    if (activeTab !== 'class' || !selectedClassId) return;
    const fetchClassDoc = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/reports/class-kpi/${selectedClassId}`);
        setClassDoc(data);
      } catch (err) {
        console.error('Error fetching class KPI document:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClassDoc();
  }, [activeTab, selectedClassId]);

  // Fetch Student Card when selectedStudentId changes
  useEffect(() => {
    if (activeTab !== 'student' || !selectedStudentId) return;
    const fetchStudentDoc = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/reports/student-kpi-card/${selectedStudentId}`);
        setStudentDoc(data);
      } catch (err) {
        console.error('Error fetching student KPI card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentDoc();
  }, [activeTab, selectedStudentId]);

  const handleTabChange = (tab: 'school' | 'class' | 'student') => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    if (tab === 'class') {
      newParams.set('id', String(selectedClassId || 1));
    } else if (tab === 'student') {
      newParams.set('id', String(selectedStudentId || 1));
    } else {
      newParams.delete('id');
    }
    setSearchParams(newParams);
  };

  const handlePrint = () => {
    window.print();
  };

  // Export to standard Microsoft Word (.doc) with Times New Roman 13pt
  const handleExportWord = () => {
    const printAreaEl = document.querySelector('.print-area');
    if (!printAreaEl) return;
    const content = printAreaEl.innerHTML;
    const tabName =
      activeTab === 'school'
        ? 'Bao_Cao_Tong_Hop_Nen_Nep_Toan_Truong'
        : activeTab === 'class'
        ? `Bang_Diem_KPI_Lop_${classDoc?.class?.code || 'Lop'}`
        : `Phieu_KPI_${studentDoc?.student?.code || 'HocSinh'}`;

    const wordTemplate = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${tabName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 210mm 297mm;
      margin: 20mm 15mm 20mm 25mm;
      mso-page-orientation: portrait;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.4;
      color: #000000;
    }
    * {
      font-family: 'Times New Roman', Times, serif !important;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 10px;
      margin-bottom: 10px;
    }
    th, td {
      border: 1px solid #000000;
      padding: 6px 8px;
      font-size: 12pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    h1 {
      font-size: 15pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin-top: 18px;
      margin-bottom: 6px;
    }
    p {
      font-size: 13pt;
      line-height: 1.4;
      margin-top: 6px;
      margin-bottom: 6px;
      text-align: justify;
    }
    .indent-8 {
      text-indent: 28pt;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

    const blob = new Blob(['\ufeff', wordTemplate], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tabName}_TimesNewRoman_13pt.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar & Mode Switcher (Hidden on Print) */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reports')}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              title="Quay lại danh mục báo cáo"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#0e3a7c]" />
                In văn bản & báo cáo hành chính (A4 Chuẩn NĐ 30/2020)
              </h2>
              <p className="text-xs text-slate-500">
                Phông chữ chuẩn: <strong>Times New Roman cỡ 13pt</strong> • Lề chuẩn A4: Trái 25mm, Phải 15mm, Trên 20mm, Dưới 20mm
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportWord}
              className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              title="Xuất trực tiếp file Word (.doc) chuẩn Times New Roman cỡ 13pt"
            >
              <FileDown className="w-4 h-4 text-blue-700" /> Tải bản Word (.doc)
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
              title="In trực tiếp ra máy in hoặc lưu PDF A4"
            >
              <Printer className="w-4 h-4" /> In văn bản (A4)
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-t border-slate-200 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange('school')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap touch-manipulation ${
              activeTab === 'school'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> 1. Báo cáo toàn trường
          </button>

          <button
            onClick={() => handleTabChange('class')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap touch-manipulation ${
              activeTab === 'class'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> 2. Bảng điểm KPI lớp
          </button>

          <button
            onClick={() => handleTabChange('student')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap touch-manipulation ${
              activeTab === 'student'
                ? 'bg-[#0e3a7c] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> 3. Phiếu KPI học sinh
          </button>
        </div>

        {/* Controls for Class Tab */}
        {activeTab === 'class' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Chọn lớp cần in:</span>
            <select
              value={selectedClassId}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                setSelectedClassId(id);
                const newParams = new URLSearchParams(searchParams);
                newParams.set('tab', 'class');
                newParams.set('id', String(id));
                setSearchParams(newParams);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name} (Khối {c.grade_level})
                </option>
              ))}
            </select>
            {classDoc?.class && (
              <span className="text-xs text-slate-600">
                GVCN: <strong>{classDoc.class.teacher_name}</strong> • Sĩ số: <strong>{classDoc.class.total_students} HS</strong> • Điểm TB: <strong>{classDoc.class.avg_score}đ</strong>
              </span>
            )}
          </div>
        )}

        {/* Controls for Student Tab */}
        {activeTab === 'student' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Lớp:</span>
              <select
                value={studentClassFilter}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                  setStudentClassFilter(val);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tất cả 54 lớp</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã / tên học sinh..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Chọn HS:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setSelectedStudentId(id);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('tab', 'student');
                  newParams.set('id', String(id));
                  setSearchParams(newParams);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
              >
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.full_name} ({s.class_name || 'Lớp'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (PRINTABLE A4 - TIMES NEW ROMAN 13PT) */}
      <div className="print-area overflow-x-auto no-scrollbar pb-6">
        {/* ========================================================= */}
        {/* TAB 1: TOÀN TRƯỜNG (Báo cáo tổng hợp NĐ 30/2020)          */}
        {/* ========================================================= */}
        {activeTab === 'school' && (
          <div
            className="official-doc-paper max-w-[210mm] min-w-[320mm] sm:min-w-0 mx-auto bg-white p-4 sm:p-10 md:p-14 shadow-lg border border-slate-300 rounded-lg text-black leading-relaxed print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-w-0"
            style={{ fontFamily: '"Times New Roman", Times, "Cambria", serif', fontSize: '13pt', lineHeight: '1.4' }}
          >
            {/* National Header & Agency Header */}
            <div className="flex justify-between items-start text-[12pt] leading-tight">
              <div className="text-center w-5/12 leading-snug">
                <div className="text-[12pt] text-black">
                  {schoolDoc?.dept_name || `SỞ GIÁO DỤC VÀ ĐÀO TẠO ${(schoolSettings.school_province || 'PHÚ THỌ').toUpperCase()}`}
                </div>
                <div className="font-bold text-[12pt] text-black uppercase">
                  {schoolDoc?.school_name || (schoolSettings.school_name || 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG').toUpperCase()}
                </div>
                <div className="w-28 h-[1px] bg-black mx-auto my-1.5"></div>
                <div className="text-[12pt] text-black mt-1">Số: {schoolDoc?.doc_number || '2026/BC-THPTCHV'}</div>
              </div>

              <div className="text-center w-6/12 leading-snug">
                <div className="font-bold uppercase text-[12pt] text-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-[13pt] text-black">Độc lập - Tự do - Hạnh phúc</div>
                <div className="w-36 h-[1px] bg-black mx-auto my-1.5"></div>
                <div className="text-[13pt] italic text-black mt-1">
                  {schoolSettings.school_province || 'Phú Thọ'}, {schoolDoc?.doc_date || 'ngày 18 tháng 10 năm 2026'}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-7">
              <h1 className="text-[15pt] font-bold uppercase text-black tracking-tight leading-snug">
                BÁO CÁO TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ NỀN NẾP<br />VÀ ĐIỂM KPI RÈN LUYỆN TOÀN TRƯỜNG
              </h1>
              <p className="text-[13pt] font-bold text-black mt-1 italic">
                (Học kỳ 1 — Năm học {schoolSettings.academic_year_current || '2026 - 2027'})
              </p>
            </div>

            {/* Document Body */}
            <div className="space-y-3.5 text-[13pt] text-black leading-[1.4]">
              <p className="indent-8 text-left">
                Kính gửi: <strong>Ban Giám hiệu {schoolSettings.school_name || 'Trường THPT Chuyên Hùng Vương'}</strong>.
              </p>
              <p className="indent-8 text-justify">
                Căn cứ Quy chế quản lý học sinh và nề nếp Ký túc xá của {schoolSettings.school_name || 'Trường THPT Chuyên Hùng Vương'}; Ban Quản sinh KTX phối hợp cùng Đoàn trường và các Giáo viên chủ nhiệm tiến hành tổng hợp số liệu đánh giá rèn luyện nề nếp và tính điểm KPI của toàn thể {schoolDoc?.stats?.total_students || 1883} học sinh trong Học kỳ 1 Năm học {schoolSettings.academic_year_current || '2026 - 2027'}, cụ thể như sau:
              </p>

              {/* Section 1: Data Summary Table */}
              <div>
                <h3 className="font-bold text-[13pt] uppercase mb-1.5">I. Bảng tổng hợp số liệu toàn trường:</h3>
                <table className="w-full border-collapse border border-black text-center text-[12pt] my-2">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-2 w-12">TT</th>
                      <th className="border border-black p-2 text-left">Chỉ tiêu theo dõi</th>
                      <th className="border border-black p-2 w-28">Quy mô</th>
                      <th className="border border-black p-2 text-left">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1.5">1</td>
                      <td className="border border-black p-1.5 text-left">Tổng số học sinh toàn trường</td>
                      <td className="border border-black p-1.5 font-bold">{schoolDoc?.stats?.total_students || 1883}</td>
                      <td className="border border-black p-1.5 text-left">54 lớp chuyên (Khối 10, 11, 12)</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5">2</td>
                      <td className="border border-black p-1.5 text-left">Số học sinh nội trú KTX</td>
                      <td className="border border-black p-1.5 font-bold">{schoolDoc?.stats?.total_boarding || 699}</td>
                      <td className="border border-black p-1.5 text-left">Nam: 335 HS • Nữ: 364 HS (37.2%)</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5">3</td>
                      <td className="border border-black p-1.5 text-left">Số học sinh ngoại trú</td>
                      <td className="border border-black p-1.5 font-bold">{(schoolDoc?.stats?.total_students || 1883) - (schoolDoc?.stats?.total_boarding || 699)}</td>
                      <td className="border border-black p-1.5 text-left">Học sinh đi về trong ngày (62.8%)</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5">4</td>
                      <td className="border border-black p-1.5 text-left">Số phòng KTX đang quản lý</td>
                      <td className="border border-black p-1.5 font-bold">120</td>
                      <td className="border border-black p-1.5 text-left">Tầng 2 đến Tầng 6 (100% công suất)</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5">5</td>
                      <td className="border border-black p-1.5 text-left">Điểm KPI rèn luyện trung bình toàn trường</td>
                      <td className="border border-black p-1.5 font-bold">{schoolDoc?.stats?.avg_score || 99.9} đ</td>
                      <td className="border border-black p-1.5 text-left">Thang điểm gốc 100 điểm / HK1</td>
                    </tr>
                    <tr>
                      <td className="border border-black p-1.5">6</td>
                      <td className="border border-black p-1.5 text-left">Số biên bản vi phạm đã xử lý</td>
                      <td className="border border-black p-1.5 font-bold">{schoolDoc?.stats?.total_violations || 51}</td>
                      <td className="border border-black p-1.5 text-left">10 mã lỗi nề nếp (L01 đến L10)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Classification breakdown */}
              <div className="mt-3">
                <h3 className="font-bold text-[13pt] uppercase mb-1.5">II. Kết quả xếp loại rèn luyện KPI:</h3>
                <table className="w-full border-collapse border border-black text-center text-[12pt] my-2">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-2">Xuất sắc (90 - 100đ)</th>
                      <th className="border border-black p-2">Tốt (75 - 89đ)</th>
                      <th className="border border-black p-2">Đạt (50 - 74đ)</th>
                      <th className="border border-black p-2">Chưa đạt (&lt; 50đ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold">
                      <td className="border border-black p-2 text-[13pt]">{schoolDoc?.stats?.excellent_count || 1883} HS</td>
                      <td className="border border-black p-2 text-[13pt]">{schoolDoc?.stats?.good_count || 38} HS</td>
                      <td className="border border-black p-2 text-[13pt]">{schoolDoc?.stats?.pass_count || 7} HS</td>
                      <td className="border border-black p-2 text-[13pt]">{schoolDoc?.stats?.fail_count || 0} HS</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Recommendations */}
              <div className="mt-4 space-y-2">
                <h3 className="font-bold text-[13pt] uppercase mb-1">III. Đánh giá chung & kiến nghị:</h3>
                <p className="indent-8 text-justify">
                  - Nề nếp chung của 54 lớp chuyên và Ký túc xá duy trì ở mức gương mẫu, nghiêm túc. Việc thực hiện 11 chế độ sinh hoạt trong ngày (thể dục sáng 05h30, truy bài 15 phút, tắt đèn 22h30) đi vào nề nếp tự giác.
                </p>
                <p className="indent-8 text-justify">
                  - Ban Quản sinh KTX phối hợp cùng GVCN tiếp tục siết chặt kiểm tra nề nếp ca tối 22h00 và điểm danh tự động kết nối thông báo đến phụ huynh để đảm bảo 100% học sinh nội trú an toàn tuyệt đối.
                </p>
              </div>
            </div>

            {/* Recipients & Signatures */}
            <div className="mt-8 pt-4 flex justify-between items-start text-[13pt]">
              <div className="w-5/12 leading-relaxed">
                <div className="font-bold italic text-[12pt]">Nơi nhận:</div>
                <div className="text-[11pt] space-y-0.5 text-black">
                  <div>- Ban Giám hiệu (để b/c);</div>
                  <div>- Đoàn TNCS Hồ Chí Minh;</div>
                  <div>- Ban Quản sinh KTX;</div>
                  <div>- 54 GVCN các lớp;</div>
                  <div>- Lưu: VT, HS.</div>
                </div>
              </div>

              <div className="w-6/12 flex justify-between text-center">
                <div>
                  <div className="font-bold uppercase text-black text-[13pt]">TRƯỞNG BAN QUẢN SINH</div>
                  <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký, ghi rõ họ tên)</div>
                  <div className="font-bold text-black mt-2 text-[13pt]">{schoolSettings.dorm_manager_name || 'Thầy Đỗ Văn Thắng'}</div>
                </div>

                <div>
                  <div className="font-bold uppercase text-black text-[13pt]">HIỆU TRƯỞNG</div>
                  <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký và đóng dấu)</div>
                  <div className="font-bold text-black mt-2 text-[13pt]">{schoolSettings.principal_name || 'TS. Phạm Tuấn Anh'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CÙNG LỚP (Bảng điểm KPI cả lớp)                    */}
        {/* ========================================================= */}
        {activeTab === 'class' && (
          <div
            className="official-doc-paper max-w-[210mm] min-w-[320mm] sm:min-w-0 mx-auto bg-white p-4 sm:p-10 md:p-12 shadow-lg border border-slate-300 rounded-lg text-black leading-relaxed print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-w-0"
            style={{ fontFamily: '"Times New Roman", Times, "Cambria", serif', fontSize: '13pt', lineHeight: '1.4' }}
          >
            {/* National & School Header */}
            <div className="flex justify-between items-start text-[12pt] leading-tight">
              <div className="text-center w-5/12 leading-snug">
                <div className="text-[12pt] text-black">
                  {classDoc?.dept_name || `SỞ GIÁO DỤC VÀ ĐÀO TẠO ${(schoolSettings.school_province || 'PHÚ THỌ').toUpperCase()}`}
                </div>
                <div className="font-bold text-[12pt] text-black uppercase">
                  {classDoc?.school_name || (schoolSettings.school_name || 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG').toUpperCase()}
                </div>
                <div className="w-24 h-[1px] bg-black mx-auto my-1.5"></div>
                <div className="text-[12pt] text-black mt-1">Số: {classDoc?.doc_number || '2026/KPI-LOP'}</div>
              </div>

              <div className="text-center w-6/12 leading-snug">
                <div className="font-bold uppercase text-[12pt] text-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-[13pt] text-black">Độc lập - Tự do - Hạnh phúc</div>
                <div className="w-36 h-[1px] bg-black mx-auto my-1.5"></div>
                <div className="text-[13pt] italic text-black mt-1">
                  {schoolSettings.school_province || 'Phú Thọ'}, {classDoc?.doc_date || 'ngày 18 tháng 10 năm 2026'}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6">
              <h1 className="text-[15pt] font-bold uppercase text-black tracking-tight leading-snug">
                BẢNG TỔNG HỢP ĐIỂM KPI & NỀN NẾP HỌC SINH CÙNG LỚP
              </h1>
              <p className="text-[13pt] font-bold text-black mt-1">
                Lớp: {classDoc?.class?.code} — {classDoc?.class?.name} (Khối {classDoc?.class?.grade_level})
              </p>
              <p className="text-[12pt] text-black italic">
                {classDoc?.semester || 'Học kỳ 1 — Năm học 2026 - 2027'}
              </p>
            </div>

            {/* Class Metadata Summary Bar */}
            <div className="mb-4 p-3 border border-black rounded text-[12pt]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-black">Giáo viên chủ nhiệm:</span>
                  <div className="font-bold text-black">{classDoc?.class?.teacher_name}</div>
                  <div className="text-[11pt] text-black">SĐT: {classDoc?.class?.teacher_phone || '---'}</div>
                </div>
                <div>
                  <span className="text-black">Sĩ số lớp:</span>
                  <div className="font-bold text-black">
                    {classDoc?.class?.total_students} HS ({classDoc?.class?.boarding_students} nội trú • {Math.max(0, (classDoc?.class?.total_students || 0) - (classDoc?.class?.boarding_students || 0))} ngoại trú)
                  </div>
                </div>
                <div>
                  <span className="text-black">Điểm KPI Trung bình:</span>
                  <div className="font-bold text-black text-[13pt]">{classDoc?.class?.avg_score} điểm</div>
                </div>
                <div>
                  <span className="text-black">Xếp loại thi đua:</span>
                  <div className="font-bold text-black">
                    {classDoc?.class?.classification_stats?.['Xuất sắc'] || 0} Xuất sắc • {classDoc?.class?.classification_stats?.['Tốt'] || 0} Tốt
                  </div>
                </div>
              </div>
            </div>

            {/* Student Roster Table */}
            <div>
              <table className="w-full border-collapse border border-black text-[11.5pt] text-center">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-black p-1.5 w-8">TT</th>
                    <th className="border border-black p-1.5 w-20">Mã HS</th>
                    <th className="border border-black p-1.5 text-left">Họ và tên học sinh</th>
                    <th className="border border-black p-1.5 w-12">Phái</th>
                    <th className="border border-black p-1.5 w-16">Phòng</th>
                    <th className="border border-black p-1.5 w-12">Gốc</th>
                    <th className="border border-black p-1.5 w-12">Trừ</th>
                    <th className="border border-black p-1.5 w-14">Tổng</th>
                    <th className="border border-black p-1.5 w-20">Xếp loại</th>
                    <th className="border border-black p-1.5 text-left">Ghi chú vi phạm</th>
                  </tr>
                </thead>
                <tbody>
                  {(classDoc?.students || []).map((st: any, idx: number) => {
                    const isBoarding = !!st.is_boarding;
                    const finalScore = parseFloat(st.final_score);
                    const deducted = parseFloat(st.total_deducted);
                    return (
                      <tr key={st.id}>
                        <td className="border border-black p-1">{idx + 1}</td>
                        <td className="border border-black p-1 font-semibold">{st.code}</td>
                        <td className="border border-black p-1 text-left font-semibold text-black">
                          {st.full_name}
                        </td>
                        <td className="border border-black p-1">{st.gender}</td>
                        <td className="border border-black p-1">
                          {isBoarding ? st.room_code || 'KTX' : 'Ngoại trú'}
                        </td>
                        <td className="border border-black p-1">{st.baseline_score || 100}</td>
                        <td className="border border-black p-1 font-bold">
                          {deducted > 0 ? `-${deducted}` : '0'}
                        </td>
                        <td className="border border-black p-1 font-bold">
                          {finalScore}
                        </td>
                        <td className="border border-black p-1 font-semibold">
                          {st.classification || 'Xuất sắc'}
                        </td>
                        <td className="border border-black p-1 text-left text-[11pt] text-black">
                          {st.violations_summary || 'Không vi phạm'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 flex justify-between items-start text-[13pt]">
              <div className="text-center w-3/12">
                <div className="font-bold uppercase text-black text-[13pt]">LỚP TRƯỞNG</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký, ghi rõ họ tên)</div>
                <div className="font-semibold text-black mt-2 text-[12pt]">Đại diện Ban cán sự lớp</div>
              </div>

              <div className="text-center w-4/12">
                <div className="font-bold uppercase text-black text-[13pt]">GIÁO VIÊN CHỦ NHIỆM</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký, ghi rõ họ tên)</div>
                <div className="font-bold text-black mt-2 text-[13pt]">{classDoc?.class?.teacher_name}</div>
              </div>

              <div className="text-center w-4/12">
                <div className="font-bold uppercase text-black text-[13pt]">BAN GIÁM HIỆU DUYỆT</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký và đóng dấu)</div>
                <div className="font-bold text-black mt-2 text-[13pt]">{schoolSettings.principal_name || 'TS. Phạm Tuấn Anh'}</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TỪNG HỌC SINH (Phiếu theo dõi rèn luyện cá nhân A4) */}
        {/* ========================================================= */}
        {activeTab === 'student' && (
          <div
            className="official-doc-paper max-w-[210mm] min-w-[320mm] sm:min-w-0 mx-auto bg-white p-4 sm:p-10 md:p-14 shadow-lg border border-slate-300 rounded-lg text-black leading-relaxed print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:min-w-0"
            style={{ fontFamily: '"Times New Roman", Times, "Cambria", serif', fontSize: '13pt', lineHeight: '1.4' }}
          >
            {/* National & School Header */}
            <div className="flex justify-between items-start text-[12pt] leading-tight">
              <div className="text-center w-5/12 leading-snug">
                <div className="text-[12pt] text-black">
                  {studentDoc?.dept_name || `SỞ GIÁO DỤC VÀ ĐÀO TẠO ${(schoolSettings.school_province || 'PHÚ THỌ').toUpperCase()}`}
                </div>
                <div className="font-bold text-[12pt] text-black uppercase">
                  {studentDoc?.school_name || (schoolSettings.school_name || 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG').toUpperCase()}
                </div>
                <div className="w-24 h-[1px] bg-black mx-auto my-1.5"></div>
                <div className="text-[12pt] text-black mt-1">Số: {studentDoc?.doc_number || '2026/PKPI-HS'}</div>
              </div>

              <div className="text-center w-6/12 leading-snug">
                <div className="font-bold uppercase text-[12pt] text-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold text-[13pt] text-black">Độc lập - Tự do - Hạnh phúc</div>
                <div className="w-36 h-[1px] bg-black mx-auto my-1.5"></div>
                <div className="text-[13pt] italic text-black mt-1">
                  {schoolSettings.school_province || 'Phú Thọ'}, {studentDoc?.doc_date || 'ngày 18 tháng 10 năm 2026'}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6">
              <h1 className="text-[15pt] font-bold uppercase text-black tracking-tight leading-snug">
                PHIẾU THEO DÕI RÈN LUYỆN NỀN NẾP & ĐIỂM KPI CÁ NHÂN
              </h1>
              <p className="text-[13pt] font-bold text-black mt-1 italic">
                {studentDoc?.semester || 'Học kỳ 1 — Năm học 2026 - 2027'}
              </p>
            </div>

            {/* Student Profile Box */}
            <div className="border border-black rounded p-4 mb-4 text-[12.5pt]">
              <h3 className="font-bold text-[13pt] uppercase mb-2 text-black border-b border-black pb-1">
                I. THÔNG TIN HỌC SINH:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-black">Họ và tên:</span>
                  <div className="font-bold text-black text-[13pt]">{studentDoc?.student?.full_name}</div>
                </div>
                <div>
                  <span className="text-black">Mã học sinh:</span>
                  <div className="font-bold text-black">{studentDoc?.student?.code}</div>
                </div>
                <div>
                  <span className="text-black">Lớp chuyên:</span>
                  <div className="font-bold text-black">{studentDoc?.student?.class_name} ({studentDoc?.student?.class_code})</div>
                </div>
                <div>
                  <span className="text-black">Giới tính:</span>
                  <div className="font-medium text-black">{studentDoc?.student?.gender}</div>
                </div>
                <div>
                  <span className="text-black">Ngày sinh:</span>
                  <div className="font-medium text-black">{studentDoc?.student?.dob || '---'}</div>
                </div>
                <div>
                  <span className="text-black">Diện cư trú:</span>
                  <div className="font-bold text-black">
                    {studentDoc?.student?.is_boarding ? (
                      <span>Nội trú (Phòng {studentDoc?.student?.room_code || '---'}, Tầng {studentDoc?.student?.floor_number || '2'})</span>
                    ) : (
                      <span>Ngoại trú</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-black">Giáo viên chủ nhiệm:</span>
                  <div className="font-medium text-black">{studentDoc?.student?.teacher_name} ({studentDoc?.student?.teacher_phone || '---'})</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-black">Phụ huynh học sinh:</span>
                  <div className="font-medium text-black">
                    {studentDoc?.student?.parent_name || 'Đại diện phụ huynh'} — SĐT: {studentDoc?.student?.parent_phone || '---'}
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Evaluation Summary Box */}
            <div className="border border-black rounded p-4 mb-4 text-[12.5pt]">
              <h3 className="font-bold text-[13pt] uppercase mb-2 text-black border-b border-black pb-1">
                II. KẾT QUẢ ĐÁNH GIÁ ĐIỂM KPI RÈN LUYỆN:
              </h3>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2 border border-black rounded">
                  <span className="text-black block text-[11pt]">Điểm chuẩn đầu kỳ</span>
                  <strong className="text-[13pt] text-black">100 điểm</strong>
                </div>
                <div className="p-2 border border-black rounded">
                  <span className="text-black block text-[11pt]">Tổng điểm bị trừ</span>
                  <strong className="text-[13pt] text-black">
                    -{studentDoc?.student?.total_deducted || 0} điểm
                  </strong>
                </div>
                <div className="p-2 border border-black rounded">
                  <span className="text-black block text-[11pt]">Điểm KPI tổng kết</span>
                  <strong className="text-[13pt] text-black">
                    {studentDoc?.student?.final_score || 100} điểm
                  </strong>
                </div>
                <div className="p-2 border border-black rounded">
                  <span className="text-black block text-[11pt]">Xếp loại nền nếp</span>
                  <strong className="text-[13pt] text-black uppercase">
                    {studentDoc?.student?.classification || 'Xuất sắc'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Detailed Itemized Violations Table */}
            <div className="mb-6">
              <h3 className="font-bold text-[13pt] uppercase mb-2 text-black">
                III. CHI TIẾT CÁC BIÊN BẢN VI PHẠM TRONG HỌC KỲ (NẾU CÓ):
              </h3>
              {(!studentDoc?.violations || studentDoc.violations.length === 0) ? (
                <div className="p-4 border border-black rounded text-[12pt] text-center">
                  <strong>HỌC SINH GƯƠNG MẪU:</strong> Không có biên bản vi phạm nề nếp nào trong suốt học kỳ. Đạt điểm rèn luyện tối đa!
                </div>
              ) : (
                <table className="w-full border-collapse border border-black text-[11.5pt] text-center">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-1.5 w-8">TT</th>
                      <th className="border border-black p-1.5 w-20">Mã BB</th>
                      <th className="border border-black p-1.5 w-24">Ngày & Giờ</th>
                      <th className="border border-black p-1.5 text-left">Hành vi vi phạm</th>
                      <th className="border border-black p-1.5 text-left w-24">Địa điểm</th>
                      <th className="border border-black p-1.5 w-16">Điểm trừ</th>
                      <th className="border border-black p-1.5 text-left w-28">Người lập BB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDoc.violations.map((v: any, idx: number) => (
                      <tr key={v.id}>
                        <td className="border border-black p-1.5">{idx + 1}</td>
                        <td className="border border-black p-1.5 font-semibold">{v.code}</td>
                        <td className="border border-black p-1.5">
                          {v.violation_date} {v.violation_time?.slice(0, 5)}
                        </td>
                        <td className="border border-black p-1.5 text-left">
                          <strong>[{v.rule_code}]</strong> {v.rule_name}
                          {v.description && <div className="text-[11pt] text-black italic mt-0.5">{v.description}</div>}
                        </td>
                        <td className="border border-black p-1.5 text-left">{v.location || 'Khuôn viên'}</td>
                        <td className="border border-black p-1.5 font-bold">
                          -{v.points_deducted}đ
                        </td>
                        <td className="border border-black p-1.5 text-left text-[11pt]">{v.reporter_name || 'Quản sinh'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 4-party Signatures */}
            <div className="pt-4 flex justify-between items-start text-[13pt]">
              <div className="text-center w-2/12">
                <div className="font-bold uppercase text-black text-[13pt]">HỌC SINH</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký, ghi rõ họ tên)</div>
                <div className="font-bold text-black mt-2 text-[12pt]">{studentDoc?.student?.full_name}</div>
              </div>

              <div className="text-center w-3/12">
                <div className="font-bold uppercase text-black text-[13pt]">PHỤ HUYNH HỌC SINH</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký, ghi rõ họ tên)</div>
                <div className="font-bold text-black mt-2 text-[12pt]">{studentDoc?.student?.parent_name || 'Đại diện PHHS'}</div>
              </div>

              <div className="text-center w-3/12">
                <div className="font-bold uppercase text-black text-[13pt]">GV CHỦ NHIỆM</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký, ghi rõ họ tên)</div>
                <div className="font-bold text-black mt-2 text-[12pt]">{studentDoc?.student?.teacher_name}</div>
              </div>

              <div className="text-center w-3/12">
                <div className="font-bold uppercase text-black text-[13pt]">HIỆU TRƯỞNG</div>
                <div className="h-16 flex items-center justify-center italic text-slate-500 text-[11pt]">(Ký và đóng dấu)</div>
                <div className="font-bold text-black mt-2 text-[12pt]">{schoolSettings.principal_name || 'TS. Phạm Tuấn Anh'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
