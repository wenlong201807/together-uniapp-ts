import { API_CONFIG } from '@/config';
import type { ApiResponse } from '@/types';

class Request {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
  }

  private getHeaders(): Record<string, string> {
    const token = uni.getStorageSync('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: UniApp.RequestOptions,
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const requestConfig: UniApp.RequestOptions = {
        url: this.baseURL + url,
        method,
        header: this.getHeaders(),
        timeout: this.timeout,
        success: (res: UniApp.RequestSuccessCallbackResult) => {
          const response = res.data as ApiResponse<T>;

          if ([200, 201].includes(res.statusCode)) {
            if (response.code === 0) {
              resolve(response);
            } else {
              uni.showToast({
                title: response.message || '请求失败',
                icon: 'none',
              });
              reject(new Error(response.message || '请求失败'));
            }
          } else if (res.statusCode === 401) {
            uni.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
            });
            uni.removeStorageSync('token');
            uni.removeStorageSync('refreshToken');
            uni.removeStorageSync('userInfo');
            uni.navigateTo({ url: '/pages/auth/login' });
            reject(new Error('未授权'));
          } else {
            uni.showToast({
              title: response.message || '请求失败',
              icon: 'none',
            });
            reject(new Error(response.message || '请求失败'));
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络请求失败',
            icon: 'none',
          });
          reject(err);
        },
        ...config,
      };

      // GET 请求使用 params，其他请求使用 data
      if (method === 'GET') {
        if (data) {
          // 将参数拼接到 URL
          const params = new URLSearchParams(data).toString();
          if (params) {
            requestConfig.url += (requestConfig.url.includes('?') ? '&' : '?') + params;
          }
        }
      } else {
        requestConfig.data = data;
      }

      uni.request(requestConfig);
    });
  }

  get<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, data);
  }

  post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data);
  }

  put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data);
  }

  delete<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, data);
  }
}

export default new Request();
