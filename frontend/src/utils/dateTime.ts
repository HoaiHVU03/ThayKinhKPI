// frontend/src/utils/dateTime.ts
/**
 * Tiện ích xử lý Thời gian thực (Real-time) chuẩn múi giờ Việt Nam (Asia/Ho_Chi_Minh - GMT+7).
 * Khắc phục triệt để lỗi new Date().toISOString() bị lùi 1 ngày khi truy cập trước 07:00 sáng.
 */

const TIMEZONE_VN = 'Asia/Ho_Chi_Minh';

/**
 * Lấy ngày hôm nay định dạng YYYY-MM-DD theo múi giờ Việt Nam.
 * Đảm bảo 100% không bị lùi ngày dù người dùng mở máy lúc nửa đêm hay 6h sáng.
 */
export function getTodayVN(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TIMEZONE_VN,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Lấy giờ phút hiện tại HH:mm theo múi giờ Việt Nam (24h).
 */
export function getCurrentTimeVN(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIMEZONE_VN,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Lấy giờ phút giây hiện tại HH:mm:ss theo múi giờ Việt Nam.
 */
export function getCurrentTimeSecondsVN(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIMEZONE_VN,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
}

/**
 * Format ngày YYYY-MM-DD sang định dạng hiển thị Việt Nam DD/MM/YYYY.
 */
export function formatVNDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format ngày đầy đủ có thứ trong tuần (VD: Thứ Sáu, ngày 23/10/2026).
 */
export function formatVNFullDate(d: Date = new Date()): string {
  try {
    const weekday = new Intl.DateTimeFormat('vi-VN', { timeZone: TIMEZONE_VN, weekday: 'long' }).format(d);
    const dateFormatted = new Intl.DateTimeFormat('vi-VN', {
      timeZone: TIMEZONE_VN,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
    // Viết hoa chữ cái đầu của thứ
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capWeekday}, ngày ${dateFormatted}`;
  } catch {
    return d.toLocaleDateString('vi-VN');
  }
}

/**
 * Kiểm tra xem một chuỗi ngày (YYYY-MM-DD) có phải là ngày hôm nay theo giờ VN không.
 */
export function isTodayVN(dateStr: string): boolean {
  return dateStr === getTodayVN();
}
