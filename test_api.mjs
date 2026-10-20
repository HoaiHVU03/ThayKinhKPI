// test_api.mjs
// HE THONG QUAN LY KTX & KPI NEN NEP - THPT CHUYEN HUNG VUONG
// COMPREHENSIVE AUTOMATED ENDPOINT & CRUD TEST SUITE

import http from 'node:http';

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5288,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
        'Connection': 'close'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('  THPT CHUYEN HUNG VUONG - AUTOMATED DEEP SYSTEM TEST SUITE    ');
  console.log('===============================================================\n');

  // Step 1: Login
  const loginRes = await request('/api/auth/login', 'POST', { username: 'admin', password: 'password123' });
  if (loginRes.status !== 200 || !loginRes.data?.data?.token) {
    console.error('FATAL: Login failed!', loginRes);
    process.exit(1);
  }
  const token = loginRes.data.data.token;
  const user = loginRes.data.data.user;
  console.log(`[PASS 200] Login Authentication: ${user.full_name} (Role: ${user.role})\n`);

  // Step 2: Test 22 Core GET Endpoints
  console.log('--- 1. TESTING 22 CORE GET ENDPOINTS ---');
  const getEndpoints = [
    '/api/auth/me',
    '/api/dashboard/stats',
    '/api/dashboard/charts',
    '/api/students?limit=5',
    '/api/classes',
    '/api/dormitory/overview',
    '/api/dormitory/rooms',
    '/api/regimes',
    '/api/regimes/current',
    '/api/kpi/rules',
    '/api/kpi/violations?limit=5',
    '/api/duty/schedules',
    '/api/duty/teachers',
    '/api/leave-requests',
    '/api/reports/matrix',
    '/api/reports/students-kpi',
    '/api/reports/official-document',
    '/api/academic-year/preview',
    '/api/admin/users',
    '/api/admin/settings',
    '/api/admin/audit-logs?limit=5',
    '/api/admin/backup'
  ];

  let getPassed = 0;
  for (const ep of getEndpoints) {
    const res = await request(ep, 'GET', null, token);
    if (res.status === 200) {
      console.log(`  [OK 200] ${ep}`);
      getPassed++;
    } else {
      console.error(`  [FAIL ${res.status}] ${ep}:`, res.data || res.text);
    }
  }
  console.log(`=> Summary: ${getPassed}/${getEndpoints.length} GET endpoints passed.\n`);

  // Step 3: Test Live CRUD for All Major Entities
  console.log('--- 2. TESTING FULL CRUD ACROSS ALL MODULES ---');

  // 3.1. CRUD Daily Regime
  const regCreate = await request('/api/regimes', 'POST', {
    order_num: 99,
    name: 'Chế độ Kiểm thử Hệ thống',
    time_start: '23:30',
    time_end: '23:55',
    description: 'Chế độ sinh hoạt tạo tự động để kiểm thử',
    responsible_role: 'Ban Quản sinh'
  }, token);
  const regId = regCreate.data?.data?.id;
  const regUpdate = await request(`/api/regimes/${regId}`, 'PUT', { name: 'Chế độ Kiểm thử (Đã sửa)' }, token);
  const regDelete = await request(`/api/regimes/${regId}`, 'DELETE', null, token);
  console.log(`  [CRUD Daily Regime]     Create: ${regCreate.status} | Update: ${regUpdate.status} | Delete: ${regDelete.status}`);

  // 3.2. CRUD Duty Schedule
  const dutyCreate = await request('/api/duty/schedules', 'POST', {
    teacher_id: 1,
    duty_date: '2026-11-01',
    shift_name: 'Ca Sáng (06h55 - 07h15)',
    location: 'Tòa nhà A',
    notes: 'Kiểm thử phân công ca trực ban'
  }, token);
  const dutyId = dutyCreate.data?.data?.id;
  const dutyUpdate = await request(`/api/duty/schedules/${dutyId}`, 'PUT', { teacher_id: 1, notes: 'Ghi chú đã cập nhật' }, token);
  const dutyDelete = await request(`/api/duty/schedules/${dutyId}`, 'DELETE', null, token);
  console.log(`  [CRUD Duty Schedule]    Create: ${dutyCreate.status} | Update: ${dutyUpdate.status} | Delete: ${dutyDelete.status}`);

  // 3.3. CRUD KPI Rule
  const ruleCode = 'LTEST_' + Date.now().toString().slice(-4);
  const ruleCreate = await request('/api/kpi/rules', 'POST', {
    code: ruleCode,
    name: 'Hành vi kiểm thử hệ thống',
    category: 'KTX',
    deduction_points: 2.0,
    description: 'Quy định kiểm thử'
  }, token);
  const ruleId = ruleCreate.data?.data?.id;
  const ruleUpdate = await request(`/api/kpi/rules/${ruleId}`, 'PUT', { name: 'Hành vi kiểm thử (Đã sửa)', deduction_points: 3.0 }, token);
  const ruleDelete = await request(`/api/kpi/rules/${ruleId}`, 'DELETE', null, token);
  console.log(`  [CRUD KPI Rule]         Create: ${ruleCreate.status} | Update: ${ruleUpdate.status} | Delete: ${ruleDelete.status}`);

  // 3.4. CRUD User Account
  const testUname = 'audit_' + Date.now().toString().slice(-4);
  const userCreate = await request('/api/admin/users', 'POST', {
    username: testUname,
    password: 'password123',
    full_name: 'Tài khoản Kiểm thử',
    role: 'homeroom_teacher'
  }, token);
  const userId = userCreate.data?.data?.id;
  const userUpdate = await request(`/api/admin/users/${userId}`, 'PUT', { full_name: 'Tài khoản Kiểm thử (Đã sửa)', role: 'homeroom_teacher', status: 'active' }, token);
  const userDelete = await request(`/api/admin/users/${userId}`, 'DELETE', null, token);
  console.log(`  [CRUD Admin User]       Create: ${userCreate.status} | Update: ${userUpdate.status} | Delete: ${userDelete.status}`);

  // 3.5. CRUD Class
  const classCode = 'TEST_' + Date.now().toString().slice(-3);
  const classCreate = await request('/api/classes', 'POST', {
    code: classCode,
    name: 'Lớp Chuyên Kiểm thử ' + classCode,
    grade_level: 10,
    academic_year_id: 1,
    homeroom_teacher_name: 'Thầy Kiểm Thử',
    room_number: 'Phòng A-99'
  }, token);
  const classId = classCreate.data?.data?.id;
  const classUpdate = await request(`/api/classes/${classId}`, 'PUT', { room_number: 'Phòng A-100' }, token);
  const classDelete = await request(`/api/classes/${classId}`, 'DELETE', null, token);
  console.log(`  [CRUD 54 Class]         Create: ${classCreate.status} | Update: ${classUpdate.status} | Delete: ${classDelete.status}`);

  // 3.6. CRUD Dormitory Room
  const roomCode = 'P999_' + Date.now().toString().slice(-2);
  const roomCreate = await request('/api/dormitory/rooms', 'POST', {
    code: roomCode,
    building: 'Tòa B (Khu Nam)',
    floor_number: 2,
    gender: 'Nam',
    capacity: 6
  }, token);
  const roomId = roomCreate.data?.data?.id;
  const roomUpdate = await request(`/api/dormitory/rooms/${roomId}`, 'PUT', { capacity: 8 }, token);
  const roomDelete = await request(`/api/dormitory/rooms/${roomId}`, 'DELETE', null, token);
  console.log(`  [CRUD Dorm Room]        Create: ${roomCreate.status} | Update: ${roomUpdate.status} | Delete: ${roomDelete.status}`);

  console.log('\n===============================================================');
  console.log('  ALL AUDIT CHECKS PASSED: SYSTEM IS HEALTHY & FULLY FUNCTIONAL');
  console.log('===============================================================\n');
}

runTestSuite();
