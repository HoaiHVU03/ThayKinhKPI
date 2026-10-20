// frontend/src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SchoolSettingsProvider } from './context/SchoolSettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { DormitoryPage } from './pages/DormitoryPage';
import { AttendancePage } from './pages/AttendancePage';
import { ClassAttendancePage } from './pages/ClassAttendancePage';
import { RegimesPage } from './pages/RegimesPage';
import { KpiPage } from './pages/KpiPage';
import { DutyPage } from './pages/DutyPage';
import { LeaveRequestsPage } from './pages/LeaveRequestsPage';
import { ReportsPage } from './pages/ReportsPage';
import { OfficialDocumentPage } from './pages/OfficialDocumentPage';
import { AcademicYearPage } from './pages/AcademicYearPage';
import type { Role } from './types';
import { AdminPage } from './pages/AdminPage';
import { StudentLeaveSubmitPage } from './pages/StudentLeaveSubmitPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#0e3a7c] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleRoute: React.FC<{ allowedRoles: Role[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <SchoolSettingsProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/xin-phep" element={<StudentLeaveSubmitPage />} />
          <Route path="/xin-nghi" element={<Navigate to="/xin-phep" replace />} />
          <Route path="/nop-don" element={<Navigate to="/xin-phep" replace />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route
              path="/classes"
              element={
                <RoleRoute allowedRoles={['admin', 'homeroom_teacher', 'class_cadre', 'youth_union', 'dorm_manager']}>
                  <ClassesPage />
                </RoleRoute>
              }
            />
            <Route path="/dormitory" element={<DormitoryPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route
              path="/class-attendance"
              element={
                <RoleRoute allowedRoles={['admin', 'homeroom_teacher', 'class_cadre', 'student', 'youth_union', 'dorm_manager']}>
                  <ClassAttendancePage />
                </RoleRoute>
              }
            />
            <Route path="/regimes" element={<RegimesPage />} />
            <Route path="/kpi" element={<KpiPage />} />
            <Route path="/duty" element={<Navigate to="/dashboard" replace />} />
            <Route path="/leaves" element={<LeaveRequestsPage />} />
            <Route
              path="/reports"
              element={
                <RoleRoute allowedRoles={['admin', 'youth_union', 'dorm_manager', 'homeroom_teacher']}>
                  <ReportsPage />
                </RoleRoute>
              }
            />
            <Route path="/official-document" element={<OfficialDocumentPage />} />
            <Route
              path="/academic-year"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AcademicYearPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <AdminPage />
                </RoleRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </SchoolSettingsProvider>
  );
};

export default App;
