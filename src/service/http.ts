import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError, type ResponseType, type InternalAxiosRequestConfig } from 'axios';
import { ElMessage, ElLoading } from 'element-plus';

// 定义API响应类型
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 定义请求配置类型，扩展axios配置
interface ApiRequestConfig<T = any> extends AxiosRequestConfig {
  // 是否显示错误提示
  showError?: boolean;
  // 是否显示成功提示
  showSuccess?: boolean;
  // 成功提示消息
  successMessage?: string;
  // 响应数据类型
  responseType?: ResponseType;
  showLoading?: boolean;
}

// 定义错误类型
interface RequestError extends Error {
  response?: AxiosResponse<ApiResponse>;
  code?: string;
}

/**
 * Axios请求封装类
 * 处理请求配置、拦截器和统一响应处理
 */
class ApiService {
  private instance: AxiosInstance;
  private baseURL: string;
  private timeout: number;
  private loadingCount = 0;
  private loadingInstance: ReturnType<typeof ElLoading.service> | null = null;

  constructor(config?: { baseURL?: string; timeout?: number }) {
    this.baseURL = config?.baseURL || import.meta.env.VITE_API_BASE_URL || '';
    this.timeout = config?.timeout || 10000;
    this.instance = this.createInstance();
    this.setupInterceptors();
  }

  /**
   * 创建axios实例
   */
  private createInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
    });
  }

  /**
   * 设置拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
          const apiConfig = config as ApiRequestConfig;
          // 可以在这里添加认证token等
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (apiConfig.showLoading) {
          this.loadingCount++;
          if (this.loadingCount === 1) {
            this.loadingInstance = ElLoading.service({ fullscreen: true });
          }
        }
        return config;
      },
      (error: AxiosError): Promise<RequestError> => {
        const requestError = error as RequestError;
        requestError.message = '请求配置错误: ' + (error.message || '未知错误');
        this.handleError(requestError);
        const apiConfig = error.config as ApiRequestConfig;
          if (apiConfig?.showLoading) {
          this.loadingCount--;
          if (this.loadingCount === 0 && this.loadingInstance) {
            this.loadingInstance.close();
            this.loadingInstance = null;
          }
        }
        return Promise.reject(requestError);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>): AxiosResponse<ApiResponse> => {
        const config = response.config as ApiRequestConfig;
        const data = response.data;

        // 如果有成功消息提示
        if (config.showSuccess) {
          ElMessage.success(config.successMessage || '操作成功');
        }

        // 假设后端约定code为0时表示成功
        if (data.code !== 0) {
          const error = new Error(data.message || '请求失败') as RequestError;
          error.response = response;
          this.handleError(error, config.showError);
          throw error;
        }

        if (config.showLoading) {
          this.loadingCount--;
          if (this.loadingCount === 0 && this.loadingInstance) {
            this.loadingInstance.close();
            this.loadingInstance = null;
          }
        }
        return response;
      },
      (error: AxiosError<ApiResponse>): Promise<RequestError> => {
        const requestError = error as RequestError;
        const config = error.config as ApiRequestConfig;

        // 处理网络错误
        if (!error.response) {
          requestError.message = '网络错误，请检查网络连接';
        } else {
          // 处理HTTP错误状态码
          switch (error.response.status) {
            case 401:
              requestError.message = '未授权，请重新登录';
              // 可以在这里添加跳转到登录页的逻辑
              break;
            case 403:
              requestError.message = '拒绝访问';
              break;
            case 404:
              requestError.message = '请求资源不存在';
              break;
            case 500:
              requestError.message = '服务器内部错误';
              break;
            default:
              requestError.message = `请求错误: ${error.response.status} - ${error.response.statusText}`;
          }
        }

        this.handleError(requestError, config?.showError);
        return Promise.reject(requestError);
      }
    );
  }

  /**
   * 错误处理
   */
  private handleError(error: RequestError, showError: boolean = true): void {
    if (showError) {
      ElMessage.error(error.message);
    }
    // 可以在这里添加错误日志上报等逻辑
    console.error('请求错误:', error);
  }

  /**
   * GET请求
   */
  get<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    return this.instance.get(url, config).then(response => response.data.data as T);
  }

  /**
   * POST请求
   */
  post<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.instance.post(url, data, config).then(response => response.data.data as T);
  }

  /**
   * PUT请求
   */
  put<T = any>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    return this.instance.put(url, data, config).then(response => response.data.data as T);
  }

  /**
   * DELETE请求
   */
  delete<T = any>(url: string, config?: ApiRequestConfig): Promise<T> {
    return this.instance.delete(url, config).then(response => response.data.data as T);
  }

  /**
   * 上传文件
   */
  upload<T = any>(url: string, data: FormData, config?: ApiRequestConfig): Promise<T> {
    const uploadConfig: ApiRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };
    return this.post<T>(url, data, uploadConfig);
  }

  /**
   * 下载文件
   */
  download(url: string, config?: ApiRequestConfig): Promise<Blob> {
    return this.instance
      .get(url, {
        ...config,
        responseType: 'blob',
      })
      .then(response => {
        // 处理文件下载
        const blob = new Blob([response.data]);
        const fileName = this.getFileNameFromHeader(response.headers);
        this.saveBlobAsFile(blob, fileName);
        return blob;
      });
  }

  /**
   * 从响应头获取文件名
   */
  private getFileNameFromHeader(headers: any): string {
    const contentDisposition = headers['content-disposition'];
    if (!contentDisposition) return 'download';
    const fileNameMatch = contentDisposition.match(/filename=(.*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      return decodeURIComponent(fileNameMatch[1]);
    }
    return 'download';
  }

  /**
   * 保存blob为文件
   */
  private saveBlobAsFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// 创建API实例
const apiService = new ApiService({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

export default apiService;
export type { ApiResponse, ApiRequestConfig, RequestError };