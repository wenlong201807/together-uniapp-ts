import { API_CONFIG } from '@/config';
import type { ApiResponse } from '@/types';

class Request {
  private baseURL: string;
  private timeout: number;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

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

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = uni.getStorageSync('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    try {
      const res = await uni.request({
        url: this.baseURL + '/auth/refresh',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
        },
        data: {
          refreshToken: refreshToken,
        },
      });

      if (res.statusCode === 200 || res.statusCode === 201) {
        const response = res.data as ApiResponse<{ token: string; refreshToken: string }>;
        if (response.code === 0 && response.data) {
          const newToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          // 保存新的 token
          uni.setStorageSync('token', newToken);
          if (newRefreshToken) {
            uni.setStorageSync('refreshToken', newRefreshToken);
          }

          return newToken;
        }
      }

      throw new Error('Refresh token failed');
    } catch (error) {
      throw error;
    }
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
        success: async (res: UniApp.RequestSuccessCallbackResult) => {
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
            // Token 过期，尝试刷新
            if (!this.isRefreshing) {
              this.isRefreshing = true;

              try {
                const newToken = await this.refreshToken();
                this.isRefreshing = false;
                this.onRefreshed(newToken);

                // 重试原请求
                const retryConfig = {
                  ...requestConfig,
                  header: {
                    ...requestConfig.header,
                    Authorization: `Bearer ${newToken}`,
                  },
                };

                uni.request({
                  ...retryConfig,
                  success: (retryRes) => {
                    const retryResponse = retryRes.data as ApiResponse<T>;
                    if ([200, 201].includes(retryRes.statusCode) && retryResponse.code === 0) {
                      resolve(retryResponse);
                    } else {
                      reject(new Error(retryResponse.message || '请求失败'));
                    }
                  },
                  fail: (err) => {
                    reject(err);
                  },
                });
              } catch (error) {
                // 刷新 token 失败，清除登录状态
                this.isRefreshing = false;
                this.refreshSubscribers = [];

                uni.showToast({
                  title: '登录已过期，请重新登录',
                  icon: 'none',
                });
                uni.removeStorageSync('token');
                uni.removeStorageSync('refreshToken');
                uni.removeStorageSync('userInfo');
                uni.navigateTo({ url: '/pages/auth/login' });
                reject(new Error('未授权'));
              }
            } else {
              // 正在刷新 token，将请求加入队列
              this.addRefreshSubscriber((newToken: string) => {
                const retryConfig = {
                  ...requestConfig,
                  header: {
                    ...requestConfig.header,
                    Authorization: `Bearer ${newToken}`,
                  },
                };

                uni.request({
                  ...retryConfig,
                  success: (retryRes) => {
                    const retryResponse = retryRes.data as ApiResponse<T>;
                    if ([200, 201].includes(retryRes.statusCode) && retryResponse.code === 0) {
                      resolve(retryResponse);
                    } else {
                      reject(new Error(retryResponse.message || '请求失败'));
                    }
                  },
                  fail: (err) => {
                    reject(err);
                  },
                });
              });
            }
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
