import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface HttpClientResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
}

@Injectable()
export class HttpClientService {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Log request (optional)
                console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                return Promise.reject(error);
            },
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error: AxiosError) => {
                // Log error
                if (error.response) {
                    console.error(
                        `[HTTP Error] ${error.response.status} - ${error.response.statusText}`,
                        error.response.data,
                    );
                } else if (error.request) {
                    console.error('[HTTP Error] No response received', error.message);
                } else {
                    console.error('[HTTP Error]', error.message);
                }
                return Promise.reject(error);
            },
        );
    }

    async get<T = any>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<HttpClientResponse<T>> {
        const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
        return this.transformResponse(response);
    }

    async post<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<HttpClientResponse<T>> {
        const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
        return this.transformResponse(response);
    }

    async put<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<HttpClientResponse<T>> {
        const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
        return this.transformResponse(response);
    }

    async patch<T = any>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<HttpClientResponse<T>> {
        const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
        return this.transformResponse(response);
    }

    async delete<T = any>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<HttpClientResponse<T>> {
        const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
        return this.transformResponse(response);
    }

    private transformResponse<T>(response: AxiosResponse<T>): HttpClientResponse<T> {
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }
}
