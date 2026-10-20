-- HỆ THỐNG QUẢN LÝ HỌC SINH, KÝ TÚC XÁ VÀ KPI RÈN LUYỆN NỀN NẾP
-- TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG — PHIÊN BẢN 1.0
-- DATABASE SCHEMA

CREATE DATABASE IF NOT EXISTS `chuyenhungvuong_kpi` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `chuyenhungvuong_kpi`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS & ROLES
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `user_scope_assignments`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NULL,
  `role` ENUM('admin', 'dorm_manager', 'homeroom_teacher', 'class_cadre', 'student', 'room_leader', 'floor_leader', 'youth_union') NOT NULL DEFAULT 'student',
  `status` ENUM('active', 'locked') NOT NULL DEFAULT 'active',
  `avatar_url` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_scope_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `scope_type` ENUM('class', 'room', 'floor') NOT NULL,
  `scope_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_scope` (`user_id`, `scope_type`, `scope_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ACADEMIC STRUCTURE
DROP TABLE IF EXISTS `student_kpi_summaries`;
DROP TABLE IF EXISTS `violation_records`;
DROP TABLE IF EXISTS `kpi_assessment_periods`;
DROP TABLE IF EXISTS `kpi_rules`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `dormitory_attendance_records`;
DROP TABLE IF EXISTS `dormitory_room_reports`;
DROP TABLE IF EXISTS `dormitory_floor_reports`;
DROP TABLE IF EXISTS `dormitory_attendance_sessions`;
DROP TABLE IF EXISTS `room_assignments`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `classes`;
DROP TABLE IF EXISTS `dormitory_rooms`;
DROP TABLE IF EXISTS `dormitory_floors`;
DROP TABLE IF EXISTS `teachers`;
DROP TABLE IF EXISTS `semesters`;
DROP TABLE IF EXISTS `academic_years`;

CREATE TABLE `academic_years` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `is_current` TINYINT(1) NOT NULL DEFAULT 0,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `semesters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `academic_year_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `is_current` TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NULL,
  `subject` VARCHAR(50) NOT NULL,
  `is_duty_teacher` TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(50) NOT NULL,
  `grade_level` TINYINT NOT NULL, -- 10, 11, 12
  `academic_year_id` INT NOT NULL,
  `homeroom_teacher_id` INT NULL,
  `total_students` INT NOT NULL DEFAULT 0,
  `boarding_students` INT NOT NULL DEFAULT 0,
  `room_location` VARCHAR(50) NULL,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`),
  FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DORMITORY STRUCTURE
CREATE TABLE `dormitory_floors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `floor_number` TINYINT NOT NULL UNIQUE, -- 2, 3, 4, 5, 6
  `name` VARCHAR(50) NOT NULL,
  `gender_zone` VARCHAR(50) NOT NULL,
  `total_rooms` INT NOT NULL DEFAULT 0,
  `floor_leader_id` INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dormitory_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL UNIQUE,
  `floor_number` TINYINT NOT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 6,
  `current_occupancy` INT NOT NULL DEFAULT 0,
  `room_leader_id` INT NULL,
  `cleanliness_score` DECIMAL(4,1) DEFAULT 95.0,
  `status` ENUM('active', 'maintenance') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. STUDENTS
CREATE TABLE `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `dob` DATE NOT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `class_id` INT NOT NULL,
  `is_boarding` TINYINT(1) NOT NULL DEFAULT 0, -- 1: noi tru, 0: ngoai tru
  `dorm_room_id` INT NULL,
  `parent_name` VARCHAR(100) NULL,
  `parent_phone` VARCHAR(20) NULL,
  `student_phone` VARCHAR(20) NULL,
  `id_card_number` VARCHAR(20) NULL,
  `hometown` VARCHAR(100) NULL,
  `status` ENUM('studying', 'graduated', 'transferred', 'suspended') DEFAULT 'studying',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`),
  FOREIGN KEY (`dorm_room_id`) REFERENCES `dormitory_rooms`(`id`) ON DELETE SET NULL,
  INDEX `idx_students_class` (`class_id`),
  INDEX `idx_students_boarding` (`is_boarding`),
  INDEX `idx_students_room` (`dorm_room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `room_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `academic_year_id` INT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `left_at` DATETIME NULL,
  `status` ENUM('active', 'transferred', 'left') DEFAULT 'active',
  `note` VARCHAR(255) NULL,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `dormitory_rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ATTENDANCE & DORMITORY REPORTING
CREATE TABLE `dormitory_attendance_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_date` DATE NOT NULL,
  `session_type` ENUM('morning', 'evening') NOT NULL, -- morning: 06h00, evening: 22h00
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by_user_id` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_session` (`session_date`, `session_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dormitory_attendance_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `status` ENUM('present', 'excused_absence', 'unexcused_absence', 'hospital', 'hometown', 'outside_permitted') NOT NULL DEFAULT 'present',
  `note` VARCHAR(255) NULL,
  `recorded_by_user_id` INT NULL,
  `recorded_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `dormitory_attendance_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `dormitory_rooms`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_session_student` (`session_id`, `student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dormitory_room_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `reported_by_user_id` INT NOT NULL,
  `total_students` INT NOT NULL DEFAULT 0,
  `present_count` INT NOT NULL DEFAULT 0,
  `excused_count` INT NOT NULL DEFAULT 0,
  `unexcused_count` INT NOT NULL DEFAULT 0,
  `other_count` INT NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `dormitory_attendance_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `dormitory_rooms`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_session_room` (`session_id`, `room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dormitory_floor_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `floor_number` TINYINT NOT NULL,
  `reported_by_user_id` INT NOT NULL,
  `total_rooms` INT NOT NULL,
  `reported_rooms` INT NOT NULL,
  `total_students` INT NOT NULL,
  `present_count` INT NOT NULL,
  `excused_count` INT NOT NULL,
  `unexcused_count` INT NOT NULL,
  `zalo_content` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `dormitory_attendance_sessions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_session_floor` (`session_id`, `floor_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 11 CHẾ ĐỘ SINH HOẠT KTX
DROP TABLE IF EXISTS `regime_execution_records`;
DROP TABLE IF EXISTS `regime_checklist_items`;
DROP TABLE IF EXISTS `daily_regimes`;

CREATE TABLE `daily_regimes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_num` TINYINT NOT NULL UNIQUE,
  `time_start` VARCHAR(10) NOT NULL,
  `time_end` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `responsible_role` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `regime_checklist_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `regime_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `order_num` TINYINT NOT NULL DEFAULT 1,
  FOREIGN KEY (`regime_id`) REFERENCES `daily_regimes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `regime_execution_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `regime_id` INT NOT NULL,
  `execution_date` DATE NOT NULL,
  `status` ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  `completed_by_user_id` INT NULL,
  `completed_at` DATETIME NULL,
  `note` TEXT NULL,
  FOREIGN KEY (`regime_id`) REFERENCES `daily_regimes`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_regime_date` (`regime_id`, `execution_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. KPI & VIOLATIONS
CREATE TABLE `kpi_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL UNIQUE, -- L01 -> L10
  `name` VARCHAR(150) NOT NULL,
  `deduction_points` INT NOT NULL,
  `description` TEXT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'nề_nếp_học_đường'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `kpi_assessment_periods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `academic_year_id` INT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `violation_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE, -- e.g. BB-20261017-001
  `student_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  `rule_id` INT NOT NULL,
  `period_id` INT NOT NULL,
  `violation_date` DATE NOT NULL,
  `violation_time` TIME NULL,
  `location` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `points_deducted` INT NOT NULL,
  `reported_by_user_id` INT NOT NULL,
  `evidence_url` VARCHAR(255) NULL,
  `status` ENUM('draft', 'pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'approved',
  `approved_by_user_id` INT NULL,
  `approved_at` DATETIME NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`),
  FOREIGN KEY (`rule_id`) REFERENCES `kpi_rules`(`id`),
  FOREIGN KEY (`period_id`) REFERENCES `kpi_assessment_periods`(`id`),
  INDEX `idx_violation_student` (`student_id`),
  INDEX `idx_violation_date` (`violation_date`),
  INDEX `idx_violation_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `student_kpi_summaries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `period_id` INT NOT NULL,
  `baseline_score` DECIMAL(5,1) NOT NULL DEFAULT 100.0,
  `total_deducted` DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  `final_score` DECIMAL(5,1) NOT NULL DEFAULT 100.0,
  `classification` VARCHAR(50) NOT NULL DEFAULT 'Xuất sắc',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`period_id`) REFERENCES `kpi_assessment_periods`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_student_period` (`student_id`, `period_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TRỰC BAN TÒA NHÀ A
DROP TABLE IF EXISTS `duty_checklist_items`;
DROP TABLE IF EXISTS `duty_schedules`;

CREATE TABLE `duty_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `duty_date` DATE NOT NULL,
  `shift_name` VARCHAR(50) NOT NULL DEFAULT '06:55 - 07:15',
  `teacher_id` INT NOT NULL,
  `location` VARCHAR(100) NOT NULL DEFAULT 'Tòa nhà A',
  `status` ENUM('pending', 'completed') DEFAULT 'pending',
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `duty_checklist_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `step_number` TINYINT NOT NULL, -- 1 to 4
  `title` VARCHAR(255) NOT NULL,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` VARCHAR(255) NULL,
  FOREIGN KEY (`schedule_id`) REFERENCES `duty_schedules`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uniq_duty_step` (`schedule_id`, `step_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. LEAVE REQUESTS (ĐƠN XIN PHÉP)
CREATE TABLE `leave_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `student_id` INT NOT NULL,
  `request_type` ENUM('home', 'tutoring', 'medical', 'personal', 'other') NOT NULL,
  `reason` TEXT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `expected_end_time` DATETIME NOT NULL,
  `actual_return_time` DATETIME NULL,
  `parent_confirmation` TINYINT(1) NOT NULL DEFAULT 1,
  `contact_phone` VARCHAR(20) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'overdue', 'completed') NOT NULL DEFAULT 'pending',
  `approved_by_user_id` INT NULL,
  `approved_at` DATETIME NULL,
  `approval_notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  INDEX `idx_leave_status` (`status`),
  INDEX `idx_leave_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SCHOOL SETTINGS
DROP TABLE IF EXISTS `school_settings`;
CREATE TABLE `school_settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
