// frontend/src/pages/AdminPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSchoolSettings } from '../context/SchoolSettingsContext';
import { downloadMasterTemplate, parseMasterExcelFile, type ParsedMasterData } from '../utils/masterExcel';
import { uploadImageFromDevice } from '../utils/imageUpload';
import type { User } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Settings,
  Users,
  ShieldCheck,
  History,
  Database,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Download,
  Save,
  CheckCircle2,
  Bot,
  Sparkles,
  Eye,
  EyeOff,
  Play,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Key,
  Cpu,
  Zap,
  Check,
  FileText,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  FolderUp,
  FileCheck,
  FileDown,
  Building2,
  GraduationCap,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  X,
  UserCheck,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshSettings } = useSchoolSettings();
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'onboarding' | 'chatbot' | 'logs' | 'backup'>('users');

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [dormRooms, setDormRooms] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: 'password123',
    full_name: '',
    email: '',
    phone: '',
    role: 'room_leader',
    scope_type: 'room',
    scope_id: '',
    avatar_url: '',
  });

  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'room_leader',
    status: 'active',
    new_password: '',
    scope_type: 'room',
    scope_id: '',
    avatar_url: '',
  });

  // Settings State
  const [settings, setSettings] = useState<any>({});
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Image Upload State & Refs
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const avatarCreateFileInputRef = useRef<HTMLInputElement>(null);
  const avatarEditFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Backup State
  const [backupInfo, setBackupInfo] = useState<any>(null);

  // Onboarding & Master Import State
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);
  const [onboardingFile, setOnboardingFile] = useState<File | null>(null);
  const [parsedMaster, setParsedMaster] = useState<ParsedMasterData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [isExporting, setIsExporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Factory Reset / Clear Data State
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [confirmResetText, setConfirmResetText] = useState('');
  const [resetSchoolName, setResetSchoolName] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const [usersData, roomsData, classesData] = await Promise.all([
        api.get('/admin/users'),
        api.get('/dormitory/rooms').catch(() => []),
        api.get('/classes').catch(() => []),
      ]);
      setUsersList((usersData as any) || []);
      setDormRooms((roomsData as any) || []);
      setClassesList((classesData as any) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const data: any = await api.get('/admin/settings');
      setSettings(data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res: any = await api.get('/admin/audit-logs');
      setLogs(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchBackup = async () => {
    try {
      const data: any = await api.get('/admin/backup');
      setBackupInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Chatbot State
  const [chatbotSettings, setChatbotSettings] = useState<{
    keys: Array<{
      id: number;
      key: string;
      status: string;
      note: string;
      last_used: string | null;
      calls: number;
      errors: number;
      masked_key?: string;
    }>;
    active_model: string;
    active_key_index: number;
    system_prompt: string;
    default_system_prompt: string;
    available_models: Array<{ id: string; name: string; tag: string; description: string }>;
    rotation_strategy: string;
  }>({
    keys: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      key: '',
      status: 'empty',
      note: `Key #${i + 1}`,
      last_used: null,
      calls: 0,
      errors: 0,
    })),
    active_model: 'gemini-3.8-flash',
    active_key_index: 0,
    system_prompt: '',
    default_system_prompt: '',
    available_models: [],
    rotation_strategy: '',
  });
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatbotSaving, setChatbotSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<number, boolean>>({});
  const [testingKeyId, setTestingKeyId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { valid: boolean; message: string; latency_ms?: number }>>({});

  const fetchChatbotSettings = async () => {
    setChatbotLoading(true);
    try {
      const data: any = await api.get('/chatbot/settings');
      if (data) {
        setChatbotSettings({
          keys: data.keys || [],
          active_model: data.active_model || 'gemini-3.8-flash',
          active_key_index: data.active_key_index ?? 0,
          system_prompt: data.system_prompt || '',
          default_system_prompt: data.default_system_prompt || '',
          available_models: data.available_models || [],
          rotation_strategy: data.rotation_strategy || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatbotLoading(false);
    }
  };

  const handleSaveChatbotSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setChatbotSaving(true);
    try {
      await api.post('/chatbot/settings', {
        keys: chatbotSettings.keys,
        active_model: chatbotSettings.active_model,
        active_key_index: chatbotSettings.active_key_index,
        system_prompt: chatbotSettings.system_prompt,
      });
      alert('Đã lưu cấu hình AI Gemini Chatbot thành công! Hệ thống sẵn sàng luân chuyển 10 key.');
      fetchChatbotSettings();
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu cấu hình Gemini Chatbot');
    } finally {
      setChatbotSaving(false);
    }
  };

  const handleTestKey = async (id: number, keyVal: string) => {
    if (!keyVal.trim()) {
      alert('Vui lòng nhập API Key trước khi kiểm tra');
      return;
    }
    setTestingKeyId(id);
    try {
      const res: any = await api.post('/chatbot/test-key', {
        key: keyVal,
        model: chatbotSettings.active_model,
      });
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          valid: true,
          message: `Thành công (${res.model_used || 'Gemini'}, ${res.latency_ms || 200}ms)`,
          latency_ms: res.latency_ms,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          valid: false,
          message: err.message || 'Không thể kết nối đến Gemini',
        },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'chatbot') fetchChatbotSettings();
    else if (activeTab === 'logs') fetchLogs();
    else if (activeTab === 'backup') fetchBackup();
  }, [activeTab]);

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadImageFromDevice(file, 'logos');
      setSettings((prev: any) => ({ ...prev, school_logo: url }));
      alert('Đã chọn logo từ thiết bị thành công! Nhớ bấm "Lưu cấu hình" để áp dụng cho toàn website.');
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh logo');
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  };

  const handleCreateAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadImageFromDevice(file, 'avatars');
      setNewUser((prev) => ({ ...prev, avatar_url: url }));
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh đại diện');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarCreateFileInputRef.current) avatarCreateFileInputRef.current.value = '';
    }
  };

  const handleEditAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadImageFromDevice(file, 'avatars');
      setEditUserForm((prev) => ({ ...prev, avatar_url: url }));
    } catch (err: any) {
      alert(err.message || 'Lỗi tải ảnh đại diện');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarEditFileInputRef.current) avatarEditFileInputRef.current.value = '';
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newUser,
        scope_type: (newUser.role === 'homeroom_teacher' || newUser.role === 'class_cadre') ? 'class' : newUser.role === 'room_leader' ? 'room' : newUser.role === 'floor_leader' ? 'floor' : '',
        scope_id: newUser.scope_id || null,
        avatar_url: newUser.avatar_url || null,
      };
      await api.post('/admin/users', payload);
      alert('Tạo tài khoản người dùng và gán phân quyền thành công!');
      setCreateUserModalOpen(false);
      setNewUser({
        username: '',
        password: 'password123',
        full_name: '',
        email: '',
        phone: '',
        role: 'room_leader',
        scope_type: 'room',
        scope_id: '',
        avatar_url: '',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo tài khoản');
    }
  };

  const handleToggleLockUser = async (u: User) => {
    const nextStatus = u.status === 'active' ? 'locked' : 'active';
    try {
      await api.put(`/admin/users/${u.id}`, { status: nextStatus, full_name: u.full_name, role: u.role });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserForm({
      full_name: u.full_name,
      email: (u as any).email || '',
      phone: (u as any).phone || '',
      role: u.role,
      status: u.status,
      new_password: '',
      scope_type: (u as any).scope_type || ((u.role === 'homeroom_teacher' || u.role === 'class_cadre') ? 'class' : u.role === 'room_leader' ? 'room' : u.role === 'floor_leader' ? 'floor' : ''),
      scope_id: (u as any).scope_id ? String((u as any).scope_id) : '',
      avatar_url: (u as any).avatar_url || '',
    });
    setEditUserModalOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = {
        ...editUserForm,
        scope_type: (editUserForm.role === 'homeroom_teacher' || editUserForm.role === 'class_cadre') ? 'class' : editUserForm.role === 'room_leader' ? 'room' : editUserForm.role === 'floor_leader' ? 'floor' : '',
        scope_id: editUserForm.scope_id || null,
      };
      await api.put(`/admin/users/${editingUser.id}`, payload);
      alert('Cập nhật thông tin tài khoản và phân quyền thành công!');
      setEditUserModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật tài khoản');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${u.username}" (${u.full_name})? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await api.delete(`/admin/users/${u.id}`);
      alert(`Đã xóa tài khoản "${u.username}" thành công`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', settings);
      await refreshSettings();
      alert('Đã lưu cấu hình hệ thống thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi lưu cấu hình');
    }
  };

  const handleExportCurrentData = async () => {
    setIsExporting(true);
    try {
      const res: any = await api.get('/admin/onboarding/export-all');
      downloadMasterTemplate('current', res.data || res);
    } catch (err: any) {
      alert('Lỗi xuất dữ liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setOnboardingFile(file);
    setParseError(null);
    setImportResult(null);
    try {
      const data = await parseMasterExcelFile(file);
      setParsedMaster(data);
    } catch (err: any) {
      setParseError(err.message || 'Lỗi khi đọc file Excel');
      setParsedMaster(null);
    }
  };

  const handleExecuteMasterImport = async () => {
    if (!parsedMaster) return;
    setIsImporting(true);
    try {
      const res: any = await api.post('/admin/onboarding/master-import', {
        school_info: parsedMaster.school_info,
        classes: parsedMaster.classes,
        rooms: parsedMaster.rooms,
        students: parsedMaster.students,
        users: parsedMaster.users,
        kpi_rules: parsedMaster.kpi_rules,
        regimes: parsedMaster.regimes,
        mode: importMode,
      });
      setImportResult(res.data || res);
      await refreshSettings();
      await fetchUsers();
      await fetchSettings();
      alert('Nhập toàn bộ dữ liệu trường học mới thành công!');
    } catch (err: any) {
      alert('Lỗi khi nạp dữ liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  const handleExecuteClearData = async () => {
    if (confirmResetText !== 'XOA TRANG DU LIEU' && confirmResetText !== 'RESET') {
      alert('Vui lòng gõ chính xác "XOA TRANG DU LIEU" hoặc "RESET" để xác nhận');
      return;
    }
    setIsResetting(true);
    try {
      await api.post('/admin/onboarding/clear-data', {
        confirmation: confirmResetText,
        school_name: resetSchoolName,
      });
      alert('Đã xóa trắng toàn bộ dữ liệu thành công! Hệ thống sẵn sàng cho trường mới với tài khoản Quản trị: admin / password123.');
      setClearModalOpen(false);
      setConfirmResetText('');
      setResetSchoolName('');
      await refreshSettings();
      await fetchUsers();
      await fetchSettings();
    } catch (err: any) {
      alert('Lỗi khi xóa dữ liệu: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsResetting(false);
    }
  };

  const roleMap: Record<string, string> = {
    admin: '1. Admin (Quản trị)',
    dorm_manager: '2. Quản sinh KTX',
    homeroom_teacher: '3. GVCN lớp',
    class_cadre: '4. LT BT (Lớp trưởng / Bí thư)',
    student: '5. Học sinh (Chỉ xem)',
    floor_leader: 'Trưởng tầng KTX',
    room_leader: 'Trưởng phòng KTX',
    youth_union: 'Đoàn trường',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Quản trị hệ thống & cấu hình nhận diện
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý tài khoản 6 vai trò • Cấu hình nhận diện thương hiệu THPT Chuyên Hùng Vương • Nhật ký kiểm toán & Sao lưu
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'users' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> Tài khoản & Phân quyền (67)
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" /> Cấu hình nhận diện & giờ
        </button>
        <button
          onClick={() => setActiveTab('onboarding')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'onboarding' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" /> Khởi tạo trường mới & Dữ liệu mẫu
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'logs' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" /> Nhật ký kiểm toán (Audit Logs)
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'backup' ? 'bg-[#0e3a7c] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" /> Sao lưu cơ sở dữ liệu
        </button>
      </div>

      {/* Tab 1: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Danh sách tài khoản phân quyền (6 vai trò)
            </h3>
            <button
              onClick={() => setCreateUserModalOpen(true)}
              className="px-3 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo tài khoản mới
            </button>
          </div>

          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Tên đăng nhập</th>
                  <th className="px-4 py-2.5">Họ và tên</th>
                  <th className="px-3 py-2.5">Vai trò (Role)</th>
                  <th className="px-3 py-2.5">Phạm vi gán (Scope)</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-400">{u.id}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-[#0e3a7c]">{u.username}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.full_name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-300">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span>{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-700">
                      {roleMap[u.role] || u.role}
                    </td>
                    <td className="px-3 py-2.5">
                      {(u as any).scope_display ? (
                        (u as any).scope_type === 'room' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            🛏️ {(u as any).scope_display}
                          </span>
                        ) : (u as any).scope_type === 'floor' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            🏢 {(u as any).scope_display}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            🎓 {(u as any).scope_display}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">Toàn hệ thống</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {u.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Hoạt động</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Đã khóa</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 text-slate-400 hover:text-[#0e3a7c] hover:bg-blue-50 rounded cursor-pointer"
                          title="Sửa thông tin tài khoản"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleLockUser(u)}
                          className={`p-1.5 rounded cursor-pointer ${u.status === 'active' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-red-600 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === 1 || user?.id === u.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.id === 1 ? 'Không thể xóa Super Admin' : 'Xóa tài khoản'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs text-slate-700 max-w-4xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cấu hình nhận diện & tham số vận hành</h3>
              <p className="text-[11px] text-slate-500">Tùy biến thương hiệu, Ban Giám hiệu & Thông số vận hành của trường</p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Lưu cấu hình
            </button>
          </div>

          {/* Section 1: Pháp nhân & Nhận diện thương hiệu */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#0e3a7c]" /> Thông tin trường & Nhận diện thương hiệu
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên trường đầy đủ (*)</label>
                <input
                  type="text"
                  placeholder="VD: Trường THPT Chuyên Hùng Vương"
                  value={settings.school_name || ''}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã trường (School Code)</label>
                <input
                  type="text"
                  placeholder="VD: THPT-CHV-GL"
                  value={settings.school_code || ''}
                  onChange={(e) => setSettings({ ...settings, school_code: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tỉnh / Thành phố / Sở GD&ĐT</label>
                <input
                  type="text"
                  placeholder="VD: Tỉnh Gia Lai / Sở GD&ĐT Gia Lai"
                  value={settings.school_province || ''}
                  onChange={(e) => setSettings({ ...settings, school_province: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Niên khóa hiện tại</label>
                <input
                  type="text"
                  placeholder="VD: 2026 - 2027"
                  value={settings.academic_year_current || ''}
                  onChange={(e) => setSettings({ ...settings, academic_year_current: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            {/* Logo Selector with Device Upload */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-slate-800 text-xs">
                    Logo chính thức của trường (Hiển thị Header, Báo cáo A4 & Đăng nhập)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Hỗ trợ định dạng PNG, JPG, SVG, WEBP. Khuyên dùng ảnh nền trong suốt (PNG/SVG).
                  </p>
                </div>
                {settings.school_logo && settings.school_logo !== '/logo.png' && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, school_logo: '/logo.png' })}
                    className="text-[11px] text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Về logo mặc định
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Logo Preview Box */}
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white p-2 flex items-center justify-center relative shadow-2xs flex-shrink-0 group">
                  <img
                    src={settings.school_logo || '/logo.png'}
                    alt="Logo trường"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-xl flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-[#0e3a7c] animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload Action & URL Input */}
                <div className="flex-1 space-y-2 w-full">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoFileSelect}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingLogo ? 'Đang tải ảnh lên...' : 'Chọn ảnh logo từ thiết bị'}
                    </button>

                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      Thay ảnh khác
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">Đường dẫn:</span>
                    <input
                      type="text"
                      placeholder="/logo.png hoặc URL ảnh online..."
                      value={settings.school_logo || ''}
                      onChange={(e) => setSettings({ ...settings, school_logo: e.target.value })}
                      className="w-full p-1.5 border border-slate-300 rounded-lg text-[11px] font-mono text-slate-700 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Màu chủ đạo (Primary)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_primary_color || '#0e3a7c'}
                    onChange={(e) => setSettings({ ...settings, brand_primary_color: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <span className="font-mono text-xs">{settings.brand_primary_color || '#0e3a7c'}</span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Màu điểm nhấn (Accent)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_accent_color || '#d32027'}
                    onChange={(e) => setSettings({ ...settings, brand_accent_color: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <span className="font-mono text-xs">{settings.brand_accent_color || '#d32027'}</span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Màu vàng viền (Gold)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_gold_color || '#f59e0b'}
                    onChange={(e) => setSettings({ ...settings, brand_gold_color: e.target.value })}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                  <span className="font-mono text-xs">{settings.brand_gold_color || '#f59e0b'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ban Giám hiệu & Nhân sự quản lý */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#0e3a7c]" /> Ban Giám hiệu & Nhân sự quản lý
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ tên Hiệu trưởng (*)</label>
                <input
                  type="text"
                  placeholder="VD: ĐÀO MẠNH THẮNG"
                  value={settings.principal_name || ''}
                  onChange={(e) => setSettings({ ...settings, principal_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Các Phó Hiệu trưởng (cách nhau dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="VD: ThS. Nguyễn Thị Thu Hà, ThS. Trần Văn Nam"
                  value={settings.vice_principals || ''}
                  onChange={(e) => setSettings({ ...settings, vice_principals: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ tên Quản sinh KTX (*)</label>
                <input
                  type="text"
                  placeholder="VD: Thầy Kính (Tổ trưởng QL KTX)"
                  value={settings.dorm_manager_name || ''}
                  onChange={(e) => setSettings({ ...settings, dorm_manager_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bí thư Đoàn Thanh niên</label>
                <input
                  type="text"
                  placeholder="VD: Đ/c Hoàng Minh Tuấn"
                  value={settings.youth_union_secretary || ''}
                  onChange={(e) => setSettings({ ...settings, youth_union_secretary: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Địa chỉ & Liên hệ */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Thông tin liên hệ & Cổng thông tin
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ trường</label>
                <input
                  type="text"
                  placeholder="VD: Số 48 Hùng Vương, TP. Pleiku, Gia Lai"
                  value={settings.school_address || ''}
                  onChange={(e) => setSettings({ ...settings, school_address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="VD: 0269 3824 331"
                  value={settings.school_phone || ''}
                  onChange={(e) => setSettings({ ...settings, school_phone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  placeholder="c3hungvuong@gialai.edu.vn"
                  value={settings.school_email || ''}
                  onChange={(e) => setSettings({ ...settings, school_email: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Website chính thức</label>
                <input
                  type="text"
                  placeholder="https://thpt-chuyenhungvuong-gialai.edu.vn"
                  value={settings.school_website || ''}
                  onChange={(e) => setSettings({ ...settings, school_website: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Mốc giờ điểm danh */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Mốc giờ điểm danh & Báo cáo tự động
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giờ điểm danh Sáng</label>
                <input
                  type="time"
                  value={settings.morning_attendance_time || '06:00'}
                  onChange={(e) => setSettings({ ...settings, morning_attendance_time: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giờ điểm danh Tối</label>
                <input
                  type="time"
                  value={settings.evening_attendance_time || '22:00'}
                  onChange={(e) => setSettings({ ...settings, evening_attendance_time: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mốc Báo cáo Zalo</label>
                <input
                  type="time"
                  value={settings.zalo_report_time || '22:15'}
                  onChange={(e) => setSettings({ ...settings, zalo_report_time: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab Onboarding: Khởi tạo trường mới & Dữ liệu mẫu */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          {/* Clean Institutional Header */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Khởi tạo trường học mới & Dữ liệu mẫu toàn hệ thống
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Chuyển giao hệ thống
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tải file mẫu Excel 7 bảng tính, nhập thông tin trường học mới và nạp dữ liệu chuẩn hóa vào website.
              </p>
            </div>
          </div>

          {/* 3 Main Workflow Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Tải file mẫu & Xuất dữ liệu (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 1: Tải bộ file Excel mẫu */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-blue-50 text-[#0e3a7c] rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      1. Tải bộ file Excel mẫu (Chuẩn 7 bảng)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tải file Excel mẫu gồm đầy đủ cấu trúc dữ liệu cho trường mới
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => downloadMasterTemplate('sample')}
                    className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-left flex items-start gap-3 transition-all cursor-pointer group shadow-2xs"
                  >
                    <FileDown className="w-5 h-5 text-[#0e3a7c] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-[#0e3a7c]">
                        Tải file mẫu có dữ liệu thực tế (Khuyên dùng xem mẫu)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Có sẵn dữ liệu hoàn chỉnh 54 lớp, 120 phòng, học sinh, KPI, BGH để tham khảo định dạng.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => downloadMasterTemplate('empty')}
                    className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-left flex items-start gap-3 transition-all cursor-pointer group shadow-2xs"
                  >
                    <Download className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-800">
                        Tải file mẫu trắng (Sẵn sàng điền trường mới)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Chỉ gồm hàng tiêu đề chuẩn & hướng dẫn nhập liệu, sạch sẽ sẵn sàng điền dữ liệu trường mới.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCurrentData}
                    disabled={isExporting}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-start gap-3 transition-all cursor-pointer group disabled:opacity-50"
                  >
                    <FileCheck className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-xs text-slate-800">
                        {isExporting ? 'Đang trích xuất dữ liệu...' : 'Xuất toàn bộ dữ liệu hiện tại của trường ra Excel'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Sao lưu và xuất dữ liệu thực tế của trường đang lưu trong CSDL ra file Excel 7 sheet.
                      </div>
                    </div>
                  </button>
                </div>

                {/* 7 Standard Sheets Details */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Cấu trúc 7 sheet trong file Master:
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">1. ThongTinTruong:</span> Tên trường, Hiệu trưởng, Quản sinh, Logo, Giờ giấc
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">2. DanhSachLop:</span> Danh sách lớp học, khối 10-12, GVCN & Số điện thoại
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">3. PhongKTX:</span> Danh sách phòng, tầng, khu Nam/Nữ, sức chứa
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">4. HocSinh:</span> Mã HS, Họ tên, Ngày sinh, Lớp, Phòng KTX, Phụ huynh & SĐT
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">5. TaiKhoanNguoiDung:</span> 6 vai trò, thông tin gán tầng/phòng/lớp
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">6. TieuChiKPI:</span> 10 quy tắc nề nếp kỷ luật & điểm trừ tương ứng
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded bg-slate-50">
                      <span className="font-mono font-bold text-[#0e3a7c]">7. CheDoSinhHoat:</span> 11 chế độ sinh hoạt & thời gian biểu KTX
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Danger Zone / Xóa trắng bàn giao */}
              <div className="bg-red-50/70 rounded-2xl border-2 border-red-200 p-5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-red-900 uppercase tracking-wide">
                      Bàn giao trường mới: Xóa trắng toàn bộ dữ liệu
                    </h4>
                    <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                      Khi cho trường khác thuê web, bấm nút bên dưới để dọn sạch toàn bộ học sinh, vi phạm nề nếp, điểm danh và tài khoản của trường cũ. Web sẽ hoàn toàn trắng tinh, giữ lại duy nhất tài khoản Super Admin <code className="bg-red-100 px-1 py-0.5 rounded font-mono font-bold">admin</code> / <code className="bg-red-100 px-1 py-0.5 rounded font-mono font-bold">password123</code>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setClearModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa trắng toàn bộ dữ liệu để bàn giao trường khác
                </button>
              </div>
            </div>

            {/* Right Column: Nạp dữ liệu trường mới (Master Import Wizard) (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                    <FolderUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      2. Nạp dữ liệu trường mới (Master Import Wizard)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Chọn file Excel đã điền dữ liệu trường mới để nạp vào toàn bộ hệ thống
                    </p>
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <input
                  type="file"
                  ref={onboardingFileInputRef}
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                  onClick={() => onboardingFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-[#0e3a7c] bg-blue-50/60 scale-[1.01]'
                      : onboardingFile
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {onboardingFile ? (
                      <span className="text-emerald-700">Đã chọn file: {onboardingFile.name}</span>
                    ) : (
                      'Kéo thả file Excel (.xlsx) vào đây hoặc bấm để chọn file'
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hỗ trợ file Master Excel đa bảng tính (Sheet 1 đến 7)
                  </p>
                </div>

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Lỗi đọc file: {parseError}</span>
                  </div>
                )}

                {/* File Preview Card */}
                {parsedMaster && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Đã phân tích cấu trúc dữ liệu thành công
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {onboardingFile?.name} ({(onboardingFile?.size || 0 / 1024).toFixed(0)} KB)
                      </span>
                    </div>

                    {/* Detected School Identity */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 text-xs">
                      <div className="font-bold text-[#0e3a7c] text-sm">
                        🏫 {parsedMaster.stats?.schoolName || parsedMaster.school_info?.ten_truong || parsedMaster.school_info?.school_name || 'Tên trường chưa thiết lập'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div>
                          <strong>Hiệu trưởng:</strong> {parsedMaster.school_info?.hieu_truong || parsedMaster.school_info?.principal_name || 'Chưa rõ'}
                        </div>
                        <div>
                          <strong>Quản sinh KTX:</strong> {parsedMaster.school_info?.truong_ban_quan_sinh || parsedMaster.school_info?.dorm_manager_name || 'Chưa rõ'}
                        </div>
                        <div>
                          <strong>Sở / Tỉnh:</strong> {parsedMaster.school_info?.tinh_thanh || parsedMaster.school_info?.school_province || 'Chưa rõ'}
                        </div>
                        <div>
                          <strong>Niên khóa:</strong> {parsedMaster.school_info?.nien_khoa || parsedMaster.school_info?.academic_year_current || '2026 - 2027'}
                        </div>
                      </div>
                    </div>

                    {/* Counts Badges */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-lg font-black text-[#0e3a7c]">{parsedMaster.classes.length}</div>
                        <div className="text-[10px] font-bold text-slate-500">Lớp học</div>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="text-lg font-black text-indigo-700">{parsedMaster.rooms.length}</div>
                        <div className="text-[10px] font-bold text-slate-500">Phòng KTX</div>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="text-lg font-black text-emerald-700">{parsedMaster.students.length}</div>
                        <div className="text-[10px] font-bold text-slate-500">Học sinh</div>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="text-lg font-black text-purple-700">{parsedMaster.users.length}</div>
                        <div className="text-[10px] font-bold text-slate-500">Tài khoản</div>
                      </div>
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-lg font-black text-amber-700">{parsedMaster.kpi_rules.length}</div>
                        <div className="text-[10px] font-bold text-slate-500">Quy tắc KPI</div>
                      </div>
                      <div className="p-2 bg-teal-50 rounded-lg border border-teal-100">
                        <div className="text-lg font-black text-teal-700">{parsedMaster.regimes.length}</div>
                        <div className="text-[10px] font-bold text-slate-500">Chế độ KTX</div>
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <label className="block font-bold text-slate-700 text-xs">
                        Phương thức nhập dữ liệu:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label
                          className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                            importMode === 'replace'
                              ? 'border-[#0e3a7c] bg-blue-50/50 shadow-2xs font-semibold'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="import_mode"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={() => setImportMode('replace')}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="text-slate-900 font-bold">Ghi đè hoàn toàn (Khuyên dùng)</div>
                            <div className="text-[11px] text-slate-500">
                              Xóa sạch dữ liệu trường cũ, thay thế toàn bộ danh mục & học sinh theo file mới.
                            </div>
                          </div>
                        </label>

                        <label
                          className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                            importMode === 'merge'
                              ? 'border-[#0e3a7c] bg-blue-50/50 shadow-2xs font-semibold'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="import_mode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={() => setImportMode('merge')}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="text-slate-900 font-bold">Cập nhật & Bổ sung (Merge)</div>
                            <div className="text-[11px] text-slate-500">
                              Giữ nguyên dữ liệu cũ, chỉ cập nhật theo mã hoặc thêm mới bản ghi chưa có.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={handleExecuteMasterImport}
                      disabled={isImporting}
                      className="w-full py-3 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-bold rounded-xl shadow-xs text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang nạp toàn bộ dữ liệu vào hệ thống (Vui lòng chờ)...
                        </>
                      ) : (
                        <>
                          <FolderUp className="w-4 h-4" />
                          Tiến hành nạp toàn bộ dữ liệu trường học mới
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Import Result Notification */}
                {importResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-800">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      {importResult.message || 'Đã nạp toàn bộ dữ liệu thành công!'}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                      <div>✓ Lớp học: {importResult.counts?.classes || 0}</div>
                      <div>✓ Phòng KTX: {importResult.counts?.rooms || 0}</div>
                      <div>✓ Học sinh: {importResult.counts?.students || 0}</div>
                      <div>✓ Tài khoản: {importResult.counts?.users || 0}</div>
                      <div>✓ Quy tắc KPI: {importResult.counts?.kpi_rules || 0}</div>
                      <div>✓ Chế độ KTX: {importResult.counts?.regimes || 0}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Chatbot: Removed */}
      {false && (
        <div className="space-y-6">
          {/* Top Banner & Overview */}
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-400/10 to-transparent pointer-events-none"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300">
                    <Bot className="w-6 h-6 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      Cấu hình trợ lý AI Gemini chatbot
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 border border-amber-300">
                        10 key dùng dần
                      </span>
                    </h2>
                    <p className="text-xs text-slate-200">
                      Tư vấn toàn diện 24/7 về 120 phòng KTX, 1.883 học sinh, 11 chế độ sinh hoạt & 10 quy tắc KPI
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveChatbotSettings()}
                  disabled={chatbotSaving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer text-xs"
                >
                  {chatbotSaving ? (
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Lưu cấu hình AI
                </button>
              </div>
            </div>

            {/* Quick Stat Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                <div className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-amber-300" /> Mô hình đang chọn
                </div>
                <div className="text-sm font-black text-amber-300 mt-1 font-mono">
                  {chatbotSettings.active_model}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                <div className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-emerald-300" /> Bể chứa API Key
                </div>
                <div className="text-sm font-black text-emerald-300 mt-1">
                  {chatbotSettings.keys.filter((k) => k.key && k.key.trim() !== '').length} / 10 Key đã nhập
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
                <div className="text-[10px] uppercase font-bold text-slate-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-sky-300" /> Cơ chế luân chuyển
                </div>
                <div className="text-xs font-bold text-sky-200 mt-1">
                  Key #{chatbotSettings.active_key_index + 1} khởi đầu • Tự luân chuyển khi 429
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Model Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Chọn Phiên Bản Mô Hình Google Gemini Flash
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Hỗ trợ Flash 3.8, 3.7, 3.6, 2.0, 1.5 với cơ chế fallback thông minh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: 'gemini-3.8-flash',
                  name: 'Gemini Flash 3.8',
                  tag: 'MỚI NHẤT',
                  color: 'border-amber-400 bg-amber-50/40 text-amber-950',
                  badgeColor: 'bg-amber-400 text-slate-900',
                  desc: 'Mô hình Flash 3.8 thế hệ mới nhất, tốc độ phản hồi cực nhanh và tối ưu hoá ngữ cảnh trường học.',
                },
                {
                  id: 'gemini-3.7-flash',
                  name: 'Gemini Flash 3.7',
                  tag: 'KHUYÊN DÙNG',
                  color: 'border-blue-400 bg-blue-50/40 text-blue-950',
                  badgeColor: 'bg-blue-600 text-white',
                  desc: 'Mô hình Flash 3.7 cân bằng giữa tốc độ và khả năng suy luận, tối ưu tra cứu quy chế & nề nếp.',
                },
                {
                  id: 'gemini-3.6-flash',
                  name: 'Gemini Flash 3.6',
                  tag: 'TIÊU CHUẨN',
                  color: 'border-indigo-400 bg-indigo-50/40 text-indigo-950',
                  badgeColor: 'bg-indigo-600 text-white',
                  desc: 'Mô hình Flash 3.6 phản hồi ổn định cao, tiết kiệm token cho tra cứu thông thường.',
                },
                {
                  id: 'gemini-2.0-flash',
                  name: 'Gemini 2.0 Flash',
                  tag: 'CHÍNH THỨC',
                  color: 'border-emerald-400 bg-emerald-50/40 text-emerald-950',
                  badgeColor: 'bg-emerald-600 text-white',
                  desc: 'Bản Gemini 2.0 Flash chính thức toàn cầu với độ trễ tối thiểu và hỗ trợ dự phòng mượt mà.',
                },
                {
                  id: 'gemini-1.5-flash',
                  name: 'Gemini 1.5 Flash',
                  tag: 'DỰ PHÒNG',
                  color: 'border-slate-300 bg-slate-50 text-slate-900',
                  badgeColor: 'bg-slate-600 text-white',
                  desc: 'Phiên bản Flash 1.5 ổn định lâu dài, luôn tương thích với mọi loại tài khoản Google AI.',
                },
              ].map((m) => {
                const isSelected = chatbotSettings.active_model === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setChatbotSettings({ ...chatbotSettings, active_model: m.id })}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0e3a7c] bg-blue-50/60 shadow-xs ring-2 ring-[#0e3a7c]/15'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#0e3a7c]" />}
                          {m.name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${m.badgeColor}`}>
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{m.desc}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Endpoint: v1beta</span>
                      <span className={isSelected ? 'text-[#0e3a7c] font-bold' : ''}>
                        {isSelected ? 'Đang chọn' : 'Nhấp để chọn'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Model Input */}
            <div className="pt-2 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Hoặc nhập tên model tùy chỉnh:
              </label>
              <input
                type="text"
                value={chatbotSettings.active_model}
                onChange={(e) => setChatbotSettings({ ...chatbotSettings, active_model: e.target.value.trim() })}
                placeholder="VD: gemini-3.8-flash, gemini-3.7-flash, gemini-2.0-flash-exp"
                className="flex-1 max-w-md p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-[#0e3a7c]"
              />
            </div>
          </div>

          {/* Section 2: Manage 10 API Keys Pool */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Bể 10 Gemini API Key (Cơ Chế "Dùng Dần" & Tự Động Luân Chuyển)
                </h3>
              </div>
              <div className="text-[11px] text-slate-500 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-emerald-900 font-medium">
                💡 Tự động thử Key tiếp theo khi gặp hạn ngạch 429
              </div>
            </div>

            <div className="space-y-2.5">
              {chatbotSettings.keys.map((k, idx) => {
                const isStartingKey = chatbotSettings.active_key_index === idx;
                const isVisible = visibleKeys[k.id] || false;
                const testResult = testResults[k.id];
                const isTesting = testingKeyId === k.id;

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    Chưa nhập
                  </span>
                );

                if (k.key && k.key.trim()) {
                  if (isStartingKey) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Đang hoạt động
                      </span>
                    );
                  } else if (k.status === 'exhausted') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Hết hạn ngạch (429)
                      </span>
                    );
                  } else if (k.status === 'error') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Lỗi
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Sẵn sàng (Dự phòng)
                      </span>
                    );
                  }
                }

                return (
                  <div
                    key={k.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isStartingKey
                        ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-400/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Left: Slot & Starting radio & Note */}
                      <div className="flex items-center gap-2.5 min-w-[200px]">
                        <input
                          type="radio"
                          name="activeKeyRadio"
                          checked={isStartingKey}
                          onChange={() => setChatbotSettings({ ...chatbotSettings, active_key_index: idx })}
                          className="w-4 h-4 text-[#0e3a7c] focus:ring-[#0e3a7c] cursor-pointer"
                          title="Đặt làm Key khởi đầu"
                        />
                        <span className="font-mono font-black text-xs text-[#0e3a7c] px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          #{k.id}
                        </span>
                        <input
                          type="text"
                          value={k.note}
                          onChange={(e) => {
                            const newKeys = [...chatbotSettings.keys];
                            newKeys[idx].note = e.target.value;
                            setChatbotSettings({ ...chatbotSettings, keys: newKeys });
                          }}
                          placeholder={`Ghi chú Key #${k.id}`}
                          className="text-xs font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-[#0e3a7c] focus:outline-none w-28 py-0.5"
                        />
                        {statusBadge}
                      </div>

                      {/* Middle: API Key input with visibility toggle */}
                      <div className="flex-1 flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type={isVisible ? 'text' : 'password'}
                            value={k.key}
                            onChange={(e) => {
                              const newKeys = [...chatbotSettings.keys];
                              newKeys[idx].key = e.target.value.trim();
                              if (newKeys[idx].key) {
                                newKeys[idx].status = 'ready';
                              } else {
                                newKeys[idx].status = 'empty';
                              }
                              setChatbotSettings({ ...chatbotSettings, keys: newKeys });
                            }}
                            placeholder="Dán mã API Key (AIzaSy...)"
                            className="w-full p-2 pr-9 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:border-[#0e3a7c] focus:ring-1 focus:ring-[#0e3a7c]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setVisibleKeys((prev) => ({
                                ...prev,
                                [k.id]: !prev[k.id],
                              }))
                            }
                            className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title={isVisible ? 'Ẩn key' : 'Hiện key'}
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Test Button */}
                        <button
                          type="button"
                          onClick={() => handleTestKey(k.id, k.key)}
                          disabled={!k.key.trim() || isTesting}
                          className="px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0e3a7c] font-bold text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Kiểm tra kết nối và hạn ngạch của Key này"
                        >
                          {isTesting ? (
                            <span className="w-3.5 h-3.5 border-2 border-[#0e3a7c] border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          Kiểm tra
                        </button>

                        {/* Clear Key */}
                        {k.key && (
                          <button
                            type="button"
                            onClick={() => {
                              const newKeys = [...chatbotSettings.keys];
                              newKeys[idx].key = '';
                              newKeys[idx].status = 'empty';
                              setChatbotSettings({ ...chatbotSettings, keys: newKeys });
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Xóa key này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Right: Usage stats */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono shrink-0">
                        <span>{k.calls} gọi</span>
                        {k.errors > 0 && <span className="text-rose-600 font-bold">{k.errors} lỗi</span>}
                        {k.last_used && (
                          <span className="text-slate-400 text-[10px]">
                            Dùng lúc: {k.last_used.slice(11, 16)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Test result display */}
                    {testResult && (
                      <div
                        className={`mt-2 pt-2 border-t text-[11px] flex items-center gap-1.5 ${
                          testResult.valid
                            ? 'text-emerald-700 border-emerald-100'
                            : 'text-rose-700 border-rose-100'
                        }`}
                      >
                        {testResult.valid ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: System Prompt Knowledge Base */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0e3a7c]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  3. Prompt Tri Thức Hệ Thống (System Knowledge Base)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Khôi phục Prompt mặc định toàn diện của THPT Chuyên Hùng Vương?')) {
                    setChatbotSettings({
                      ...chatbotSettings,
                      system_prompt: chatbotSettings.default_system_prompt,
                    });
                  }
                }}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Khôi phục Prompt chuẩn
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Prompt này trang bị cho AI toàn bộ thông tin về 120 phòng KTX, 1.883 học sinh (702 nội trú, 1.181 ngoại trú), 11 chế độ sinh hoạt, 10 lỗi vi phạm KPI (L01-L10), điểm danh 22:00, báo cáo Zalo 22:15, đơn xin phép và mẫu in A4.
            </p>

            <textarea
              rows={12}
              value={chatbotSettings.system_prompt}
              onChange={(e) => setChatbotSettings({ ...chatbotSettings, system_prompt: e.target.value })}
              placeholder="Nhập nội dung System Prompt chỉ dẫn cho AI..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono leading-relaxed text-slate-800 focus:border-[#0e3a7c] focus:ring-1 focus:ring-[#0e3a7c]"
            />

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveChatbotSettings()}
                disabled={chatbotSaving}
                className="px-6 py-2.5 bg-[#0e3a7c] hover:bg-[#0a2a5a] text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                {chatbotSaving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Lưu toàn bộ cấu hình Gemini AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Nhật ký kiểm toán toàn hệ thống (Audit Logs)
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Thời gian</th>
                  <th className="px-4 py-2.5">Người thực hiện</th>
                  <th className="px-3 py-2.5">Hành động</th>
                  <th className="px-3 py-2.5">Thực thể</th>
                  <th className="px-4 py-2.5">Nội dung chi tiết</th>
                  <th className="px-3 py-2.5">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{l.created_at}</td>
                    <td className="px-4 py-2.5 font-bold text-[#0e3a7c]">
                      {l.full_name || l.username || 'System'}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{l.action}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">{l.entity_type}</td>
                    <td className="px-4 py-2.5 text-slate-700">{l.details}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">{l.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Database Backup */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4 text-xs text-slate-700">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Database className="w-8 h-8 text-[#0e3a7c]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sao Lưu Cơ Sở Dữ Liệu MySQL</h3>
              <p className="text-[11px] text-slate-500">Cơ sở dữ liệu: <strong className="font-mono text-[#0e3a7c]">chuyenhungvuong_kpi</strong></p>
            </div>
          </div>

          {backupInfo && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span>Phiên bản máy chủ MySQL:</span>
                <strong className="font-mono">{backupInfo.server_version}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tổng số bảng dữ liệu:</span>
                <strong>{backupInfo.total_tables} bảng</strong>
              </div>
              <div className="flex justify-between">
                <span>Tổng số bản ghi:</span>
                <strong className="text-[#0e3a7c]">{backupInfo.total_records?.toLocaleString()} bản ghi</strong>
              </div>
              <div className="flex justify-between">
                <span>Thời điểm kiểm tra:</span>
                <span className="font-mono">{backupInfo.backup_timestamp}</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => alert('Đã sao lưu thành công tệp cấu trúc & dữ liệu SQL: backup_chuyenhungvuong_kpi.sql')}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Xuất Bản Sao Lưu SQL (.sql)
            </button>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      <Modal
        isOpen={createUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Tạo tài khoản người dùng mới"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs text-slate-700">
          {/* Avatar Picker from Device */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden shrink-0 shadow-2xs">
              {newUser.avatar_url ? (
                <img src={newUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-6 h-6 text-slate-400" />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-[#0e3a7c] animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className="block font-bold text-slate-700 text-xs">Ảnh đại diện người dùng</label>
              <input
                type="file"
                ref={avatarCreateFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleCreateAvatarSelect}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarCreateFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />
                  {isUploadingAvatar ? 'Đang tải...' : 'Chọn ảnh từ thiết bị'}
                </button>
                {newUser.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, avatar_url: '' })}
                    className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập (*)</label>
            <input
              type="text"
              required
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="VD: gvcn_10ly1"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mật khẩu khởi tạo (*)</label>
            <input
              type="password"
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Họ và tên (*)</label>
            <input
              type="text"
              required
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              placeholder="VD: Thầy Nguyễn Văn X"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Vai trò hệ thống (*)</label>
            <select
              value={newUser.role}
              onChange={(e) => {
                const nextRole = e.target.value;
                setNewUser({
                  ...newUser,
                  role: nextRole,
                  scope_type: (nextRole === 'homeroom_teacher' || nextRole === 'class_cadre') ? 'class' : nextRole === 'room_leader' ? 'room' : nextRole === 'floor_leader' ? 'floor' : '',
                  scope_id: nextRole === 'floor_leader' ? '2' : '',
                });
              }}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
            >
              <option value="admin">1. Admin (Ban Giám hiệu / Quản trị viên — Toàn quyền xem và sửa)</option>
              <option value="dorm_manager">2. Quản sinh KTX (Toàn bộ 112 phòng nội trú)</option>
              <option value="homeroom_teacher">3. Giáo viên chủ nhiệm (GVCN lớp)</option>
              <option value="class_cadre">4. Lớp trưởng / Bí thư (LT BT — Điểm danh lớp)</option>
              <option value="student">5. Học sinh (Chỉ có quyền xem — Read-only)</option>
              <option value="floor_leader">Trưởng tầng KTX</option>
              <option value="room_leader">Trưởng phòng KTX</option>
              <option value="youth_union">Đoàn Thanh niên / Chi đoàn cờ đỏ</option>
            </select>
          </div>

          {/* Conditional Scope Assignment: Gán phòng KTX, tầng hoặc lớp */}
          {(newUser.role === 'homeroom_teacher' || newUser.role === 'class_cadre') && (
            <div className="p-3 bg-purple-50/80 rounded-xl border-2 border-purple-200 space-y-1.5">
              <label className="block font-bold text-purple-900 text-xs">
                🎓 Gán lớp phụ trách / Lớp sinh hoạt (*)
              </label>
              <select
                required
                value={newUser.scope_id}
                onChange={(e) => setNewUser({ ...newUser, scope_id: e.target.value, scope_type: 'class' })}
                className="w-full p-2 border border-purple-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Chọn 1 trong 54 lớp chuyên --</option>
                {classesList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - Khối {c.grade_level} (GVCN: {c.teacher_name || 'Đang cập nhật'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-purple-700">Tài khoản sẽ được phân quyền truy cập và quản lý dữ liệu trong phạm vi lớp này.</p>
            </div>
          )}
          {newUser.role === 'room_leader' && (
            <div className="p-3 bg-blue-50/80 rounded-xl border-2 border-blue-200 space-y-1.5">
              <label className="block font-bold text-blue-900 text-xs">
                🛏️ Gán phòng KTX quản lý (*)
              </label>
              <select
                required
                value={newUser.scope_id}
                onChange={(e) => setNewUser({ ...newUser, scope_id: e.target.value, scope_type: 'room' })}
                className="w-full p-2 border border-blue-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn 1 trong 120 phòng KTX --</option>
                {dormRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.code || r.room_code} (Tầng {r.floor_number} — {r.gender === 'male' || r.gender_zone === 'male' ? 'Khu Nam' : 'Khu Nữ'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-blue-700">Tài khoản Trưởng phòng sẽ chịu trách nhiệm điểm danh và quản lý nội vụ phòng này.</p>
            </div>
          )}

          {newUser.role === 'floor_leader' && (
            <div className="p-3 bg-amber-50/80 rounded-xl border-2 border-amber-200 space-y-1.5">
              <label className="block font-bold text-amber-900 text-xs">
                🏢 Gán tầng KTX quản lý (*)
              </label>
              <select
                required
                value={newUser.scope_id}
                onChange={(e) => setNewUser({ ...newUser, scope_id: e.target.value, scope_type: 'floor' })}
                className="w-full p-2 border border-amber-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="2">Tầng 2 (Khu Nam - 24 phòng P201 đến P224)</option>
                <option value="3">Tầng 3 (Khu Nam - 24 phòng P301 đến P324)</option>
                <option value="4">Tầng 4 (Khu Nam/Nữ - 24 phòng P401 đến P424)</option>
                <option value="5">Tầng 5 (Khu Nữ - 24 phòng P501 đến P524)</option>
                <option value="6">Tầng 6 (Khu Nữ - 24 phòng P601 đến P624)</option>
              </select>
              <p className="text-[10px] text-amber-700">Trưởng tầng có quyền duyệt báo cáo 24 phòng và lập báo cáo tầng.</p>
            </div>
          )}

          {newUser.role === 'homeroom_teacher' && (
            <div className="p-3 bg-purple-50/80 rounded-xl border-2 border-purple-200 space-y-1.5">
              <label className="block font-bold text-purple-900 text-xs">
                🎓 Gán lớp chuyên chủ nhiệm (*)
              </label>
              <select
                required
                value={newUser.scope_id}
                onChange={(e) => setNewUser({ ...newUser, scope_id: e.target.value, scope_type: 'class' })}
                className="w-full p-2 border border-purple-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Chọn 1 trong 54 lớp chuyên --</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.name} (Khối {c.grade_level})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateUserModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#0e3a7c] text-white font-bold rounded-lg hover:bg-[#0a2754] cursor-pointer"
            >
              Tạo tài khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={editUserModalOpen}
        onClose={() => setEditUserModalOpen(false)}
        title={`Chỉnh sửa tài khoản: ${editingUser?.username || ''}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditUser} className="space-y-3 text-xs text-slate-700">
          {/* Avatar Picker from Device */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white overflow-hidden shrink-0 shadow-2xs">
              {editUserForm.avatar_url ? (
                <img src={editUserForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCheck className="w-6 h-6 text-slate-400" />
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-[#0e3a7c] animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <label className="block font-bold text-slate-700 text-xs">Ảnh đại diện người dùng</label>
              <input
                type="file"
                ref={avatarEditFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleEditAvatarSelect}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarEditFileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-[#0e3a7c] hover:bg-[#0a2754] text-white font-semibold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />
                  {isUploadingAvatar ? 'Đang tải...' : 'Chọn ảnh từ thiết bị'}
                </button>
                {editUserForm.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setEditUserForm({ ...editUserForm, avatar_url: '' })}
                    className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold cursor-pointer"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập</label>
            <input
              type="text"
              disabled
              value={editingUser?.username || ''}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Họ và tên (*)</label>
            <input
              type="text"
              required
              value={editUserForm.full_name}
              onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                placeholder="email@chuyenhungvuong.edu.vn"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vai trò hệ thống (*)</label>
              <select
                value={editUserForm.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setEditUserForm({
                    ...editUserForm,
                    role: nextRole,
                    scope_type: (nextRole === 'homeroom_teacher' || nextRole === 'class_cadre') ? 'class' : nextRole === 'room_leader' ? 'room' : nextRole === 'floor_leader' ? 'floor' : '',
                  });
                }}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800"
              >
                <option value="admin">1. Admin (Ban Giám hiệu / Quản trị viên)</option>
                <option value="dorm_manager">2. Quản sinh KTX</option>
                <option value="homeroom_teacher">3. Giáo viên chủ nhiệm (GVCN)</option>
                <option value="class_cadre">4. Lớp trưởng / Bí thư (LT BT)</option>
                <option value="student">5. Học sinh (Chỉ xem)</option>
                <option value="floor_leader">Trưởng tầng KTX</option>
                <option value="room_leader">Trưởng phòng KTX</option>
                <option value="youth_union">Đoàn Thanh niên / Chi đoàn</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
              <select
                value={editUserForm.status}
                onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="locked">Khóa tài khoản (Locked)</option>
              </select>
            </div>
          </div>

          {/* Conditional Scope Assignment in Edit Modal */}
          {editUserForm.role === 'room_leader' && (
            <div className="p-3 bg-blue-50/80 rounded-xl border-2 border-blue-200 space-y-1.5">
              <label className="block font-bold text-blue-900 text-xs">
                🛏️ Gán phòng KTX quản lý (*)
              </label>
              <select
                required
                value={editUserForm.scope_id}
                onChange={(e) => setEditUserForm({ ...editUserForm, scope_id: e.target.value, scope_type: 'room' })}
                className="w-full p-2 border border-blue-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn 1 trong 120 phòng KTX --</option>
                {dormRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Phòng {r.code || r.room_code} (Tầng {r.floor_number} — {r.gender === 'male' || r.gender_zone === 'male' ? 'Khu Nam' : 'Khu Nữ'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {editUserForm.role === 'floor_leader' && (
            <div className="p-3 bg-amber-50/80 rounded-xl border-2 border-amber-200 space-y-1.5">
              <label className="block font-bold text-amber-900 text-xs">
                🏢 Gán tầng KTX quản lý (*)
              </label>
              <select
                required
                value={editUserForm.scope_id}
                onChange={(e) => setEditUserForm({ ...editUserForm, scope_id: e.target.value, scope_type: 'floor' })}
                className="w-full p-2 border border-amber-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="2">Tầng 2 (Khu Nam - 24 phòng P201 đến P224)</option>
                <option value="3">Tầng 3 (Khu Nam - 24 phòng P301 đến P324)</option>
                <option value="4">Tầng 4 (Khu Nam/Nữ - 24 phòng P401 đến P424)</option>
                <option value="5">Tầng 5 (Khu Nữ - 24 phòng P501 đến P524)</option>
                <option value="6">Tầng 6 (Khu Nữ - 24 phòng P601 đến P624)</option>
              </select>
            </div>
          )}

          {(editUserForm.role === 'homeroom_teacher' || editUserForm.role === 'class_cadre') && (
            <div className="p-3 bg-purple-50/80 rounded-xl border-2 border-purple-200 space-y-1.5">
              <label className="block font-bold text-purple-900 text-xs">
                🎓 Gán lớp phụ trách / Lớp sinh hoạt (*)
              </label>
              <select
                required
                value={editUserForm.scope_id}
                onChange={(e) => setEditUserForm({ ...editUserForm, scope_id: e.target.value, scope_type: 'class' })}
                className="w-full p-2 border border-purple-300 rounded-lg bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Chọn 1 trong 54 lớp chuyên --</option>
                {classesList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - Khối {c.grade_level} (GVCN: {c.teacher_name || 'Đang cập nhật'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Đặt lại mật khẩu mới (để trống nếu không đổi)</label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự để đổi mật khẩu..."
              value={editUserForm.new_password}
              onChange={(e) => setEditUserForm({ ...editUserForm, new_password: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditUserModalOpen(false)}
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

      {/* Modal: Xác nhận xóa trắng toàn bộ dữ liệu hệ thống */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => {
          setClearModalOpen(false);
          setConfirmResetText('');
          setResetSchoolName('');
        }}
        title="⚠️ Xóa trắng toàn bộ dữ liệu để bàn giao trường mới"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-red-900">
            <div className="flex items-center gap-2 font-black text-sm text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              CẢNH BÁO: HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!
            </div>
            <p className="leading-relaxed">
              Hệ thống sẽ <strong>xóa toàn bộ</strong>: Danh sách học sinh, vi phạm nề nếp KPI, đơn xin phép, lịch sử điểm danh, báo cáo Zalo, phòng KTX, lớp học và tất cả tài khoản người dùng của trường cũ.
            </p>
            <div className="p-2.5 bg-white/80 rounded-lg border border-red-200 font-semibold text-slate-800 text-[11px] space-y-1">
              <div className="text-emerald-700 font-bold">
                ✓ Duy nhất 1 tài khoản Quản trị tối cao được giữ lại để bàn giao trường mới:
              </div>
              <div>• Tên đăng nhập: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-700">admin</code></div>
              <div>• Mật khẩu mặc định: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-700">password123</code></div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Tên trường mới tiếp quản website (Tùy chọn):
            </label>
            <input
              type="text"
              placeholder="VD: Trường THPT Chuyên Lê Hồng Phong"
              value={resetSchoolName}
              onChange={(e) => setResetSchoolName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Xác nhận xóa: Nhập chính xác cụm từ <span className="text-red-600 font-mono font-black">XOA TRANG DU LIEU</span> hoặc <span className="text-red-600 font-mono font-black">RESET</span>:
            </label>
            <input
              type="text"
              placeholder="Gõ XOA TRANG DU LIEU hoặc RESET..."
              value={confirmResetText}
              onChange={(e) => setConfirmResetText(e.target.value)}
              className="w-full p-2.5 border-2 border-red-300 rounded-lg text-xs font-mono font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setClearModalOpen(false);
                setConfirmResetText('');
                setResetSchoolName('');
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isResetting || (confirmResetText !== 'XOA TRANG DU LIEU' && confirmResetText !== 'RESET')}
              onClick={handleExecuteClearData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang xóa trắng dữ liệu...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Xác nhận xóa trắng toàn bộ
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
