// frontend/src/pages/LoginPage.tsx
// Giao diện Đăng nhập & Điều phối Không gian Trường học chuẩn Enterprise / Giáo dục Quốc gia
// Thiết kế Responsive hoàn hảo trên Desktop (1920px), Tablet (768px-1024px) và Mobile (375px-430px)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSchoolSettings } from '../context/SchoolSettingsContext';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Building2,
  ChevronDown,
  Plus,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  PhoneCall,
  GraduationCap
} from 'lucide-react';
import { SchoolLogo } from '../components/SchoolLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const {
    settings: schoolSettings,
    schools,
    currentSchoolCode,
    switchSchool,
    createSchool,
    isLoading: isSettingsLoading,
  } = useSchoolSettings();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Popover chọn trường
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // Quick roles collapsible (để giao diện gọn gàng, không bị AI rác mắt)
  const [showQuickRoles, setShowQuickRoles] = useState(false);

  // Modal tạo trường mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newSchoolProvince, setNewSchoolProvince] = useState('Phú Thọ');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [creatingSchool, setCreatingSchool] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isHungVuong = currentSchoolCode === 'chuyenhungvuong' || currentSchoolCode === 'default';

  const chvQuickRoles = [
    { label: '1. Admin (Quản trị)', role: 'admin', user: 'admin', pass: 'password123' },
    { label: '2. Quản sinh KTX', role: 'dorm_manager', user: 'quan_sinh', pass: 'password123' },
    { label: '3. GVCN 10 Toán 1', role: 'homeroom_teacher', user: 'gv_10t1', pass: 'password123' },
    { label: '4. LT BT 10 Toán 1', role: 'class_cadre', user: 'ltbt_10t1', pass: 'password123' },
    { label: '5. Học sinh (Chỉ xem)', role: 'student', user: 'hocsinh', pass: 'password123' },
  ];

  const handleNameChange = (val: string) => {
    setNewSchoolName(val);
    if (!newSchoolCode || newSchoolCode.length < 3) {
      const clean = val
        .toLowerCase()
        .replace(/trường|thpt|chuyên|-/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');
      if (clean) setNewSchoolCode(clean);
    }
  };

  const handleSelectSchool = async (code: string) => {
    setError(null);
    setSuccessMsg(null);
    setShowSchoolDropdown(false);
    await switchSchool(code);

    if (code === 'chuyenhungvuong' || code === 'default') {
      setUsername('admin');
      setPassword('password123');
    } else if (code === 'phuninh') {
      setUsername('admin');
      setPassword('phuninh@123456');
    } else if (code === 'viettri') {
      setUsername('admin');
      setPassword('viettri123456');
    } else {
      setUsername('admin');
      setPassword('');
    }
  };

  const handleCreateSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newSchoolName.trim()) {
      setCreateError('Vui lòng nhập tên trường học');
      return;
    }
    if (!newSchoolCode.trim()) {
      setCreateError('Vui lòng nhập mã viết tắt của trường (viết liền không dấu)');
      return;
    }
    if (newAdminPass.length < 6) {
      setCreateError('Mật khẩu Admin phải từ 6 ký tự trở lên');
      return;
    }

    try {
      setCreatingSchool(true);
      await createSchool({
        school_name: newSchoolName.trim(),
        school_code: newSchoolCode.trim().toLowerCase(),
        school_province: newSchoolProvince.trim(),
        admin_password: newAdminPass,
        admin_username: 'admin',
      });

      setShowCreateModal(false);
      setShowSchoolDropdown(false);
      setSuccessMsg(`Đã tạo không gian trường "${newSchoolName}". Đăng nhập ngay với tài khoản admin!`);
      setUsername('admin');
      setPassword(newAdminPass);
      setNewSchoolName('');
      setNewSchoolCode('');
      setNewAdminPass('');
    } catch (err: any) {
      setCreateError(err.message || 'Lỗi khi khởi tạo không gian trường');
    } finally {
      setCreatingSchool(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string = 'password123') => {
    setUsername(u);
    setPassword(p);
    setError(null);
    setLoading(true);
    try {
      await login(u, p);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const currentSchoolItem = schools.find((s) => s.code === currentSchoolCode) || {
    name: schoolSettings.school_name || 'THPT Chuyên Hùng Vương',
    code: currentSchoolCode,
    province: schoolSettings.school_province || 'Phú Thọ',
    total_classes: 54,
    total_students: 1883,
    is_default: true,
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(schoolSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* ==================== TOP NAVIGATION BAR ==================== */}
      <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-300 py-3 px-4 sm:px-8 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0e3a7c] border border-blue-500/30 flex items-center justify-center text-white shrink-0 shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                Hệ Thống Quản Lý Giáo Dục & KPI Nề Nếp
              </div>
              <div className="text-[10px] text-slate-400 hidden sm:block">
                Nền tảng số hóa quản trị KTX & thi đua học đường đa trường học
              </div>
            </div>
          </div>

          {/* Right School Selector & Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              <SchoolLogo
                schoolCode={currentSchoolCode}
                schoolName={schoolSettings.school_name}
                logoUrl={schoolSettings.school_logo}
                size="xs"
                className="shrink-0"
              />
              <span className="max-w-[130px] sm:max-w-[200px] truncate text-slate-100 font-bold">
                {currentSchoolItem.name.replace('Trường THPT ', '')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu for School Selection */}
            {showSchoolDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSchoolDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900 uppercase">
                        Chọn không gian trường
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Dữ liệu mỗi trường hoàn toàn biệt lập
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSchoolDropdown(false);
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tạo trường mới
                    </button>
                  </div>

                  {/* Search inside dropdown */}
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={schoolSearchQuery}
                        onChange={(e) => setSchoolSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm trường học..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {filteredSchools.map((sch) => {
                      const isSelected = currentSchoolCode === sch.code;
                      return (
                        <button
                          key={sch.code}
                          type="button"
                          onClick={() => handleSelectSchool(sch.code)}
                          className={`w-full text-left p-2.5 sm:p-3 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-blue-50/70' : ''
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <SchoolLogo
                              schoolCode={sch.code}
                              schoolName={sch.name}
                              logoUrl={sch.logo}
                              size="sm"
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                {sch.name}
                                {isSelected && (
                                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{sch.province || 'Phú Thọ'}</span>
                                <span>•</span>
                                <span className={sch.total_classes > 0 ? 'text-blue-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                                  {sch.total_classes > 0
                                    ? `${sch.total_classes} lớp • ${sch.total_students} HS`
                                    : 'Trắng tinh (Mới)'}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0e3a7c] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================== MAIN HERO & LOGIN FRAME ==================== */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">

          {/* Left Panel: Institutional Identity & Atmosphere (5 cols) */}
          <div className="lg:col-span-5 bg-linear-to-b from-[#0c2340] via-[#0f2d52] to-[#0a1a2f] text-white p-5 sm:p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background geometric accents */}
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            {/* School Crest / Header */}
            <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex p-2.5 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 mb-3 shadow-md">
                <SchoolLogo
                  schoolCode={currentSchoolCode}
                  schoolName={schoolSettings.school_name}
                  logoUrl={schoolSettings.school_logo}
                  size="lg"
                />
              </div>
              <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-snug">
                {schoolSettings.school_name || 'Trường THPT Chuyên Hùng Vương'}
              </h1>
              <div className="text-xs text-blue-200/80 font-medium mt-0.5">
                {schoolSettings.school_province ? `Tỉnh ${schoolSettings.school_province}` : 'Phú Thọ'} • Niên khóa 2026 - 2027
              </div>

              {/* Mobile compact badge */}
              <div className="lg:hidden mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] text-blue-200 font-medium border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Không gian: {currentSchoolCode} • Biệt lập 100%</span>
              </div>
            </div>

            {/* Operational Metrics / Feature Highlights (Hidden on Mobile, Displayed on Desktop) */}
            <div className="hidden lg:block my-6 relative z-10 space-y-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Không gian làm việc:</span>
                <span className="font-mono font-bold text-blue-300">{currentSchoolCode}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Trạng thái dữ liệu:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Biệt lập 100%
                </span>
              </div>

              {currentSchoolItem.total_classes > 0 ? (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Quy mô hiện tại:</span>
                  <span className="font-bold text-white">
                    {currentSchoolItem.total_classes} lớp • {currentSchoolItem.total_students} HS
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-xs text-emerald-200">
                  ✨ Trường học mới trắng tinh. Đăng nhập để nạp dữ liệu từ file Excel.
                </div>
              )}
            </div>

            {/* Footer Institutional Note */}
            <div className="hidden lg:block relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-400 leading-relaxed">
              Hệ thống quản lý KTX, điểm danh thông minh và sổ thi đua KPI theo chuẩn Bộ GD&ĐT.
            </div>
          </div>

          {/* Right Panel: Clean Professional Login Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Form Header */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Đăng nhập tài khoản
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Đăng nhập vào không gian <strong>{schoolSettings.school_name || 'Nhà trường'}</strong>
                </p>
              </div>

              {/* Status Alerts */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#d32027]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c] transition-all"
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c] transition-all"
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isSettingsLoading}
                  className="w-full h-11 flex justify-center items-center gap-2 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-[#0e3a7c] hover:bg-[#0a2754] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0e3a7c] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Testing Access (Sleek Drawer Accordion) */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              {isHungVuong ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowQuickRoles(!showQuickRoles)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0e3a7c]" />
                      <span>Tài khoản kiểm thử nhanh (Demo)</span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showQuickRoles ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {showQuickRoles && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2.5 animate-in fade-in duration-150">
                      {chvQuickRoles.map((qr) => (
                        <button
                          key={qr.user}
                          type="button"
                          onClick={() => handleQuickLogin(qr.user, qr.pass)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 text-left transition-all cursor-pointer"
                        >
                          <div className="text-[11px] font-bold text-slate-800 truncate">
                            {qr.label}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {qr.user}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-slate-800">Tài khoản Quản trị trường</div>
                    <div className="text-[11px] text-slate-500">Tài khoản: admin</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const pass =
                        currentSchoolCode === 'phuninh'
                          ? 'phuninh@123456'
                          : currentSchoolCode === 'viettri'
                            ? 'viettri123456'
                            : password;
                      handleQuickLogin('admin', pass);
                    }}
                    className="px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Đăng nhập 1 chạm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="w-full text-center py-3 text-slate-500 text-xs">
        © 2026 {schoolSettings.school_name || 'Hệ thống Quản lý KTX & KPI Học đường'}. Bảo mật dữ liệu đa trường học.
      </footer>

      {/* ==================== MODAL KHỞI TẠO TRƯỜNG MỚI ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-linear-to-r from-[#0c2340] to-[#154b9d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">Khởi tạo Không gian Trường học mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchoolSubmit} className="p-6 space-y-4 text-slate-800">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ tự động thiết lập một <strong>Cơ sở dữ liệu độc lập (Database riêng biệt)</strong> cho trường mới trong 1 giây. Dữ liệu của trường mới hoàn toàn trắng tinh và cô lập tuyệt đối.
                </span>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Tên trường học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Trường THPT Lâm Thao"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Mã định danh (slug) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchoolCode}
                    onChange={(e) => setNewSchoolCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="VD: lamthao"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c]"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Viết liền không dấu</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={newSchoolProvince}
                    onChange={(e) => setNewSchoolProvince(e.target.value)}
                    placeholder="VD: Phú Thọ"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Mật khẩu Admin trường <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự (VD: lamthao@2026)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0e3a7c] focus:border-[#0e3a7c]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Tên tài khoản quản trị mặc định: <strong>admin</strong>
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingSchool}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creatingSchool}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#0e3a7c] hover:bg-[#0a2754] rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingSchool ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tạo cơ sở dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Khởi tạo trường ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
