export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
    };
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string, params?: Record<string, string | undefined>): Promise<T | null> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: this.headers,
    });

    if (response.status === 204) {
      return null;
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorBody: Record<string, unknown> = {};
      try {
        errorBody = await response.json() as Record<string, unknown>;
      } catch {
        // ignore parse errors
      }
      const message = (errorBody.message as string) || `HTTP ${response.status}`;
      const code = (errorBody.error as string) || 'UNKNOWN_ERROR';
      throw new Error(`[${code}] ${message}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }
}
