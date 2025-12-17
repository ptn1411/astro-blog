import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import jsonP from '@ptndev/json';

export interface ApiOptions {
  limit?: number;
  offset?: number;
  where?: Record<string, any>;
  id?: number | string;
  [key: string]: any;
}

export interface ApiResult<T = any> {
  status: boolean;
  data?: T;
  error?: string;
}

export class ApiSheet {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(url: string, apiKey?: string) {
    if (!url) {
      throw new Error('Url or Script ID is required');
    }

    this.apiKey = apiKey;

    const isUrl = url.includes('https://script.google.com/macros/s/');
    const baseUrl = isUrl ? url : `https://script.google.com/macros/s/${url}/exec`;

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'text/plain',
      },
      maxRedirects: 5,
    });

    // Add request interceptor to inject API Key
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.apiKey) {
        config.params = { ...config.params, apikey: this.apiKey };
      }
      return config;
    });

    // Add response interceptor to handle API-level errors
    this.client.interceptors.response.use((response: AxiosResponse<ApiResult>) => {
      const result = response.data;
      if (result && result.status === false) {
        return Promise.reject(new Error(result.error || 'Unknown API Error'));
      }
      if (result && result.status === true && result.data !== undefined) {
        return result.data;
      }
      return result;
    });
  }

  private serialize(obj?: Record<string, any>): string {
    if (!obj) return '';
    return jsonP.stringify(obj);
  }

  /**
   * Create a new record
   */
  async create<T = any>(table: string, data: Record<string, any>): Promise<T> {
    return this.client.post('', data, {
      params: {
        method: 'create',
        table: table,
      },
    });
  }

  /**
   * Find one record
   */
  async findOne<T = any>(table: string, options: ApiOptions): Promise<T | null> {
    return this.client.get('', {
      params: {
        method: 'findOne',
        table: table,
        options: this.serialize(options),
      },
    });
  }

  /**
   * Find record by Primary Key
   */
  async findByPk<T = any>(table: string, id: number | string): Promise<T | null> {
    return this.client.get('', {
      params: {
        method: 'findByPk',
        table: table,
        options: this.serialize({ id }),
      },
    });
  }

  /**
   * Find all records
   */
  async findAll<T = any[]>(table: string, options: ApiOptions = {}): Promise<T> {
    return this.client.get('', {
      params: {
        method: 'findAll',
        table: table,
        options: this.serialize(options),
      },
    });
  }

  /**
   * Find and count all records
   */
  async findAndCountAll<T = any>(table: string, options: ApiOptions = {}): Promise<{ count: number; result: T[] }> {
    return this.client.get('', {
      params: {
        method: 'findAndCountAll',
        table: table,
        options: this.serialize(options),
      },
    });
  }

  /**
   * Update record by ID
   */
  async updateById<T = any>(table: string, data: Record<string, any> & { id: number | string }): Promise<T> {
    return this.client.post('', data, {
      params: {
        method: 'updateById',
        table: table,
      },
    });
  }

  /**
   * Delete record by ID
   */
  async deleteById<T = any>(table: string, id: number | string): Promise<T | null> {
    return this.client.post(
      '',
      { id },
      {
        params: {
          method: 'deleteById',
          table: table,
        },
      }
    );
  }
}

export default ApiSheet;
