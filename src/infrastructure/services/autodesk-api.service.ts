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

    // ==================== DATA MANAGEMENT FOLDERS API ====================

    /**
     * Obtiene una carpeta específica por ID
     */
    async obtenerCarpetaPorId(accessToken: string, projectId: string, folderId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}`;

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
                `Error al obtener carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene el contenido de una carpeta (subcarpetas y archivos)
     */
    async obtenerContenidoCarpeta(accessToken: string, projectId: string, folderId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/contents`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
                included: response.data.included || [],
                links: response.data.links || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener contenido de carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Busca en el contenido de una carpeta por nombre u otros criterios
     */
    async buscarEnContenidoCarpeta(
        accessToken: string,
        projectId: string,
        folderId: string,
        searchName?: string,
        filterType?: string,
        extensionType?: string,
        additionalFilters: Record<string, any> = {}
    ): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/contents`;

            const params: Record<string, string> = { ...additionalFilters };

            if (searchName) {
                params['filter[displayName]'] = searchName;
            }
            if (filterType) {
                params['filter[type]'] = filterType;
            }
            if (extensionType) {
                params['filter[extension.type]'] = extensionType;
            }

            if (Object.keys(params).length > 0) {
                url += '?' + new URLSearchParams(params).toString();
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
                `Error al buscar en contenido de carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene la carpeta padre de una carpeta
     */
    async obtenerCarpetaPadre(accessToken: string, projectId: string, folderId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/parent`;

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
                `Error al obtener carpeta padre: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las referencias (refs) de una carpeta
     */
    async obtenerReferenciasCarpeta(accessToken: string, projectId: string, folderId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/refs`;

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
                `Error al obtener referencias: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las relaciones de links de una carpeta
     */
    async obtenerRelacionesLinksCarpeta(accessToken: string, projectId: string, folderId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/relationships/links`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener relaciones de links: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las relaciones de refs de una carpeta
     */
    async obtenerRelacionesRefsCarpeta(accessToken: string, projectId: string, folderId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/relationships/refs`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener relaciones de refs: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Busca dentro de una carpeta
     */
    async buscarEnCarpeta(accessToken: string, projectId: string, folderId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/search`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters).toString();
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
                `Error al buscar en carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una nueva carpeta
     */
    async crearCarpeta(accessToken: string, projectId: string, folderData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderData) {
                throw new Error('Token, projectId y folderData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders`;

            const body = {
                jsonapi: { version: '1.0' },
                data: folderData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una subcarpeta dentro de una carpeta padre
     */
    async crearSubcarpeta(
        accessToken: string,
        projectId: string,
        parentFolderId: string,
        folderName: string,
        folderType?: string
    ): Promise<any> {
        try {
            if (!accessToken || !projectId || !parentFolderId || !folderName) {
                throw new Error('Token, projectId, parentFolderId y folderName son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders`;

            const folderData: any = {
                type: 'folders',
                attributes: {
                    name: folderName,
                },
                relationships: {
                    parent: {
                        data: {
                            type: 'folders',
                            id: parentFolderId,
                        },
                    },
                },
            };

            if (folderType) {
                folderData.attributes.extension = {
                    type: folderType,
                    version: '1.0',
                };
            }

            const body = {
                jsonapi: { version: '1.0' },
                data: folderData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear subcarpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una referencia en una carpeta
     */
    async crearReferenciaCarpeta(accessToken: string, projectId: string, folderId: string, refData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId || !refData) {
                throw new Error('Token, projectId, folderId y refData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}/relationships/refs`;

            const body = {
                jsonapi: { version: '1.0' },
                data: refData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear referencia: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza una carpeta
     */
    async actualizarCarpeta(accessToken: string, projectId: string, folderId: string, updateData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId || !updateData) {
                throw new Error('Token, projectId, folderId y updateData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}`;

            const body = {
                jsonapi: { version: '1.0' },
                data: updateData,
            };

            const response = await this.httpClient.patch<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Elimina una carpeta (marca como oculta)
     */
    async eliminarCarpeta(accessToken: string, projectId: string, folderId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId) {
                throw new Error('Token, projectId y folderId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/folders/${encodeURIComponent(folderId)}`;

            const body = {
                jsonapi: { version: '1.0' },
                data: {
                    type: 'folders',
                    id: folderId,
                    attributes: {
                        hidden: true,
                    },
                },
            };

            const response = await this.httpClient.patch<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
                hiddenAt: new Date().toISOString(),
                wasAlreadyHidden: response.data.data?.attributes?.hidden === true,
            };
        } catch (error: any) {
            throw new Error(
                `Error al eliminar carpeta: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== DATA MANAGEMENT PROJECTS API ====================

    /**
     * Obtiene el hub de un proyecto específico
     */
    async obtenerHubDeProyecto(accessToken: string, hubId: string, projectId: string): Promise<any> {
        try {
            if (!accessToken || !hubId || !projectId) {
                throw new Error('Token, hubId y projectId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/project/v1/hubs/${encodeURIComponent(hubId)}/projects/${encodeURIComponent(projectId)}/hub`;

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
                `Error al obtener hub de proyecto: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las carpetas principales (top folders) de un proyecto
     */
    async obtenerCarpetasPrincipales(accessToken: string, hubId: string, projectId: string): Promise<any> {
        try {
            if (!accessToken || !hubId || !projectId) {
                throw new Error('Token, hubId y projectId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/project/v1/hubs/${encodeURIComponent(hubId)}/projects/${encodeURIComponent(projectId)}/topFolders`;

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
                `Error al obtener carpetas principales: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea storage para subir archivos
     */
    async crearStorage(accessToken: string, projectId: string, storageData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !storageData) {
                throw new Error('Token, projectId y storageData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/storage`;

            const body = {
                jsonapi: { version: '1.0' },
                data: storageData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear storage: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una descarga batch
     */
    async crearDescarga(accessToken: string, projectId: string, downloadData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !downloadData) {
                throw new Error('Token, projectId y downloadData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/downloads`;

            const response = await this.httpClient.post<any>(url, downloadData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear descarga: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene el estado de una descarga
     */
    async obtenerEstadoDescarga(accessToken: string, projectId: string, downloadId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !downloadId) {
                throw new Error('Token, projectId y downloadId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/downloads/${encodeURIComponent(downloadId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener estado de descarga: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene el estado de un job
     */
    async obtenerEstadoJob(accessToken: string, projectId: string, jobId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !jobId) {
                throw new Error('Token, projectId y jobId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/jobs/${encodeURIComponent(jobId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener estado de job: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== DATA MANAGEMENT ITEMS API ====================

    /**
     * Descargar un item (archivo)
     */
    async descargarItem(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/download`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al descargar item: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene el padre de un item
     */
    async obtenerItemPadre(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/parent`;

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
                `Error al obtener item padre: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las referencias (refs) de un item
     */
    async obtenerReferenciasItem(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/refs`;

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
                `Error al obtener referencias de item: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las relaciones de links de un item
     */
    async obtenerRelacionesLinksItem(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/relationships/links`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener relaciones de links de item: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las relaciones de refs de un item
     */
    async obtenerRelacionesRefsItem(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/relationships/refs`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener relaciones de refs de item: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene la versión tip (más reciente) de un item
     */
    async obtenerTipVersion(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/tip`;

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
                `Error al obtener versión tip: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== AUTODESK VIEWER API ====================

    /**
     * Obtiene el manifiesto de un archivo traducido
     */
    async obtenerManifiesto(urn: string): Promise<any> {
        try {
            if (!urn) {
                throw new Error('URN es requerido');
            }

            // Obtener token 2-legged con scope viewables:read
            const tokenData = await this.obtenerToken2Legged(['viewables:read']);

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
            });

            return {
                data: response.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener manifiesto: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los metadatos de un modelo
     */
    async obtenerMetadatos(urn: string): Promise<any> {
        try {
            if (!urn) {
                throw new Error('URN es requerido');
            }

            // Obtener token 2-legged con scope viewables:read
            const tokenData = await this.obtenerToken2Legged(['viewables:read']);

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/metadata`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                },
            });

            return {
                data: response.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener metadatos: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== ACC ISSUES API ====================

    /**
     * Normaliza el projectId removiendo el prefijo b. si existe
     */
    private normalizarProjectId(projectId: string): string {
        return projectId.startsWith('b.') ? projectId.substring(2) : projectId;
    }

    /**
     * Obtiene el perfil del usuario en un proyecto
     */
    async obtenerPerfilUsuario(accessToken: string, projectId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/users/me`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener perfil de usuario: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los tipos de incidencias
     */
    async obtenerTiposIncidencias(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-types`;

            if (!filters.include) {
                filters.include = 'subtypes';
            }

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener tipos de incidencias: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las definiciones de atributos
     */
    async obtenerDefinicionesAtributos(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-attribute-definitions`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener definiciones de atributos: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los mapeos de atributos
     */
    async obtenerMapeosAtributos(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-attribute-mappings`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener mapeos de atributos: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las categorías de causa raíz
     */
    async obtenerCategoriasRaiz(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-root-cause-categories`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener categorías de causa raíz: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene incidencias
     */
    async obtenerIncidencias(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues`;

            // Remover include si existe
            const cleanFilters = { ...filters };
            delete cleanFilters.include;

            if (Object.keys(cleanFilters).length > 0) {
                url += '?' + new URLSearchParams(cleanFilters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener incidencias: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una incidencia
     */
    async crearIncidencia(accessToken: string, projectId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues`;

            const response = await this.httpClient.post<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear incidencia: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene una incidencia por ID
     */
    async obtenerIncidenciaPorId(accessToken: string, projectId: string, issueId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener incidencia: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza una incidencia
     */
    async actualizarIncidencia(accessToken: string, projectId: string, issueId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}`;

            const response = await this.httpClient.patch<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al actualizar incidencia: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene comentarios de una incidencia
     */
    async obtenerComentarios(accessToken: string, projectId: string, issueId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/comments`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener comentarios: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un comentario en una incidencia
     */
    async crearComentario(accessToken: string, projectId: string, issueId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/comments`;

            const response = await this.httpClient.post<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear comentario: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un adjunto para una incidencia
     */
    async crearAdjunto(accessToken: string, projectId: string, issueId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }
            if (!data.urn) {
                throw new Error('El campo urn es requerido para crear un attachment');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/attachments`;

            const storageUrn = data.urn;
            const displayName = data.name || data.displayName || 'Attachment';

            // Generar attachmentId único
            let attachmentId: string | null = null;
            const match = storageUrn.match(/urn:adsk\.objects:os\.object:[^\/]+\/(.+)$/);
            if (match) {
                const objectKey = match[1];
                const path = require('path');
                attachmentId = path.parse(objectKey).name;
            }

            if (!attachmentId) {
                const { randomUUID } = require('crypto');
                attachmentId = randomUUID();
            }

            let fileName = data.fileName || null;
            if (!fileName && match) {
                fileName = match[1];
            }
            if (!fileName) {
                fileName = displayName;
            }

            const payload = {
                domainEntityId: issueId,
                attachments: [
                    {
                        attachmentId: attachmentId,
                        displayName: displayName,
                        fileName: fileName,
                        attachmentType: 'issue-attachment',
                        storageUrn: storageUrn,
                    },
                ],
            };

            const response = await this.httpClient.post<any>(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear adjunto: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los adjuntos de una incidencia
     */
    async obtenerAdjuntos(accessToken: string, projectId: string, issueId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/attachments/${encodeURIComponent(issueId)}/items`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            const attachments = response.data.attachments ||
                response.data.results ||
                response.data.items ||
                response.data ||
                [];

            return {
                data: Array.isArray(attachments) ? attachments : [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener adjuntos: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Elimina un adjunto de una incidencia
     */
    async eliminarAdjunto(accessToken: string, projectId: string, issueId: string, attachmentId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }
            if (!attachmentId) {
                throw new Error('El ID del adjunto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/attachments/${encodeURIComponent(issueId)}/items/${encodeURIComponent(attachmentId)}`;

            await this.httpClient.delete<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                success: true,
                message: 'Adjunto eliminado correctamente',
            };
        } catch (error: any) {
            throw new Error(
                `Error al eliminar adjunto: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene la URL firmada de una miniatura desde un snapshotUrn
     */
    async obtenerUrlMiniatura(accessToken: string, snapshotUrn: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!snapshotUrn) {
                throw new Error('El snapshotUrn es requerido');
            }

            // Si ya es una URL o data URL, retornarla directamente
            if (snapshotUrn.startsWith('data:') || snapshotUrn.startsWith('http')) {
                return {
                    success: true,
                    url: snapshotUrn,
                };
            }

            let urn = snapshotUrn.replace(/\\\//g, '/');
            urn = decodeURIComponent(urn);

            const match = urn.match(/urn:adsk\.objects:os\.object:([^\/]+)\/(.+)/);
            if (!match) {
                throw new Error(`Formato de snapshotUrn inválido: ${snapshotUrn}`);
            }

            const bucketKey = match[1];
            const objectKey = match[2];

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3download`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.data.url) {
                throw new Error('No se recibió URL firmada en la respuesta');
            }

            return {
                success: true,
                url: response.data.url,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || error.message,
            };
        }
    }

    // ==================== BIM 360 ISSUES API V2 ====================

    /**
     * Normaliza el projectId para BIM 360 Issues API v2
     * Elimina el prefijo b. si existe
     */
    /**
     * Normaliza el projectId para BIM 360 Issues API v2
     * Elimina el prefijo b. si existe
     */
    private normalizarBim360ProjectId(projectId: string): string {
        return projectId.startsWith('b.') ? projectId.substring(2) : projectId;
    }

    /**
     * Obtiene el perfil del usuario en un proyecto BIM 360
     */
    async obtenerPerfilUsuarioBim360(accessToken: string, projectId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/users/me`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener perfil de usuario BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los tipos de incidencias BIM 360
     */
    async obtenerTiposIncidenciasBim360(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-types`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener tipos de incidencias BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las definiciones de atributos BIM 360
     */
    async obtenerDefinicionesAtributosBim360(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-attribute-definitions`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener definiciones de atributos BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los mapeos de atributos BIM 360
     */
    async obtenerMapeosAtributosBim360(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-attribute-mappings`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener mapeos de atributos BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las categorías de causa raíz BIM 360
     */
    async obtenerCategoriasRaizBim360(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issue-root-cause-categories`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener categorías de causa raíz BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene incidencias BIM 360
     */
    async obtenerIncidenciasBim360(accessToken: string, projectId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (filters.filter && typeof filters.filter === 'object') {
                for (const [key, value] of Object.entries(filters.filter)) {
                    queryParams[`filter[${key}]`] = String(value);
                }
            }

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener incidencias BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una incidencia BIM 360
     */
    async crearIncidenciaBim360(accessToken: string, projectId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues`;

            const response = await this.httpClient.post<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear incidencia BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene una incidencia BIM 360 por ID
     */
    async obtenerIncidenciaPorIdBim360(accessToken: string, projectId: string, issueId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener incidencia BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza una incidencia BIM 360
     */
    async actualizarIncidenciaBim360(accessToken: string, projectId: string, issueId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}`;

            const response = await this.httpClient.patch<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al actualizar incidencia BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene comentarios de una incidencia BIM 360
     */
    /**
     * Obtiene comentarios de una incidencia BIM 360
     */
    async obtenerComentariosBim360(accessToken: string, projectId: string, issueId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/comments`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener comentarios BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un comentario en una incidencia BIM 360
     */
    async crearComentarioBim360(accessToken: string, projectId: string, issueId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/comments`;

            const response = await this.httpClient.post<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear comentario BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los adjuntos de una incidencia BIM 360
     */
    async obtenerAdjuntosBim360(accessToken: string, projectId: string, issueId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            let url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/attachments`;

            const queryParams: Record<string, string> = {};
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.results || [],
                pagination: response.data.pagination || {},
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener adjuntos BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un adjunto para una incidencia BIM 360
     */
    async crearAdjuntoBim360(accessToken: string, projectId: string, issueId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }
            if (!data.urn) {
                throw new Error('El campo urn es requerido para crear un attachment');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/attachments`;

            const storageUrn = data.urn;
            const displayName = data.name || data.displayName || 'Attachment';

            // Generar attachmentId único si es posible desde el URN
            let attachmentId: string | null = null;
            const match = storageUrn.match(/urn:adsk\.objects:os\.object:[^\/]+\/(.+)$/);
            if (match) {
                const objectKey = match[1];
                const path = require('path');
                attachmentId = path.parse(objectKey).name;
            }

            if (!attachmentId) {
                const { randomUUID } = require('crypto');
                attachmentId = randomUUID();
            }

            let fileName = data.fileName || null;
            if (!fileName && match) {
                fileName = match[1];
            }
            if (!fileName) {
                fileName = displayName;
            }

            const payload = {
                domainEntityId: issueId,
                attachments: [
                    {
                        attachmentId: attachmentId,
                        displayName: displayName,
                        fileName: fileName,
                        attachmentType: 'issue-attachment',
                        storageUrn: storageUrn,
                    },
                ],
            };

            // Para BIM 360 a veces se espera el array directamente o la estructura anterior
            // Con Unified API (construction/issues/v1), la estructura es domainEntityId + attachments array

            const response = await this.httpClient.post<any>(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al crear adjunto BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza un adjunto de una incidencia BIM 360
     */
    async actualizarAdjuntoBim360(accessToken: string, projectId: string, issueId: string, attachmentId: string, data: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!issueId) {
                throw new Error('El ID de la incidencia es requerido');
            }
            if (!attachmentId) {
                throw new Error('El ID del adjunto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const normalizedProjectId = this.normalizarBim360ProjectId(projectId);
            const url = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/issues/${encodeURIComponent(issueId)}/attachments/${encodeURIComponent(attachmentId)}`;

            const response = await this.httpClient.patch<any>(url, data, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al actualizar adjunto BIM 360: ${error.response?.data?.message || error.message}`,
            );
        }
    }
}


