// frontend/src/services/api.ts

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE}${endpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const token = localStorage.getItem('thaykinh_auth_token');
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Multi-tenant School Code Resolution (?school=xxx or stored code)
  try {
    const urlSchool = new URLSearchParams(window.location.search).get('school');
    if (urlSchool) {
      localStorage.setItem('thaykinh_school_code', urlSchool.trim().toLowerCase());
    }
  } catch {}

  const schoolCode = localStorage.getItem('thaykinh_school_code');
  if (schoolCode && !headers.has('X-School-Code')) {
    headers.set('X-School-Code', schoolCode);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('thaykinh_auth_token');
      localStorage.removeItem('thaykinh_auth_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const message = data?.message || `Lỗi máy chủ (${response.status})`;
    throw new Error(message);
  }

  return data?.data !== undefined ? data.data : data;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) => request<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
