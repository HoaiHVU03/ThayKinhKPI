// frontend/src/components/Layout.tsx

import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  CalendarCheck2,
  Clock,
  Award,
  FileText,
  TableProperties,
  Printer,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { useSchoolSettings } from '../context/SchoolSettingsContext';
import { SchoolLogo } from './SchoolLogo';
import { LeaveTickerBanner } from './LeaveTickerBanner';

const roleLabels: Record<string, { label: string; color: string }> = {
  admin: { label: 'BGH / Quản trị viên', color: 'bg-red-100 text-red-800 border-red-200' },
  dorm_manager: { label: 'Quản sinh KTX', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  floor_leader: { label: 'Trưởng tầng KTX', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  room_leader: { label: 'Trưởng phòng KTX', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  youth_union: { label: 'Đoàn Thanh niên', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  homeroom_teacher: { label: 'Giáo viên chủ nhiệm', color: 'bg-sky-100 text-sky-800 border-sky-200' },
};

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings: schoolSettings, currentSchoolCode } = useSchoolSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    const primaryScope = user.scopes && user.scopes.length > 0 ? user.scopes[0] : null;
    const scopeName = primaryScope?.scope_name || '';

    switch (user.role) {
      case 'admin':
        return [
          { to: '/dashboard', label: 'Dashboard toàn trường', icon: LayoutDashboard },
          { to: '/students', label: 'Hồ sơ học sinh', icon: Users },
          { to: '/classes', label: 'Danh sách lớp học', icon: GraduationCap },
          { to: '/class-attendance', label: 'Điểm danh lớp đầu giờ', icon: CalendarCheck2 },
          { to: '/dormitory', label: 'Sơ đồ phòng KTX', icon: Building2 },
          { to: '/attendance', label: 'Điểm danh KTX', icon: CalendarCheck2 },
          { to: '/regimes', label: '11 chế độ sinh hoạt', icon: Clock },
          { to: '/kpi', label: 'KPI & sổ kỷ luật', icon: Award },
          { to: '/leaves', label: 'Đơn xin phép KTX', icon: FileText },
          { to: '/reports', label: 'Báo cáo & ma trận lỗi', icon: TableProperties },
          { to: '/official-document', label: 'Mẫu in A4 (NĐ 30/2020)', icon: Printer },
          { to: '/academic-year', label: 'Chuyển niên khóa', icon: CalendarDays },
          { to: '/admin', label: 'Quản trị & cấu hình', icon: Settings },
        ];

      case 'dorm_manager':
        return [
          { to: '/dashboard', label: 'Dashboard quản sinh KTX', icon: LayoutDashboard },
          { to: '/class-attendance', label: 'Điểm danh lớp đầu giờ', icon: CalendarCheck2 },
          { to: '/dormitory', label: 'Sơ đồ KTX (120 phòng)', icon: Building2 },
          { to: '/attendance', label: 'Điểm danh KTX & báo cáo', icon: CalendarCheck2 },
          { to: '/regimes', label: '11 chế độ sinh hoạt', icon: Clock },
          { to: '/students', label: 'Học sinh nội trú', icon: Users },
          { to: '/leaves', label: 'Duyệt đơn xin phép KTX', icon: FileText },
          { to: '/kpi', label: 'KPI & vi phạm KTX', icon: Award },
          { to: '/official-document', label: 'Mẫu in A4 KTX', icon: Printer },
        ];

      case 'floor_leader':
        return [
          { to: '/dashboard', label: 'Dashboard tầng phụ trách', icon: LayoutDashboard },
          { to: '/dormitory', label: scopeName ? `Sơ đồ ${scopeName}` : 'Sơ đồ tầng KTX', icon: Building2 },
          { to: '/attendance', label: 'Điểm danh tầng KTX', icon: CalendarCheck2 },
          { to: '/regimes', label: '11 chế độ sinh hoạt', icon: Clock },
          { to: '/leaves', label: 'Đơn xin phép tầng', icon: FileText },
          { to: '/kpi', label: 'Biên bản & kỷ luật', icon: Award },
        ];

      case 'room_leader':
        return [
          { to: '/dashboard', label: 'Dashboard phòng', icon: LayoutDashboard },
          { to: '/dormitory', label: scopeName ? `Phòng ${scopeName}` : 'Phòng KTX của tôi', icon: Building2 },
          { to: '/attendance', label: 'Điểm danh phòng (22h00)', icon: CalendarCheck2 },
          { to: '/regimes', label: '11 chế độ sinh hoạt', icon: Clock },
          { to: '/leaves', label: 'Đơn xin phép phòng', icon: FileText },
          { to: '/kpi', label: 'Biên bản & KPI phòng', icon: Award },
        ];

      case 'homeroom_teacher':
        return [
          { to: '/dashboard', label: 'Dashboard lớp chủ nhiệm', icon: LayoutDashboard },
          { to: '/class-attendance', label: 'Điểm danh lớp đầu giờ', icon: CalendarCheck2 },
          { to: '/classes', label: scopeName ? `Lớp ${scopeName}` : 'Lớp chủ nhiệm', icon: GraduationCap },
          { to: '/students', label: 'Học sinh lớp chủ nhiệm', icon: Users },
          { to: '/kpi', label: 'KPI & sổ kỷ luật', icon: Award },
          { to: '/leaves', label: 'Duyệt đơn phép lớp', icon: FileText },
          { to: '/official-document', label: 'Mẫu in A4 lớp chủ nhiệm', icon: Printer },
        ];

      case 'youth_union':
        return [
          { to: '/dashboard', label: 'Dashboard đoàn trường', icon: LayoutDashboard },
          { to: '/class-attendance', label: 'Điểm danh lớp đầu giờ', icon: CalendarCheck2 },
          { to: '/kpi', label: 'Sổ vi phạm & kỷ luật', icon: Award },
          { to: '/reports', label: 'Ma trận lỗi & xếp hạng', icon: TableProperties },
          { to: '/official-document', label: 'Mẫu in báo cáo A4', icon: Printer },
          { to: '/students', label: 'Tra cứu học sinh', icon: Users },
        ];

      default:
        return [
          { to: '/dashboard', label: 'Dashboard tổng quan', icon: LayoutDashboard },
        ];
    }
  };

  const navItems = getNavItems();
  const primaryScope = user?.scopes && user.scopes.length > 0 ? user.scopes[0] : null;
  const scopeBadgeText = primaryScope?.scope_name 
    ? primaryScope.scope_name 
    : (user?.role === 'admin' ? 'Toàn quyền Ban Giám Hiệu' : '');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
          {/* Left Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none touch-action-manipulation shrink-0"
              aria-label="Mở menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={() => navigate('/dashboard')}>
              <SchoolLogo
                schoolCode={currentSchoolCode}
                schoolName={schoolSettings.school_name}
                logoUrl={schoolSettings.school_logo}
                size="sm"
                className="shrink-0 drop-shadow-xs"
              />
              <div className="text-left leading-tight min-w-0">
                <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-[#0e3a7c] uppercase truncate max-w-[140px] sm:max-w-none">
                  {schoolSettings.school_name || 'THPT Chuyên Hùng Vương'}
                </h1>
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 truncate hidden xs:block">
                  Quản lý KTX & KPI rèn luyện nề nếp
                </p>
              </div>
            </div>
          </div>

          {/* Center Realtime Running Leave Ticker Bar (Khu vực trung tâm khoanh đỏ) */}
          <LeaveTickerBanner />

          {/* Right User & Status */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Parallel World / School Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/90 hover:bg-blue-100 text-[#0e3a7c] text-xs font-bold rounded-lg border border-blue-200 cursor-pointer transition-colors shadow-2xs"
              title="Không gian trường học độc lập (Thế giới song song) — Nhấn để chọn trường khác"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span className="hidden sm:inline text-slate-500 font-medium">Trường:</span>
              <span className="text-[#0e3a7c] font-black max-w-[140px] truncate">
                {schoolSettings.school_name?.replace('Trường THPT ', '') || 'Chuyên Hùng Vương'}
              </span>
            </div>

            {/* Realtime Clock Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-[#0e3a7c]" />
              <span>{currentTime} (GMT+7)</span>
            </div>

            {/* User Profile Capsule */}
            {user && (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                {(user as any).avatar_url ? (
                  <img
                    src={(user as any).avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full ${user.role === 'admin' ? 'bg-red-700' : 'bg-[#0e3a7c]'} text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs`}>
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                    <span>{user.full_name}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                    <span className={`inline-block px-1.5 py-0.2 rounded border text-[10px] font-semibold ${roleLabels[user.role]?.color || 'bg-slate-100 text-slate-700'}`}>
                      {roleLabels[user.role]?.label || user.role}
                    </span>
                    {scopeBadgeText && (
                      <span className="inline-block px-1.5 py-0.2 rounded border text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
                        • {scopeBadgeText}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-1.5 ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* School Badge Header in Mobile Drawer */}
          <div className="p-4 border-b border-slate-100 lg:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={schoolSettings.school_logo || '/logo.png'} className="w-7 h-7 object-contain" alt="Logo" />
              <span className="font-bold text-xs text-[#0e3a7c] uppercase truncate max-w-[170px]">
                {schoolSettings.school_name || 'THPT CHUYÊN HÙNG VƯƠNG'}
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Chức năng ({navItems.length})</span>
              {user?.role === 'admin' && (
                <span className="text-[10px] text-amber-600 font-extrabold">Full Menu</span>
              )}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#0e3a7c] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="px-2.5 py-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-semibold">
                <span>Phân quyền:</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${user?.role === 'admin' ? 'bg-red-600 text-white' : 'bg-[#0e3a7c] text-white'}`}>
                  {user?.role === 'admin' ? 'BGH / Quản trị tối cao' : (roleLabels[user?.role || '']?.label || user?.role)}
                </span>
              </div>
              {scopeBadgeText && (
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span>Phạm vi:</span>
                  <span className="text-emerald-700 font-bold truncate max-w-[130px]">{scopeBadgeText}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Niên khóa:</span>
                <span className="text-[#0e3a7c] font-semibold">{schoolSettings.academic_year_current || '2026 - 2027'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-5 lg:p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
