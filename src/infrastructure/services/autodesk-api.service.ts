import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../../shared/services/http-client.service';


export interface Token2LeggedResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    expires_at: Date;
}

export interface Token3LeggedResponse {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    expires_at: Date;
}

@Injectable()
export class AutodeskApiService {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly callbackUrl: string;
    private readonly authUrl = 'https://developer.api.autodesk.com/authentication/v2/token';
    private readonly authorizeUrl = 'https://developer.api.autodesk.com/authentication/v2/authorize';

    constructor(
        private readonly httpClient: HttpClientService,
        private readonly configService: ConfigService,
    ) {
        this.clientId = this.configService.get<string>('AUTODESK_CLIENT_ID') || '';
        this.clientSecret = this.configService.get<string>('AUTODESK_CLIENT_SECRET') || '';
        this.callbackUrl = this.configService.get<string>('AUTODESK_CALLBACK_URL') || '';
    }

    /**
     * Obtiene un token 2-legged (app-only) de Autodesk
     */
    async obtenerToken2Legged(scopes: string[]): Promise<Token2LeggedResponse> {
        try {
            const scopesString = scopes.join(' ');

            // Encode credentials for Basic Auth
            const credentials = `${this.clientId}:${this.clientSecret}`;
            const encodedCredentials = Buffer.from(credentials).toString('base64');

            const response = await this.httpClient.post<any>(
                this.authUrl,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    scope: scopesString,
                }).toString(),
                {
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);

            return {
                access_token: response.data.access_token,
                token_type: response.data.token_type,
                expires_in: response.data.expires_in,
                expires_at: expiresAt,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener token 2-legged: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Genera la URL de autorización para 3-legged OAuth
     */
    generarUrlAutorizacion(scopes: string[], state: string): string {
        const scopesString = scopes.join(' ');

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.callbackUrl,
            scope: scopesString,
            state: state,
        });

        return `${this.authorizeUrl}?${params.toString()}`;
    }

    /**
     * Intercambia el código de autorización por un token 3-legged
     */
    async intercambiarCodigoPorToken(code: string): Promise<Token3LeggedResponse> {
        try {
            // Encode credentials for Basic Auth
            const credentials = `${this.clientId}:${this.clientSecret}`;
            const encodedCredentials = Buffer.from(credentials).toString('base64');

            const response = await this.httpClient.post<any>(
                this.authUrl,
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.callbackUrl,
                }).toString(),
                {
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);

            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                token_type: response.data.token_type,
                expires_in: response.data.expires_in,
                expires_at: expiresAt,
            };
        } catch (error: any) {
            throw new Error(
                `Error al intercambiar código por token: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Refresca un token 3-legged usando el refresh token
     */
    async refrescarToken(refreshToken: string): Promise<Token3LeggedResponse> {
        try {
            // Encode credentials for Basic Auth
            const credentials = `${this.clientId}:${this.clientSecret}`;
            const encodedCredentials = Buffer.from(credentials).toString('base64');

            const response = await this.httpClient.post<any>(
                this.authUrl,
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }).toString(),
                {
                    headers: {
                        'Authorization': `Basic ${encodedCredentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);

            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token || refreshToken,
                token_type: response.data.token_type,
                expires_in: response.data.expires_in,
                expires_at: expiresAt,
            };
        } catch (error: any) {
            // Check if the error is due to invalid or expired refresh token
            const errorData = error.response?.data;
            const statusCode = error.response?.status;

            if (statusCode === 400 && errorData?.error === 'invalid_grant') {
                // Refresh token is invalid or expired
                throw new Error(
                    `REFRESH_TOKEN_EXPIRED: ${errorData.error_description || 'El refresh token es inválido o ha expirado'}`,
                );
            }

            // Other errors
            throw new Error(
                `Error al refrescar token: ${errorData?.error_description || errorData?.message || error.message}`,
            );
        }
    }

    /**
     * Valida si un token está expirado
     */
    esTokenExpirado(expiraEn: Date | string): boolean {
        const now = new Date();
        const expirationDate = new Date(expiraEn);
        // Consider expired if less than 5 minutes remaining
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        return expirationDate.getTime() - now.getTime() < bufferTime;
    }

    // ==================== DATA MANAGEMENT API ====================

    /**
     * Obtiene los hubs accesibles para el usuario autenticado
     */
    async obtenerHubs(accessToken: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/project/v1/hubs`;

            // Build query parameters for filters
            const queryParams: string[] = [];
            if (filters['id']) {
                queryParams.push(`filter[id]=${encodeURIComponent(filters['id'])}`);
            }
            if (filters['name']) {
                queryParams.push(`filter[name]=${encodeURIComponent(filters['name'])}`);
            }
            if (filters['extension.type']) {
                queryParams.push(`filter[extension.type]=${encodeURIComponent(filters['extension.type'])}`);
            }

            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
                links: response.data.links || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener hubs: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los proyectos de un hub específico
     */
    async obtenerProyectos(accessToken: string, hubId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!hubId) {
                throw new Error('El ID del hub es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/project/v1/hubs/${encodeURIComponent(hubId)}/projects`;

            // Build query parameters for filters
            const queryParams: string[] = [];
            for (const [key, value] of Object.entries(filters)) {
                if (value) {
                    queryParams.push(`filter[${key}]=${encodeURIComponent(value)}`);
                }
            }

            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
                links: response.data.links || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyectos: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los detalles de un proyecto específico
     */
    async obtenerProyectoPorId(accessToken: string, hubId: string, projectId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!hubId) {
                throw new Error('El ID del hub es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/project/v1/hubs/${encodeURIComponent(hubId)}/projects/${encodeURIComponent(projectId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyecto: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los items (carpetas/archivos) de un proyecto
     */
    async obtenerItems(accessToken: string, projectId: string, folderId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            // Si no se especifica folderId, usar "root"
            const folder = folderId || 'root';

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(folder)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
                links: response.data.links || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener items: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los detalles de un item específico
     */
    async obtenerItemPorId(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!itemId) {
                throw new Error('El ID del item es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener item: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las versiones de un item específico
     */
    async obtenerVersionesItem(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!itemId) {
                throw new Error('El ID del item es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/versions`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
                links: response.data.links || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener versiones: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== ACC PROJECTS API ====================

    /**
     * Obtiene proyectos de una cuenta ACC
     */
    async getAccProjects(
        accountId: string,
        options: Record<string, any> = {},
        token?: string,
    ): Promise<any> {
        try {
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            // Get token if not provided
            let accessToken = token;
            if (!accessToken) {
                const tokenData = await this.obtenerToken2Legged(['account:read']);
                accessToken = tokenData.access_token;
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/construction/admin/v1/accounts/${encodeURIComponent(accountId)}/projects`;

            // Build query parameters
            const queryParams = this.buildAccQueryParameters(options);
            if (queryParams) {
                url += '?' + queryParams;
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyectos ACC: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene un proyecto específico por ID
     */
    async getAccProjectById(
        projectId: string,
        fields: string[] = [],
        token?: string,
    ): Promise<any> {
        try {
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            // Get token if not provided
            let accessToken = token;
            if (!accessToken) {
                const tokenData = await this.obtenerToken2Legged(['account:read']);
                accessToken = tokenData.access_token;
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}`;

            if (fields.length > 0) {
                url += '?fields=' + fields.join(',');
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyecto ACC: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un nuevo proyecto ACC
     */
    async createAccProject(
        accountId: string,
        projectData: Record<string, any>,
        token?: string,
        userId?: string,
    ): Promise<any> {
        try {
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            if (!projectData.name) {
                throw new Error('El nombre del proyecto es requerido');
            }

            // Get token if not provided (use 3-legged for write operations)
            let accessToken = token;
            if (!accessToken) {
                // For now, use 2-legged with account:write scope
                // In production, should use 3-legged token from user context
                const tokenData = await this.obtenerToken2Legged(['account:write']);
                accessToken = tokenData.access_token;
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/accounts/${encodeURIComponent(accountId)}/projects`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.post<any>(url, projectData, {
                headers,
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear proyecto ACC: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza un proyecto ACC existente
     */
    async updateAccProject(
        accountId: string,
        projectId: string,
        projectData: Record<string, any>,
        token?: string,
        userId?: string,
    ): Promise<any> {
        try {
            if (!accountId || !projectId) {
                throw new Error('Account ID y Project ID son requeridos');
            }

            if (Object.keys(projectData).length === 0) {
                throw new Error('Debe proporcionar datos para actualizar');
            }

            // Get token if not provided
            let accessToken = token;
            if (!accessToken) {
                const tokenData = await this.obtenerToken2Legged(['account:write']);
                accessToken = tokenData.access_token;
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/accounts/${encodeURIComponent(accountId)}/projects/${encodeURIComponent(projectId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.patch<any>(url, projectData, {
                headers,
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al actualizar proyecto ACC: ${error.response?.data?.message || error.message}`,
            );
        }
    }


    /**
     * Sube una imagen para un proyecto ACC
     */
    async uploadAccProjectImage(
        accountId: string,
        projectId: string,
        file: Express.Multer.File,
        token?: string,
    ): Promise<any> {
        try {
            if (!accountId || !projectId) {
                throw new Error('Account ID y Project ID son requeridos');
            }

            if (!file) {
                throw new Error('El archivo es requerido');
            }

            // Get token if not provided
            let accessToken = token;
            if (!accessToken) {
                const tokenData = await this.obtenerToken2Legged(['account:write']);
                accessToken = tokenData.access_token;
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/projects/${encodeURIComponent(projectId)}/image`;

            // Create form data
            const FormData = require('form-data');
            const formData = new FormData();

            // Determine file extension based on mime type
            const extensionMap: Record<string, string> = {
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/bmp': 'bmp',
                'image/gif': 'gif',
            };
            const ext = extensionMap[file.mimetype] || 'jpg';
            const fileName = `project_image_${Date.now()}.${ext}`;

            formData.append('chunk', file.buffer, {
                filename: fileName,
                contentType: file.mimetype,
            });

            // Use PATCH method as per Autodesk API documentation
            const response = await this.httpClient.patch<any>(url, formData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    ...formData.getHeaders(),
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al subir imagen del proyecto: ${error.response?.data?.message || error.message}`,
            );
        }
    }


    /**
     * Construye los parámetros de query para las peticiones de ACC Projects
     */
    private buildAccQueryParameters(options: Record<string, any>): string {
        const params: Record<string, string> = {};

        if (options.fields && Array.isArray(options.fields)) {
            params.fields = options.fields.join(',');
        }

        // Filters
        const filterKeys = [
            'classification', 'platform', 'products', 'name', 'type',
            'status', 'businessUnitId', 'jobNumber', 'updatedAt',
        ];

        for (const key of filterKeys) {
            const filterKey = `filter[${key}]`;
            if (options[filterKey]) {
                if (Array.isArray(options[filterKey])) {
                    params[filterKey] = options[filterKey].join(',');
                } else {
                    params[filterKey] = options[filterKey];
                }
            }
        }

        if (options.filterTextMatch) {
            params.filterTextMatch = options.filterTextMatch;
        }

        if (options.sort) {
            params.sort = options.sort;
        }

        if (options.limit !== undefined) {
            params.limit = Math.min(Number(options.limit), 200).toString();
        }

        if (options.offset !== undefined) {
            params.offset = Number(options.offset).toString();
        }

        return new URLSearchParams(params).toString();
    }
}
