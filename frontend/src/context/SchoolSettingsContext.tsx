// frontend/src/context/SchoolSettingsContext.tsx
// Global context for multi-tenant school identity, branding, and parallel universes

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface SchoolItem {
  code: string;
  name: string;
  province: string;
  logo: string;
  brand_primary_color: string;
  total_classes: number;
  total_students: number;
  is_default: boolean;
  database?: string;
}

export interface SchoolSettings {
  school_name?: string;
  school_code?: string;
  school_province?: string;
  school_address?: string;
  school_phone?: string;
  school_email?: string;
  school_website?: string;
  school_logo?: string;
  principal_name?: string;
  vice_principals?: string;
  dorm_manager_name?: string;
  youth_union_secretary?: string;
  academic_year_current?: string;
  brand_primary_color?: string;
  brand_accent_color?: string;
  brand_gold_color?: string;
  morning_attendance_time?: string;
  evening_attendance_time?: string;
  zalo_report_time?: string;
  [key: string]: any;
}

interface SchoolSettingsContextType {
  settings: SchoolSettings;
  schools: SchoolItem[];
  currentSchoolCode: string;
  isLoading: boolean;
  switchSchool: (code: string) => Promise<void>;
  createSchool: (data: {
    school_name: string;
    school_code: string;
    school_province?: string;
    admin_password: string;
    admin_username?: string;
  }) => Promise<any>;
  refreshSettings: () => Promise<void>;
  refreshSchools: () => Promise<void>;
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
}

const defaultSettings: SchoolSettings = {
  school_name: 'Trường THPT Chuyên Hùng Vương',
  school_code: 'chuyenhungvuong',
  school_province: 'Phú Thọ',
  school_address: 'Đại lộ Hùng Vương, TP. Việt Trì, Phú Thọ',
  school_phone: '0210 3846 592',
  school_email: 'c3hungvuong.phutho@moet.edu.vn',
  school_website: 'thptchuyenhungvuong.phutho.edu.vn',
  school_logo: '/logo.png',
  principal_name: 'TS. Phạm Tuấn Anh',
  vice_principals: 'Nguyễn Thị Lan, Trần Văn Hải',
  dorm_manager_name: 'Thầy Đỗ Văn Thắng',
  youth_union_secretary: 'Cô Trần Thị Mai',
  academic_year_current: '2026 - 2027',
  brand_primary_color: '#0e3a7c',
  brand_accent_color: '#d32027',
  brand_gold_color: '#f59e0b',
  morning_attendance_time: '06:00',
  evening_attendance_time: '22:00',
  zalo_report_time: '22:15',
};

const SchoolSettingsContext = createContext<SchoolSettingsContextType>({
  settings: defaultSettings,
  schools: [],
  currentSchoolCode: 'chuyenhungvuong',
  isLoading: false,
  switchSchool: async () => {},
  createSchool: async () => {},
  refreshSettings: async () => {},
  refreshSchools: async () => {},
  updateSettings: async () => {},
});

export const SchoolSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSchoolCode, setCurrentSchoolCode] = useState<string>(() => {
    try {
      const urlSchool = new URLSearchParams(window.location.search).get('school');
      if (urlSchool) {
        localStorage.setItem('thaykinh_school_code', urlSchool.trim().toLowerCase());
        return urlSchool.trim().toLowerCase();
      }
      return localStorage.getItem('thaykinh_school_code') || 'chuyenhungvuong';
    } catch {
      return 'chuyenhungvuong';
    }
  });

  const [schools, setSchools] = useState<SchoolItem[]>([]);

  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const cached = localStorage.getItem('school_settings_cache_' + (localStorage.getItem('thaykinh_school_code') || 'chuyenhungvuong'));
      return cached ? { ...defaultSettings, ...JSON.parse(cached) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      const res: any = await api.get('/public/schools');
      const list = res?.data || res || [];
      if (Array.isArray(list)) {
        setSchools(list);
      }
    } catch (e) {
      console.warn('Could not fetch schools list:', e);
    }
  }, []);

  const fetchSettings = useCallback(async (codeOverride?: string) => {
    const code = codeOverride || currentSchoolCode;
    try {
      setIsLoading(true);
      const res: any = await api.get('/public/settings');
      const loaded = res?.data || res;
      if (loaded && typeof loaded === 'object') {
        setSettings((prev) => {
          const merged = { ...prev, ...loaded };
          try {
            localStorage.setItem('school_settings_cache_' + code, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [currentSchoolCode]);

  useEffect(() => {
    fetchSchools();
    fetchSettings();
  }, [fetchSchools, fetchSettings]);

  const switchSchool = async (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    localStorage.setItem('thaykinh_school_code', cleanCode);
    setCurrentSchoolCode(cleanCode);

    // Xóa session đăng nhập cũ khi đổi trường để đảm bảo không bị lẫn lộn giữa 2 thế giới
    const oldToken = localStorage.getItem('thaykinh_auth_token');
    if (oldToken) {
      localStorage.removeItem('thaykinh_auth_token');
      localStorage.removeItem('thaykinh_auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    await fetchSettings(cleanCode);
  };

  const createSchool = async (data: {
    school_name: string;
    school_code: string;
    school_province?: string;
    admin_password: string;
    admin_username?: string;
  }) => {
    const res: any = await api.post('/public/schools', data);
    await fetchSchools();
    if (res?.data?.code) {
      await switchSchool(res.data.code);
    }
    return res;
  };

  const updateSettings = async (newSettings: Partial<SchoolSettings>) => {
    await api.put('/admin/settings', newSettings);
    await fetchSettings();
  };

  return (
    <SchoolSettingsContext.Provider
      value={{
        settings,
        schools,
        currentSchoolCode,
        isLoading,
        switchSchool,
        createSchool,
        refreshSettings: () => fetchSettings(),
        refreshSchools: fetchSchools,
        updateSettings,
      }}
    >
      {children}
    </SchoolSettingsContext.Provider>
  );
};

export const useSchoolSettings = () => useContext(SchoolSettingsContext);
