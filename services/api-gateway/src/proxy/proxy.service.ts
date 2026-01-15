import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  private serviceUrls: Record<string, string>;

  constructor(private configService: ConfigService) {
    this.serviceUrls = {
      auth: this.configService.get('AUTH_SERVICE_URL', 'http://localhost:4001'),
      albums: this.configService.get('ALBUMS_SERVICE_URL', 'http://localhost:4002'),
      photos: this.configService.get('PHOTOS_SERVICE_URL', 'http://localhost:4003'),
      upload: this.configService.get('UPLOAD_SERVICE_URL', 'http://localhost:4004'),
    };
  }

  async forward(
    service: string,
    path: string,
    method: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const baseUrl = this.serviceUrls[service];
    if (!baseUrl) {
      throw new HttpException(`Service ${service} not found`, 500);
    }

    const url = `${baseUrl}${path}`;

    const fetchHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
    };

    if (body && method !== 'GET' && method !== 'DELETE') {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type');

      if (response.status === 204) {
        return null;
      }

      const data = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new HttpException(data, response.status);
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Service unavailable', 503);
    }
  }

  getServiceUrl(service: string): string {
    return this.serviceUrls[service];
  }
}
