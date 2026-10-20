// scripts/test_rbac_matrix.mjs
const BASE_URL = 'http://127.0.0.1:8299/api';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${username}: ${data.message}`);
  return { token: data.data.token, user: data.data.user };
}

async function apiGet(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function apiPost(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('BẮT ĐẦU KIỂM TRA PHÂN QUYỀN RBAC & CÔ LẬP PHẠM VI DỮ LIỆU');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. ADMIN (BGH / Quản trị)
  console.log('1. KIỂM TRA TÀI KHOẢN ADMIN (BGH & QUẢN TRỊ VIÊN TỐI CAO):');
  const admin = await login('admin', 'password123');
  assert(admin.user.role === 'admin', 'Admin đăng nhập thành công với vai trò admin');
  
  const adminUsers = await apiGet('/admin/users', admin.token);
  assert(adminUsers.ok && adminUsers.data.data.length >= 70, `Admin truy cập được danh sách quản trị tài khoản (${adminUsers.data.data?.length} users)`);
  
  const adminClasses = await apiGet('/classes', admin.token);
  assert(adminClasses.ok && adminClasses.data.data.length === 54, `Admin thấy đầy đủ 54 lớp học (${adminClasses.data.data?.length} lớp)`);
  
  const adminRooms = await apiGet('/dormitory/rooms', admin.token);
  assert(adminRooms.ok && adminRooms.data.data.length === 120, `Admin thấy đầy đủ 120 phòng KTX (${adminRooms.data.data?.length} phòng)`);

  const adminStudents = await apiGet('/students', admin.token);
  assert(adminStudents.ok && adminStudents.data.data.total >= 1800, `Admin quản lý toàn bộ học sinh trường (${adminStudents.data.data.total} HS)`);

  // 2. GVCN (Giáo viên chủ nhiệm 10 Chuyên Toán 1 - Class ID 1)
  console.log('\n2. KIỂM TRA TÀI KHOẢN GIÁO VIÊN CHỦ NHIỆM (gvcn_10ton1 - Lớp 10 Chuyên Toán 1):');
  const gvcn = await login('gvcn_10ton1', 'password123');
  assert(gvcn.user.role === 'homeroom_teacher', 'GVCN đăng nhập thành công với vai trò homeroom_teacher');
  assert(gvcn.user.scopes[0].scope_type === 'class' && gvcn.user.scopes[0].scope_id === 1, `GVCN có scope class = 1 (${gvcn.user.scopes[0].scope_name})`);

  // Phải bị cấm vào route admin
  const gvcnAdmin = await apiGet('/admin/users', gvcn.token);
  assert(gvcnAdmin.status === 403, 'GVCN bị CHẶN (403 Forbidden) khi cố truy cập quản trị hệ thống');

  // Phải bị cấm chuyển niên khóa
  const gvcnAcademic = await apiGet('/academic-year/preview', gvcn.token);
  assert(gvcnAcademic.status === 403, 'GVCN bị CHẶN (403 Forbidden) khi cố truy cập chuyển niên khóa');

  // Danh sách lớp chỉ thấy đúng lớp mình
  const gvcnClasses = await apiGet('/classes', gvcn.token);
  assert(gvcnClasses.ok && gvcnClasses.data.data.length === 1 && gvcnClasses.data.data[0].id === 1, `GVCN chỉ thấy DUY NHẤT 1 lớp mình chủ nhiệm: ${gvcnClasses.data.data[0]?.name}`);

  // Thử xem thông tin lớp khác (lớp 2 - 10 Tin) -> phải 403
  const gvcnOtherClass = await apiGet('/classes/2', gvcn.token);
  assert(gvcnOtherClass.status === 403, 'GVCN bị CHẶN (403 Forbidden) khi cố xem chi tiết lớp khác (Lớp ID 2)');

  // Danh sách học sinh chỉ thấy học sinh lớp mình
  const gvcnStudents = await apiGet('/students', gvcn.token);
  const allInClass1 = gvcnStudents.data.data.items.every(s => s.class_id === 1);
  assert(gvcnStudents.ok && allInClass1 && gvcnStudents.data.data.total > 0, `GVCN chỉ thấy ${gvcnStudents.data.data.total} học sinh thuộc lớp 10 Chuyên Toán 1, không thấy lớp khác`);

  // Thử xem học sinh của lớp khác -> phải 403
  // Find a student in class 2
  const otherStudent = adminStudents.data.data.items.find(s => s.class_id !== 1);
  if (otherStudent) {
    const gvcnOtherStudent = await apiGet(`/students/${otherStudent.id}`, gvcn.token);
    assert(gvcnOtherStudent.status === 403, `GVCN bị CHẶN (403 Forbidden) khi cố xem học sinh ${otherStudent.full_name} của lớp khác`);
  }

  // GVCN không được điểm danh KTX
  const gvcnRollCall = await apiPost('/dormitory/attendance/mark-all-present', { room_id: 1 }, gvcn.token);
  assert(gvcnRollCall.status === 403, 'GVCN bị CHẶN (403 Forbidden) khi cố điểm danh KTX');

  // 3. TRƯỞNG PHÒNG KTX (tp_p201 - Phòng 201, Tầng 2)
  console.log('\n3. KIỂM TRA TÀI KHOẢN TRƯỞNG PHÒNG KTX (tp_p201 - Phòng P201):');
  const tp = await login('tp_p201', 'password123');
  assert(tp.user.role === 'room_leader', 'Trưởng phòng đăng nhập thành công với vai trò room_leader');
  assert(tp.user.scopes[0].scope_type === 'room' && tp.user.scopes[0].scope_id === 1, `Trưởng phòng có scope room = 1 (${tp.user.scopes[0].scope_name})`);

  // Bị cấm admin
  const tpAdmin = await apiGet('/admin/users', tp.token);
  assert(tpAdmin.status === 403, 'Trưởng phòng bị CHẶN (403 Forbidden) khi cố truy cập quản trị hệ thống');

  // Danh sách phòng chỉ thấy phòng của mình (P201)
  const tpRooms = await apiGet('/dormitory/rooms', tp.token);
  assert(tpRooms.ok && tpRooms.data.data.length === 1 && tpRooms.data.data[0].id === 1, `Trưởng phòng chỉ thấy DUY NHẤT phòng mình quản lý: ${tpRooms.data.data[0]?.code}`);

  // Thử xem phòng 202 (ID 2) -> phải 403
  const tpOtherRoom = await apiGet('/dormitory/rooms/2', tp.token);
  assert(tpOtherRoom.status === 403, 'Trưởng phòng bị CHẶN (403 Forbidden) khi cố xem chi tiết phòng khác (Phòng ID 2)');

  // Học sinh chỉ thấy học sinh trong phòng 201
  const tpStudents = await apiGet('/students', tp.token);
  const allInRoom1 = tpStudents.data.data.items.every(s => s.dorm_room_id === 1);
  assert(tpStudents.ok && allInRoom1, `Trưởng phòng chỉ thấy ${tpStudents.data.data.total} học sinh trong phòng P201 của mình`);

  // Trưởng phòng không được duyệt đơn phép (chỉ có quyền xem)
  const tpApproveLeave = await apiPost('/leave-requests/1/approve', {}, tp.token);
  assert(tpApproveLeave.status === 403, 'Trưởng phòng bị CHẶN (403 Forbidden) khi cố phê duyệt đơn xin phép KTX');

  // 4. TRƯỞNG TẦNG KTX (truong_tang_2 - Tầng 2, 24 phòng)
  console.log('\n4. KIỂM TRA TÀI KHOẢN TRƯỞNG TẦNG KTX (truong_tang_2 - Tầng 2):');
  const tt = await login('truong_tang_2', 'password123');
  assert(tt.user.role === 'floor_leader', 'Trưởng tầng đăng nhập thành công với vai trò floor_leader');
  assert(tt.user.scopes[0].scope_type === 'floor' && tt.user.scopes[0].scope_id === 2, `Trưởng tầng có scope floor = 2 (${tt.user.scopes[0].scope_name})`);

  // Danh sách phòng chỉ thấy các phòng trên Tầng 2
  const ttRooms = await apiGet('/dormitory/rooms', tt.token);
  const allOnFloor2 = ttRooms.data.data.every(r => r.floor_number === 2);
  assert(ttRooms.ok && allOnFloor2 && ttRooms.data.data.length === 24, `Trưởng tầng chỉ thấy 24 phòng trên Tầng 2 (${ttRooms.data.data.length} phòng)`);

  // Thử xem phòng tầng 3 (Phòng ID 25) -> phải 403
  const ttOtherFloor = await apiGet('/dormitory/rooms/25', tt.token);
  assert(ttOtherFloor.status === 403, 'Trưởng tầng bị CHẶN (403 Forbidden) khi cố xem chi tiết phòng ở tầng khác (Phòng ID 25 Tầng 3)');

  // 5. ĐOÀN THANH NIÊN (chi_doan)
  console.log('\n5. KIỂM TRA TÀI KHOẢN ĐOÀN THANH NIÊN (chi_doan):');
  const dtn = await login('chi_doan', 'password123');
  assert(dtn.user.role === 'youth_union', 'Đoàn trường đăng nhập thành công với vai trò youth_union');

  // Bị cấm admin & cấm điểm danh KTX
  const dtnAdmin = await apiGet('/admin/users', dtn.token);
  assert(dtnAdmin.status === 403, 'Đoàn Thanh niên bị CHẶN (403 Forbidden) khi cố truy cập quản trị hệ thống');

  const dtnRollCall = await apiPost('/dormitory/attendance/mark-all-present', { room_id: 1 }, dtn.token);
  assert(dtnRollCall.status === 403, 'Đoàn Thanh niên bị CHẶN (403 Forbidden) khi cố điểm danh KTX');

  // Được xem báo cáo ma trận lỗi
  const dtnMatrix = await apiGet('/reports/matrix', dtn.token);
  assert(dtnMatrix.ok && dtnMatrix.data.data.matrix.length === 54, 'Đoàn Thanh niên được xem báo cáo ma trận kỷ luật toàn trường');

  // 6. QUẢN SINH KTX (quan_sinh)
  console.log('\n6. KIỂM TRA TÀI KHOẢN QUẢN SINH KTX (quan_sinh):');
  const ql = await login('quan_sinh', 'password123');
  assert(ql.user.role === 'dorm_manager', 'Quản sinh KTX đăng nhập thành công với vai trò dorm_manager');

  // Quản sinh thấy toàn bộ 120 phòng KTX
  const qlRooms = await apiGet('/dormitory/rooms', ql.token);
  assert(qlRooms.ok && qlRooms.data.data.length === 120, `Quản sinh quản lý toàn bộ 120 phòng KTX (${qlRooms.data.data.length} phòng)`);

  // Quản sinh bị cấm quản trị user & niên khóa
  const qlAdmin = await apiGet('/admin/users', ql.token);
  assert(qlAdmin.status === 403, 'Quản sinh bị CHẶN (403 Forbidden) khi cố truy cập quản trị hệ thống');

  const qlAcademic = await apiGet('/academic-year/preview', ql.token);
  assert(qlAcademic.status === 403, 'Quản sinh bị CHẶN (403 Forbidden) khi cố chuyển niên khóa');

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM TRA: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Lỗi khi chạy kiểm tra:', err);
  process.exit(1);
});
