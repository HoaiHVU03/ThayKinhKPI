// frontend/src/types/index.ts

export type Role = 
  | 'admin' 
  | 'dorm_manager' 
  | 'homeroom_teacher'
  | 'class_cadre'
  | 'student'
  | 'room_leader' 
  | 'floor_leader' 
  | 'youth_union';

export interface UserScope {
  scope_type: 'class' | 'room' | 'floor';
  scope_id: number;
  scope_name?: string | null;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: 'active' | 'locked';
  avatar_url?: string | null;
  scopes?: UserScope[];
}

export interface Student {
  id: number;
  code: string;
  full_name: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  class_id: number;
  class_name: string;
  grade_level: number;
  is_boarding: number;
  dorm_room_id: number | null;
  room_code?: string;
  floor_number?: number;
  parent_name?: string;
  parent_phone?: string;
  student_phone?: string;
  id_card_number?: string;
  hometown?: string;
  teacher_name?: string;
  teacher_phone?: string;
  status: 'studying' | 'graduated' | 'transferred' | 'suspended';
  final_score?: number;
  classification?: string;
  baseline_score?: number;
  total_deducted?: number;
  violations?: Violation[];
}

export interface ClassInfo {
  id: number;
  code: string;
  name: string;
  grade_level: number;
  total_students: number;
  boarding_students: number;
  room_location: string;
  teacher_id?: number;
  teacher_name?: string;
  teacher_phone?: string;
  avg_kpi: number;
  violation_count: number;
}

export interface DormRoom {
  id: number;
  code: string;
  floor_number: number;
  gender: 'Nam' | 'Nữ';
  capacity: number;
  current_occupancy: number;
  cleanliness_score: number;
  status: 'active' | 'maintenance';
  room_leader_name?: string;
  room_leader_phone?: string;
  present_count?: number;
  excused_count?: number;
  unexcused_count?: number;
  attendance_status?: 'reported' | 'unreported';
  students?: Student[];
}

export interface FloorOverview {
  floor_number: number;
  name: string;
  gender_zone: string;
  total_rooms: number;
  total_occupancy: number;
  total_capacity: number;
  floor_leader_name?: string;
  floor_leader_phone?: string;
}

export interface KpiRule {
  id: number;
  code: string;
  name: string;
  deduction_points: number;
  description: string;
  category: string;
  rule_type?: 'deduction' | 'bonus';
}

export interface Violation {
  id: number;
  code: string;
  student_id: number;
  student_code: string;
  student_name: string;
  class_id: number;
  class_name: string;
  rule_id: number;
  rule_code: string;
  rule_name: string;
  violation_date: string;
  violation_time: string;
  location: string;
  description: string;
  points_deducted: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  reporter_name?: string;
  approver_name?: string;
  evidence_url?: string;
  is_bonus?: boolean;
}

export interface DailyRegime {
  id: number;
  order_num: number;
  time_start: string;
  time_end: string;
  name: string;
  description: string;
  responsible_role: string;
  execution_status?: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  completed_by_name?: string;
  checklist?: { id: number; title: string; order_num: number }[];
}

export interface DutySchedule {
  id: number;
  duty_date: string;
  shift_name: string;
  teacher_code: string;
  teacher_name: string;
  teacher_phone: string;
  subject: string;
  location: string;
  status: 'pending' | 'completed';
  notes?: string;
  steps?: { id: number; step_number: number; title: string; is_completed: number; notes?: string }[];
}

export interface LeaveRequest {
  id: number;
  code: string;
  student_id: number;
  student_code: string;
  student_name: string;
  student_phone?: string;
  class_name: string;
  room_code?: string;
  floor_number?: number;
  request_type: 'home' | 'tutoring' | 'medical' | 'personal' | 'other';
  reason: string;
  start_time: string;
  expected_end_time: string;
  actual_return_time?: string;
  parent_confirmation: number;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'overdue' | 'completed';
  approver_name?: string;
  is_overdue?: boolean;
  created_at?: string;
}
