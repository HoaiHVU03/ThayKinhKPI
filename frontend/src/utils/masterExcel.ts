// frontend/src/utils/masterExcel.ts
// Utility for generating multi-sheet Master Excel template and parsing uploaded onboarding data for new schools

import * as XLSX from 'xlsx';

export interface ParsedMasterData {
  school_info: Record<string, any>;
  classes: any[];
  rooms: any[];
  students: any[];
  users: any[];
  kpi_rules: any[];
  regimes: any[];
  stats: {
    schoolName: string;
    totalClasses: number;
    totalRooms: number;
    totalStudents: number;
    boardingStudents: number;
    dayStudents: number;
    totalUsers: number;
    totalRules: number;
    totalRegimes: number;
  };
}

// 1. Download Master Template
export const downloadMasterTemplate = (
  mode: 'sample' | 'empty' | 'current',
  currentData?: any
) => {
  const wb = XLSX.utils.book_new();

  // ---------------- SHEET 1: Thông tin trường học ----------------
  const schoolRows =
    mode === 'current' && currentData?.school_info
      ? [
          { 'Thuộc tính cấu hình': 'Tên trường học', 'Giá trị': currentData.school_info.ten_truong || '', 'Mã cấu hình': 'ten_truong', 'Ghi chú / Hướng dẫn': 'Tên chính thức hiển thị trên toàn bộ website và báo cáo' },
          { 'Thuộc tính cấu hình': 'Mã trường', 'Giá trị': currentData.school_info.ma_truong || 'THPT-MOI', 'Mã cấu hình': 'ma_truong', 'Ghi chú / Hướng dẫn': 'Viết tắt để đánh số hiệu văn bản (VD: THPT-CVA, THPT-CHV)' },
          { 'Thuộc tính cấu hình': 'Tỉnh / Thành phố', 'Giá trị': currentData.school_info.tinh_thanh || '', 'Mã cấu hình': 'tinh_thanh', 'Ghi chú / Hướng dẫn': 'Tên tỉnh hoặc Sở GD&ĐT chủ quản' },
          { 'Thuộc tính cấu hình': 'Họ tên Hiệu trưởng', 'Giá trị': currentData.school_info.hieu_truong || '', 'Mã cấu hình': 'hieu_truong', 'Ghi chú / Hướng dẫn': 'Hiển thị trên phiếu KPI và báo cáo A4' },
          { 'Thuộc tính cấu hình': 'Họ tên các Hiệu phó', 'Giá trị': currentData.school_info.hieu_pho || '', 'Mã cấu hình': 'hieu_pho', 'Ghi chú / Hướng dẫn': 'Phân cách bằng dấu phẩy nếu có nhiều hiệu phó' },
          { 'Thuộc tính cấu hình': 'Trưởng ban Quản sinh KTX', 'Giá trị': currentData.school_info.truong_ban_quan_sinh || '', 'Mã cấu hình': 'truong_ban_quan_sinh', 'Ghi chú / Hướng dẫn': 'Người ký duyệt và điều hành nề nếp KTX' },
          { 'Thuộc tính cấu hình': 'Bí thư Đoàn trường', 'Giá trị': currentData.school_info.bi_thu_doan || '', 'Mã cấu hình': 'bi_thu_doan', 'Ghi chú / Hướng dẫn': 'Phụ trách công tác thi đua và thanh niên' },
          { 'Thuộc tính cấu hình': 'Địa chỉ trường', 'Giá trị': currentData.school_info.dia_chi || '', 'Mã cấu hình': 'dia_chi', 'Ghi chú / Hướng dẫn': 'Số nhà, đường, quận/huyện, tỉnh/thành' },
          { 'Thuộc tính cấu hình': 'Số điện thoại liên hệ', 'Giá trị': currentData.school_info.so_dien_thoai || '', 'Mã cấu hình': 'so_dien_thoai', 'Ghi chú / Hướng dẫn': 'Đường dây nóng của trường' },
          { 'Thuộc tính cấu hình': 'Email chính thức', 'Giá trị': currentData.school_info.email || '', 'Mã cấu hình': 'email', 'Ghi chú / Hướng dẫn': 'Email nhận thông báo hệ thống' },
          { 'Thuộc tính cấu hình': 'Website trường', 'Giá trị': currentData.school_info.website || '', 'Mã cấu hình': 'website', 'Ghi chú / Hướng dẫn': 'Trang web chính thức của trường' },
          { 'Thuộc tính cấu hình': 'Đường dẫn Logo trường', 'Giá trị': currentData.school_info.logo_url || '/logo.png', 'Mã cấu hình': 'logo_url', 'Ghi chú / Hướng dẫn': 'Link hình ảnh logo hoặc giữ /logo.png' },
          { 'Thuộc tính cấu hình': 'Niên khóa hiện hành', 'Giá trị': currentData.school_info.nien_khoa || '2026 - 2027', 'Mã cấu hình': 'nien_khoa', 'Ghi chú / Hướng dẫn': 'VD: 2026 - 2027' },
          { 'Thuộc tính cấu hình': 'Giờ điểm danh KTX sáng', 'Giá trị': currentData.school_info.gio_diem_danh_sang || '06:00', 'Mã cấu hình': 'gio_diem_danh_sang', 'Ghi chú / Hướng dẫn': 'Định dạng HH:mm (VD: 06:00)' },
          { 'Thuộc tính cấu hình': 'Giờ điểm danh KTX tối', 'Giá trị': currentData.school_info.gio_diem_danh_toi || '22:00', 'Mã cấu hình': 'gio_diem_danh_toi', 'Ghi chú / Hướng dẫn': 'Định dạng HH:mm (VD: 22:00)' },
          { 'Thuộc tính cấu hình': 'Giờ chốt báo cáo Zalo BGH', 'Giá trị': currentData.school_info.gio_bao_cao_zalo || '22:15', 'Mã cấu hình': 'gio_bao_cao_zalo', 'Ghi chú / Hướng dẫn': 'Định dạng HH:mm (VD: 22:15)' },
        ]
      : [
          { 'Thuộc tính cấu hình': 'Tên trường học', 'Giá trị': mode === 'empty' ? '' : 'Trường THPT Chu Văn An', 'Mã cấu hình': 'ten_truong', 'Ghi chú / Hướng dẫn': 'Tên chính thức hiển thị trên toàn bộ website và báo cáo' },
          { 'Thuộc tính cấu hình': 'Mã trường', 'Giá trị': mode === 'empty' ? '' : 'THPT-CVA', 'Mã cấu hình': 'ma_truong', 'Ghi chú / Hướng dẫn': 'Viết tắt để đánh số hiệu văn bản (VD: THPT-CVA)' },
          { 'Thuộc tính cấu hình': 'Tỉnh / Thành phố', 'Giá trị': mode === 'empty' ? '' : 'Hà Nội', 'Mã cấu hình': 'tinh_thanh', 'Ghi chú / Hướng dẫn': 'Tên tỉnh hoặc Sở GD&ĐT chủ quản' },
          { 'Thuộc tính cấu hình': 'Họ tên Hiệu trưởng', 'Giá trị': mode === 'empty' ? '' : 'ĐÀO MẠNH THẮNG', 'Mã cấu hình': 'hieu_truong', 'Ghi chú / Hướng dẫn': 'Hiển thị trên phiếu KPI và báo cáo A4' },
          { 'Thuộc tính cấu hình': 'Họ tên các Hiệu phó', 'Giá trị': mode === 'empty' ? '' : 'Cô Trần Thị B, Thầy Lê Văn C', 'Mã cấu hình': 'hieu_pho', 'Ghi chú / Hướng dẫn': 'Phân cách bằng dấu phẩy nếu có nhiều hiệu phó' },
          { 'Thuộc tính cấu hình': 'Trưởng ban Quản sinh KTX', 'Giá trị': mode === 'empty' ? '' : 'Thầy Đỗ Văn D', 'Mã cấu hình': 'truong_ban_quan_sinh', 'Ghi chú / Hướng dẫn': 'Người ký duyệt và điều hành nề nếp KTX' },
          { 'Thuộc tính cấu hình': 'Bí thư Đoàn trường', 'Giá trị': mode === 'empty' ? '' : 'Cô Phạm Thị E', 'Mã cấu hình': 'bi_thu_doan', 'Ghi chú / Hướng dẫn': 'Phụ trách công tác thi đua và thanh niên' },
          { 'Thuộc tính cấu hình': 'Địa chỉ trường', 'Giá trị': mode === 'empty' ? '' : 'Số 10 Thụy Khuê, Tây Hồ, Hà Nội', 'Mã cấu hình': 'dia_chi', 'Ghi chú / Hướng dẫn': 'Số nhà, đường, quận/huyện, tỉnh/thành' },
          { 'Thuộc tính cấu hình': 'Số điện thoại liên hệ', 'Giá trị': mode === 'empty' ? '' : '024 3823 3140', 'Mã cấu hình': 'so_dien_thoai', 'Ghi chú / Hướng dẫn': 'Đường dây nóng của trường' },
          { 'Thuộc tính cấu hình': 'Email chính thức', 'Giá trị': mode === 'empty' ? '' : 'c3chuvanan@hanoiedu.vn', 'Mã cấu hình': 'email', 'Ghi chú / Hướng dẫn': 'Email nhận thông báo hệ thống' },
          { 'Thuộc tính cấu hình': 'Website trường', 'Giá trị': mode === 'empty' ? '' : 'thptchuvanan.edu.vn', 'Mã cấu hình': 'website', 'Ghi chú / Hướng dẫn': 'Trang web chính thức của trường' },
          { 'Thuộc tính cấu hình': 'Đường dẫn Logo trường', 'Giá trị': '/logo.png', 'Mã cấu hình': 'logo_url', 'Ghi chú / Hướng dẫn': 'Link hình ảnh logo hoặc giữ /logo.png' },
          { 'Thuộc tính cấu hình': 'Niên khóa hiện hành', 'Giá trị': '2026 - 2027', 'Mã cấu hình': 'nien_khoa', 'Ghi chú / Hướng dẫn': 'VD: 2026 - 2027' },
          { 'Thuộc tính cấu hình': 'Giờ điểm danh KTX sáng', 'Giá trị': '06:00', 'Mã cấu hình': 'gio_diem_danh_sang', 'Ghi chú / Hướng dẫn': 'Định dạng HH:mm (VD: 06:00)' },
          { 'Thuộc tính cấu hình': 'Giờ điểm danh KTX tối', 'Giá trị': '22:00', 'Mã cấu hình': 'gio_diem_danh_toi', 'Ghi chú / Hướng dẫn': 'Định dạng HH:mm (VD: 22:00)' },
          { 'Thuộc tính cấu hình': 'Giờ chốt báo cáo Zalo BGH', 'Giá trị': '22:15', 'Mã cấu hình': 'gio_bao_cao_zalo', 'Ghi chú / Hướng dẫn': 'Định dạng HH:mm (VD: 22:15)' },
        ];
  const wsSchool = XLSX.utils.json_to_sheet(schoolRows);
  wsSchool['!cols'] = [{ wch: 28 }, { wch: 38 }, { wch: 22 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsSchool, '1_ThongTinTruong');

  // ---------------- SHEET 2: Danh sách lớp học ----------------
  let classRows: any[] = [];
  if (mode === 'current' && currentData?.classes) {
    classRows = currentData.classes.map((c: any) => ({
      'Mã lớp': c.ma_lop,
      'Tên lớp': c.ten_lop,
      'Khối': c.khoi,
      'Giáo viên chủ nhiệm': c.giao_vien_chu_nhiem,
      'Số điện thoại GVCN': c.sdt_gvcn,
      'Phòng học': c.phong_hoc,
    }));
  } else if (mode === 'sample') {
    classRows = [
      { 'Mã lớp': '10TOAN1', 'Tên lớp': '10 Chuyên Toán 1', 'Khối': 10, 'Giáo viên chủ nhiệm': 'Thầy Nguyễn Văn Kính', 'Số điện thoại GVCN': '0912345678', 'Phòng học': 'Phòng A101' },
      { 'Mã lớp': '10TIN', 'Tên lớp': '10 Chuyên Tin học', 'Khối': 10, 'Giáo viên chủ nhiệm': 'Cô Trần Thị Mai', 'Số điện thoại GVCN': '0988776655', 'Phòng học': 'Phòng A102' },
      { 'Mã lớp': '10LY1', 'Tên lớp': '10 Chuyên Vật lý 1', 'Khối': 10, 'Giáo viên chủ nhiệm': 'Thầy Lê Hoàng Nam', 'Số điện thoại GVCN': '0977889900', 'Phòng học': 'Phòng A103' },
      { 'Mã lớp': '11TOAN1', 'Tên lớp': '11 Chuyên Toán 1', 'Khối': 11, 'Giáo viên chủ nhiệm': 'Thầy Vũ Quốc Bảo', 'Số điện thoại GVCN': '0966554433', 'Phòng học': 'Phòng A201' },
      { 'Mã lớp': '12TOAN1', 'Tên lớp': '12 Chuyên Toán 1', 'Khối': 12, 'Giáo viên chủ nhiệm': 'Cô Đặng Thảo Linh', 'Số điện thoại GVCN': '0933221100', 'Phòng học': 'Phòng A301' },
    ];
  } else {
    classRows = [
      { 'Mã lớp': '10A1', 'Tên lớp': '10A1', 'Khối': 10, 'Giáo viên chủ nhiệm': '', 'Số điện thoại GVCN': '', 'Phòng học': '' },
    ];
  }
  const wsClasses = XLSX.utils.json_to_sheet(classRows);
  wsClasses['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 10 }, { wch: 26 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsClasses, '2_DanhSachLop');

  // ---------------- SHEET 3: Phòng KTX ----------------
  let roomRows: any[] = [];
  if (mode === 'current' && currentData?.rooms) {
    roomRows = currentData.rooms.map((r: any) => ({
      'Số phòng': r.so_phong,
      'Tầng': r.tang,
      'Loại phòng': r.loai_phong,
      'Sức chứa giường': r.suc_chua,
    }));
  } else if (mode === 'sample') {
    roomRows = [
      { 'Số phòng': 'P201', 'Tầng': 2, 'Loại phòng': 'Nam', 'Sức chứa giường': 6 },
      { 'Số phòng': 'P202', 'Tầng': 2, 'Loại phòng': 'Nam', 'Sức chứa giường': 6 },
      { 'Số phòng': 'P301', 'Tầng': 3, 'Loại phòng': 'Nam', 'Sức chứa giường': 6 },
      { 'Số phòng': 'P501', 'Tầng': 5, 'Loại phòng': 'Nữ', 'Sức chứa giường': 6 },
      { 'Số phòng': 'P502', 'Tầng': 5, 'Loại phòng': 'Nữ', 'Sức chứa giường': 6 },
      { 'Số phòng': 'P601', 'Tầng': 6, 'Loại phòng': 'Nữ', 'Sức chứa giường': 6 },
    ];
  } else {
    roomRows = [
      { 'Số phòng': 'P201', 'Tầng': 2, 'Loại phòng': 'Nam', 'Sức chứa giường': 6 },
    ];
  }
  const wsRooms = XLSX.utils.json_to_sheet(roomRows);
  wsRooms['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsRooms, '3_PhongKTX');

  // ---------------- SHEET 4: Danh sách học sinh ----------------
  let studentRows: any[] = [];
  if (mode === 'current' && currentData?.students) {
    studentRows = currentData.students.map((s: any) => ({
      'Mã học sinh': s.ma_hoc_sinh,
      'Họ và tên': s.ho_va_ten,
      'Ngày sinh': s.ngay_sinh,
      'Giới tính': s.gioi_tinh,
      'Mã lớp': s.ma_lop,
      'Loại cư trú': s.loai_cu_tru,
      'Phòng KTX': s.phong_ktx,
      'Họ tên phụ huynh': s.ho_ten_phu_huynh,
      'Số điện thoại phụ huynh': s.sdt_phu_huynh,
      'Số CCCD / Định danh': s.cccd_dinh_danh,
      'Địa chỉ thường trú': s.dia_chi_thuong_tru,
    }));
  } else if (mode === 'sample') {
    studentRows = [
      { 'Mã học sinh': 'HS0001', 'Họ và tên': 'Nguyễn Văn An', 'Ngày sinh': '2009-03-15', 'Giới tính': 'Nam', 'Mã lớp': '10TOAN1', 'Loại cư trú': 'Nội trú', 'Phòng KTX': 'P201', 'Họ tên phụ huynh': 'Nguyễn Văn Ba', 'Số điện thoại phụ huynh': '0988111222', 'Số CCCD / Định danh': '025209001234', 'Địa chỉ thường trú': 'TP. Việt Trì, Phú Thọ' },
      { 'Mã học sinh': 'HS0002', 'Họ và tên': 'Trần Thị Bình', 'Ngày sinh': '2009-07-20', 'Giới tính': 'Nữ', 'Mã lớp': '10TOAN1', 'Loại cư trú': 'Ngoại trú', 'Phòng KTX': '', 'Họ tên phụ huynh': 'Trần Văn Chung', 'Số điện thoại phụ huynh': '0977222333', 'Số CCCD / Định danh': '025309005678', 'Địa chỉ thường trú': 'H. Lâm Thao, Phú Thọ' },
      { 'Mã học sinh': 'HS0003', 'Họ và tên': 'Lê Quang Cường', 'Ngày sinh': '2009-11-05', 'Giới tính': 'Nam', 'Mã lớp': '10TOAN1', 'Loại cư trú': 'Nội trú', 'Phòng KTX': 'P201', 'Họ tên phụ huynh': 'Lê Văn Dũng', 'Số điện thoại phụ huynh': '0966333444', 'Số CCCD / Định danh': '025209009876', 'Địa chỉ thường trú': 'TX. Phú Thọ, Phú Thọ' },
      { 'Mã học sinh': 'HS0004', 'Họ và tên': 'Phạm Thảo My', 'Ngày sinh': '2009-05-12', 'Giới tính': 'Nữ', 'Mã lớp': '10TIN', 'Loại cư trú': 'Nội trú', 'Phòng KTX': 'P501', 'Họ tên phụ huynh': 'Phạm Văn Nam', 'Số điện thoại phụ huynh': '0911555666', 'Số CCCD / Định danh': '025309004321', 'Địa chỉ thường trú': 'H. Phù Ninh, Phú Thọ' },
    ];
  } else {
    studentRows = [
      { 'Mã học sinh': 'HS0001', 'Họ và tên': '', 'Ngày sinh': 'YYYY-MM-DD', 'Giới tính': 'Nam/Nữ', 'Mã lớp': '', 'Loại cư trú': 'Nội trú/Ngoại trú', 'Phòng KTX': '', 'Họ tên phụ huynh': '', 'Số điện thoại phụ huynh': '', 'Số CCCD / Định danh': '', 'Địa chỉ thường trú': '' },
    ];
  }
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  wsStudents['!cols'] = [
    { wch: 14 }, { wch: 24 }, { wch: 14 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 22 },
    { wch: 22 }, { wch: 22 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, '4_HocSinh');

  // ---------------- SHEET 5: Tài khoản người dùng ----------------
  let userRows: any[] = [];
  if (mode === 'current' && currentData?.users) {
    userRows = currentData.users.map((u: any) => ({
      'Tên đăng nhập': u.ten_dang_nhap,
      'Mật khẩu khởi tạo': 'password123',
      'Họ và tên': u.ho_va_ten,
      'Vai trò': u.vai_tro,
      'Loại phạm vi': u.loai_pham_vi,
      'Phạm vi quản lý': u.pham_vi_quan_ly,
    }));
  } else if (mode === 'sample') {
    userRows = [
      { 'Tên đăng nhập': 'admin', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Ban Giám Hiệu / Quản trị viên', 'Vai trò': 'admin', 'Loại phạm vi': '', 'Phạm vi quản lý': '' },
      { 'Tên đăng nhập': 'quan_sinh', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Thầy Đỗ Văn Thắng (Quản sinh)', 'Vai trò': 'dorm_manager', 'Loại phạm vi': '', 'Phạm vi quản lý': '' },
      { 'Tên đăng nhập': 'truong_tang_2', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Lê Hoàng Nam (Trưởng tầng 2)', 'Vai trò': 'floor_leader', 'Loại phạm vi': 'floor', 'Phạm vi quản lý': '2' },
      { 'Tên đăng nhập': 'tp_p201', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Trần Hữu Long (Trưởng phòng 201)', 'Vai trò': 'room_leader', 'Loại phạm vi': 'room', 'Phạm vi quản lý': 'P201' },
      { 'Tên đăng nhập': 'gvcn_10toan1', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Thầy Nguyễn Văn Kính (GVCN 10 Toán 1)', 'Vai trò': 'homeroom_teacher', 'Loại phạm vi': 'class', 'Phạm vi quản lý': '10TOAN1' },
      { 'Tên đăng nhập': 'chi_doan', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Cô Trần Thị Mai (Đoàn trường)', 'Vai trò': 'youth_union', 'Loại phạm vi': '', 'Phạm vi quản lý': '' },
    ];
  } else {
    userRows = [
      { 'Tên đăng nhập': 'admin', 'Mật khẩu khởi tạo': 'password123', 'Họ và tên': 'Quản trị viên', 'Vai trò': 'admin', 'Loại phạm vi': '', 'Phạm vi quản lý': '' },
    ];
  }
  const wsUsers = XLSX.utils.json_to_sheet(userRows);
  wsUsers['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 20 }, { wch: 16 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsUsers, '5_TaiKhoanNguoiDung');

  // ---------------- SHEET 6: 10 Tiêu chí KPI ----------------
  const kpiRows =
    mode === 'current' && currentData?.kpi_rules
      ? currentData.kpi_rules.map((r: any) => ({
          'Mã lỗi': r.ma_loi,
          'Tên quy định / lỗi vi phạm': r.ten_loi,
          'Điểm trừ': r.diem_tru,
          'Mô tả chi tiết': r.mo_ta,
          'Nhóm lỗi': r.nhom_loi,
        }))
      : [
          { 'Mã lỗi': 'L01', 'Tên quy định / lỗi vi phạm': 'Đi học muộn sau 07h00', 'Điểm trừ': 1, 'Mô tả chi tiết': 'Đến lớp sau hiệu lệnh trống/chuông 07h00 sáng', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L02', 'Tên quy định / lỗi vi phạm': 'Sai đồng phục hoặc không đeo thẻ', 'Điểm trừ': 3, 'Mô tả chi tiết': 'Không mặc đúng đồng phục quy định hoặc quên thẻ học sinh', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L03', 'Tên quy định / lỗi vi phạm': 'Để xe sai vị trí quy định', 'Điểm trừ': 3, 'Mô tả chi tiết': 'Xếp xe lộn xộn, không đúng khu vực phân công nhà xe', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L04', 'Tên quy định / lỗi vi phạm': 'Ăn quà vặt trong lớp học', 'Điểm trừ': 3, 'Mô tả chi tiết': 'Mang đồ ăn, thức uống ngoài nước lọc vào lớp, xả rác', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L05', 'Tên quy định / lỗi vi phạm': 'Sử dụng điện thoại trái phép', 'Điểm trừ': 5, 'Mô tả chi tiết': 'Dùng điện thoại ngoài mục đích học tập trong giờ học hoặc truy bài', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L06', 'Tên quy định / lỗi vi phạm': 'Không tắt thiết bị khi được yêu cầu', 'Điểm trừ': 5, 'Mô tả chi tiết': 'Không tắt quạt, điện, máy chiếu khi ra khỏi phòng học', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L07', 'Tên quy định / lỗi vi phạm': 'Vi phạm nền nếp nội vụ KTX', 'Điểm trừ': 3, 'Mô tả chi tiết': 'Gấp chăn màn cẩu thả, phòng bừa bộn, không vệ sinh KTX', 'Nhóm lỗi': 'kỷ_luật_ktx' },
          { 'Mã lỗi': 'L08', 'Tên quy định / lỗi vi phạm': 'Mất trật tự, vi phạm văn hóa ứng xử', 'Điểm trừ': 3, 'Mô tả chi tiết': 'Gây ồn ào giờ tự học tối, nói tục, cư xử thiếu văn hóa', 'Nhóm lỗi': 'nề_nếp_học_đường' },
          { 'Mã lỗi': 'L09', 'Tên quy định / lỗi vi phạm': 'Gian lận thi cử hoặc lạm dụng AI', 'Điểm trừ': 10, 'Mô tả chi tiết': 'Quay cóp bài kiểm tra, copy văn mẫu AI nộp bài trái phép', 'Nhóm lỗi': 'học_tập' },
          { 'Mã lỗi': 'L10', 'Tên quy định / lỗi vi phạm': 'Hành vi đặc biệt nghiêm trọng', 'Điểm trừ': 20, 'Mô tả chi tiết': 'Đánh nhau, phá hoại tài sản công, vi phạm pháp luật quy chế', 'Nhóm lỗi': 'đặc_biệt' },
        ];
  const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
  wsKpi['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 12 }, { wch: 45 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsKpi, '6_TieuChiKPI');

  // ---------------- SHEET 7: 11 Chế độ sinh hoạt KTX ----------------
  const regimeRows =
    mode === 'current' && currentData?.regimes
      ? currentData.regimes.map((r: any) => ({
          'Thứ tự': r.thu_tu,
          'Giờ bắt đầu': r.gio_bat_dau,
          'Giờ kết thúc': r.gio_ket_thuc,
          'Tên chế độ sinh hoạt': r.ten_che_do,
          'Mô tả công việc': r.mo_ta,
          'Bộ phận phụ trách': r.bo_phan_phu_trach,
        }))
      : [
          { 'Thứ tự': 1, 'Giờ bắt đầu': '05:15', 'Giờ kết thúc': '05:30', 'Tên chế độ sinh hoạt': 'Báo thức', 'Mô tả công việc': 'Chuông báo thức toàn KTX, học sinh thức dậy chuẩn bị', 'Bộ phận phụ trách': 'Ban Quản sinh' },
          { 'Thứ tự': 2, 'Giờ bắt đầu': '05:30', 'Giờ kết thúc': '06:00', 'Tên chế độ sinh hoạt': 'Thể dục sáng', 'Mô tả công việc': 'Tập thể dục sân KTX nâng cao thể lực', 'Bộ phận phụ trách': 'Ban Tự quản KTX' },
          { 'Thứ tự': 3, 'Giờ bắt đầu': '06:00', 'Giờ kết thúc': '06:30', 'Tên chế độ sinh hoạt': 'Gấp chăn màn, chỉnh trang nội vụ', 'Mô tả công việc': 'Vệ sinh phòng, gấp chăn vuông vắn, xếp đồ dùng', 'Bộ phận phụ trách': 'Trưởng phòng KTX' },
          { 'Thứ tự': 4, 'Giờ bắt đầu': '06:30', 'Giờ kết thúc': '07:15', 'Tên chế độ sinh hoạt': 'Ăn sáng', 'Mô tả công việc': 'Ăn sáng tại nhà ăn trường', 'Bộ phận phụ trách': 'Ban Quản sinh' },
          { 'Thứ tự': 5, 'Giờ bắt đầu': '07:15', 'Giờ kết thúc': '07:30', 'Tên chế độ sinh hoạt': 'Niêm phong KTX', 'Mô tả công việc': 'Khóa các phòng KTX, niêm phong cửa tầng', 'Bộ phận phụ trách': 'Ban Quản sinh & Bảo vệ' },
          { 'Thứ tự': 6, 'Giờ bắt đầu': '07:30', 'Giờ kết thúc': '11:30', 'Tên chế độ sinh hoạt': 'Học chính khóa tại giảng đường', 'Mô tả công việc': 'Học tập các môn chính khóa và chuyên sâu', 'Bộ phận phụ trách': 'GVCN & Trực ban' },
          { 'Thứ tự': 7, 'Giờ bắt đầu': '11:45', 'Giờ kết thúc': '13:30', 'Tên chế độ sinh hoạt': 'Ăn trưa và nghỉ trưa', 'Mô tả công việc': 'Nghỉ trưa giữ yên tĩnh tại các phòng nội trú', 'Bộ phận phụ trách': 'Trưởng tầng & Quản sinh' },
          { 'Thứ tự': 8, 'Giờ bắt đầu': '16:30', 'Giờ kết thúc': '17:45', 'Tên chế độ sinh hoạt': 'Thể thao chiều', 'Mô tả công việc': 'Hoạt động thể chất bóng rổ, cầu lông, bóng bàn', 'Bộ phận phụ trách': 'Đoàn Thanh niên' },
          { 'Thứ tự': 9, 'Giờ bắt đầu': '18:00', 'Giờ kết thúc': '18:15', 'Tên chế độ sinh hoạt': 'Chốt cổng trường KTX', 'Mô tả công việc': 'Kiểm soát học sinh nội trú trở về KTX', 'Bộ phận phụ trách': 'Bảo vệ & Quản sinh' },
          { 'Thứ tự': 10, 'Giờ bắt đầu': '19:30', 'Giờ kết thúc': '21:45', 'Tên chế độ sinh hoạt': 'Tự học tối', 'Mô tả công việc': 'Tự học tại phòng học hoặc phòng tự học KTX', 'Bộ phận phụ trách': 'Trưởng tầng & Trưởng phòng' },
          { 'Thứ tự': 11, 'Giờ bắt đầu': '22:00', 'Giờ kết thúc': '22:30', 'Tên chế độ sinh hoạt': 'Điểm danh tối & Tắt đèn', 'Mô tả công việc': 'Điểm danh quân số, tắt đèn ngủ lúc 22h30', 'Bộ phận phụ trách': 'Trưởng phòng & Quản sinh' },
        ];
  const wsRegimes = XLSX.utils.json_to_sheet(regimeRows);
  wsRegimes['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 32 }, { wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsRegimes, '7_CheDoSinhHoat');

  // Generate file name
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName =
    mode === 'current'
      ? `Sao_Luu_Toan_Bo_Du_Lieu_${dateStr}.xlsx`
      : mode === 'sample'
      ? `Mau_Du_Lieu_Khoi_Tao_Truong_Hoc_Mau_${dateStr}.xlsx`
      : `Mau_Du_Lieu_Khoi_Tao_Truong_Hoc_Trang_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

// 2. Parse Master Excel File Uploaded by User
export const parseMasterExcelFile = (file: File): Promise<ParsedMasterData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'binary' });

        // Helper to find sheet by name substring or index
        const findSheet = (pattern: RegExp, fallbackIndex: number) => {
          const foundName = wb.SheetNames.find((name) => pattern.test(name));
          if (foundName) return wb.Sheets[foundName];
          return wb.Sheets[wb.SheetNames[fallbackIndex]];
        };

        // 1. School Info Sheet
        const sheetSchool = findSheet(/ThongTin|School/i, 0);
        const rawSchool = sheetSchool ? XLSX.utils.sheet_to_json<any>(sheetSchool) : [];
        const schoolInfo: Record<string, any> = {};

        rawSchool.forEach((row: any) => {
          const key = row['Mã cấu hình'] || row['Mã'] || row['Key'] || row['Thuộc tính cấu hình'] || '';
          const val = row['Giá trị'] ?? row['Value'] ?? '';
          if (key && val !== undefined) {
            schoolInfo[String(key).trim()] = String(val).trim();
          }
        });

        // 2. Classes Sheet
        const sheetClasses = findSheet(/Lop|Class/i, 1);
        const rawClasses = sheetClasses ? XLSX.utils.sheet_to_json<any>(sheetClasses) : [];
        const classes = rawClasses.map((row: any) => ({
          code: String(row['Mã lớp'] || row['ma_lop'] || row['Code'] || '').trim(),
          name: String(row['Tên lớp'] || row['ten_lop'] || row['Name'] || '').trim(),
          grade_level: parseInt(row['Khối'] || row['khoi'] || row['Grade'] || '10', 10),
          homeroom_teacher: String(row['Giáo viên chủ nhiệm'] || row['giao_vien_chu_nhiem'] || row['GVCN'] || '').trim(),
          teacher_phone: String(row['Số điện thoại GVCN'] || row['sdt_gvcn'] || '').trim(),
          room_location: String(row['Phòng học'] || row['phong_hoc'] || '').trim(),
        })).filter((c) => c.code !== '');

        // 3. Rooms Sheet
        const sheetRooms = findSheet(/Phong|Room|KTX/i, 2);
        const rawRooms = sheetRooms ? XLSX.utils.sheet_to_json<any>(sheetRooms) : [];
        const rooms = rawRooms.map((row: any) => ({
          code: String(row['Số phòng'] || row['so_phong'] || row['Room'] || '').trim(),
          floor_number: parseInt(row['Tầng'] || row['tang'] || row['Floor'] || '2', 10),
          gender: String(row['Loại phòng'] || row['loai_phong'] || row['Gender'] || 'Nam').trim(),
          capacity: parseInt(row['Sức chứa giường'] || row['suc_chua'] || row['Capacity'] || '6', 10),
        })).filter((r) => r.code !== '');

        // 4. Students Sheet
        const sheetStudents = findSheet(/HocSinh|Student/i, 3);
        const rawStudents = sheetStudents ? XLSX.utils.sheet_to_json<any>(sheetStudents) : [];
        let boardingCount = 0;
        let dayCount = 0;

        const students = rawStudents.map((row: any) => {
          const resType = String(row['Loại cư trú'] || row['loai_cu_tru'] || row['is_boarding'] || '').trim();
          const roomCode = String(row['Phòng KTX'] || row['phong_ktx'] || row['Số phòng'] || '').trim();
          const isBoarding = roomCode !== '' || stripos(resType, 'nội') || resType === '1' || resType === 'true';

          if (isBoarding) boardingCount++;
          else dayCount++;

          return {
            code: String(row['Mã học sinh'] || row['ma_hoc_sinh'] || row['Code'] || '').trim(),
            full_name: String(row['Họ và tên'] || row['ho_va_ten'] || row['Họ tên'] || row['Name'] || '').trim(),
            dob: String(row['Ngày sinh'] || row['ngay_sinh'] || row['DOB'] || '2009-01-01').trim(),
            gender: String(row['Giới tính'] || row['gioi_tinh'] || 'Nam').trim(),
            class_code: String(row['Mã lớp'] || row['ma_lop'] || row['Lớp'] || '').trim(),
            is_boarding: isBoarding ? 1 : 0,
            room_code: roomCode,
            parent_name: String(row['Họ tên phụ huynh'] || row['ho_ten_phu_huynh'] || '').trim(),
            parent_phone: String(row['Số điện thoại phụ huynh'] || row['sdt_phu_huynh'] || '').trim(),
            id_card_number: String(row['Số CCCD / Định danh'] || row['cccd_dinh_danh'] || '').trim(),
            hometown: String(row['Địa chỉ thường trú'] || row['dia_chi_thuong_tru'] || row['Địa chỉ'] || '').trim(),
          };
        }).filter((s) => s.code !== '' && s.full_name !== '');

        // 5. Users Sheet
        const sheetUsers = findSheet(/TaiKhoan|User/i, 4);
        const rawUsers = sheetUsers ? XLSX.utils.sheet_to_json<any>(sheetUsers) : [];
        const users = rawUsers.map((row: any) => ({
          username: String(row['Tên đăng nhập'] || row['ten_dang_nhap'] || row['Username'] || '').trim(),
          password: String(row['Mật khẩu khởi tạo'] || row['mat_khau'] || row['Password'] || 'password123').trim(),
          full_name: String(row['Họ và tên'] || row['ho_va_ten'] || row['Name'] || '').trim(),
          role: String(row['Vai trò'] || row['vai_tro'] || row['Role'] || 'homeroom_teacher').trim(),
          scope_type: String(row['Loại phạm vi'] || row['loai_pham_vi'] || '').trim(),
          scope_code: String(row['Phạm vi quản lý'] || row['pham_vi_quan_ly'] || '').trim(),
        })).filter((u) => u.username !== '');

        // 6. KPI Rules Sheet
        const sheetKpi = findSheet(/KPI|Rule|TieuChi/i, 5);
        const rawKpi = sheetKpi ? XLSX.utils.sheet_to_json<any>(sheetKpi) : [];
        const kpi_rules = rawKpi.map((row: any) => ({
          code: String(row['Mã lỗi'] || row['ma_loi'] || '').trim(),
          name: String(row['Tên quy định / lỗi vi phạm'] || row['ten_loi'] || '').trim(),
          deduction_points: parseInt(row['Điểm trừ'] || row['diem_tru'] || '1', 10),
          description: String(row['Mô tả chi tiết'] || row['mo_ta'] || '').trim(),
          category: String(row['Nhóm lỗi'] || row['nhom_loi'] || 'nề_nếp').trim(),
        })).filter((r) => r.code !== '');

        // 7. Regimes Sheet
        const sheetRegimes = findSheet(/CheDo|Regime|SinhHoat/i, 6);
        const rawRegimes = sheetRegimes ? XLSX.utils.sheet_to_json<any>(sheetRegimes) : [];
        const regimes = rawRegimes.map((row: any) => ({
          order_num: parseInt(row['Thứ tự'] || row['thu_tu'] || '1', 10),
          time_start: String(row['Giờ bắt đầu'] || row['gio_bat_dau'] || '').trim(),
          time_end: String(row['Giờ kết thúc'] || row['gio_ket_thuc'] || '').trim(),
          name: String(row['Tên chế độ sinh hoạt'] || row['ten_che_do'] || '').trim(),
          description: String(row['Mô tả công việc'] || row['mo_ta'] || '').trim(),
          responsible_role: String(row['Bộ phận phụ trách'] || row['bo_phan_phu_trach'] || 'Ban Quản sinh').trim(),
        })).filter((r) => r.name !== '');

        const schoolName =
          schoolInfo['ten_truong'] ||
          schoolInfo['school_name'] ||
          schoolInfo['Tên trường học'] ||
          'Trường học mới';

        resolve({
          school_info: schoolInfo,
          classes,
          rooms,
          students,
          users,
          kpi_rules,
          regimes,
          stats: {
            schoolName,
            totalClasses: classes.length,
            totalRooms: rooms.length,
            totalStudents: students.length,
            boardingStudents: boardingCount,
            dayStudents: dayCount,
            totalUsers: users.length,
            totalRules: kpi_rules.length,
            totalRegimes: regimes.length,
          },
        });
      } catch (err: any) {
        reject(new Error('Lỗi khi đọc file Excel: ' + (err.message || 'File không đúng định dạng')));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file đã chọn'));
    reader.readAsBinaryString(file);
  });
};

function stripos(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
}
