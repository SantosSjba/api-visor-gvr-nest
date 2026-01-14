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

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(dataManagementProjectId)}/items/${encodeURIComponent(itemId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return {
                data: response.data.data || null,
                included: response.data.included || [],
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

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(dataManagementProjectId)}/items/${encodeURIComponent(itemId)}/versions`;

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
                // Use requested scopes for broader access
                const tokenData = await this.obtenerToken2Legged(['account:write', 'account:read', 'data:read', 'data:write', 'bucket:read']);
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

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(dataManagementProjectId)}/folders/${encodeURIComponent(folderId)}`;

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

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(dataManagementProjectId)}/folders/${encodeURIComponent(folderId)}`;

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

            // 1. Obtener información del item para conseguir el storage ID
            const itemInfo = await this.obtenerItemPorId(accessToken, projectId, itemId);

            if (!itemInfo.data) {
                throw new Error('No se pudo obtener la información del item');
            }

            // 2. Buscar el storage ID
            let storageId: string | null = null;

            if (itemInfo.data.relationships?.tip?.data?.id) {
                const tipId = itemInfo.data.relationships.tip.data.id;

                if (itemInfo.included) {
                    for (const included of itemInfo.included) {
                        if (included.type === 'versions' && included.id === tipId) {
                            storageId = included.relationships?.storage?.data?.id || null;
                            break;
                        }
                    }
                }
            }

            if (!storageId) {
                throw new Error('No se encontró el storage ID del item');
            }

            // 3. Extraer bucketKey y objectKey
            const regex = /urn:adsk\.objects:os\.object:([^\/]+)\/(.+)/;
            const matches = storageId.match(regex);

            if (!matches || matches.length !== 3) {
                throw new Error(`Formato de storage ID inválido: ${storageId}`);
            }

            const bucketKey = matches[1];
            const objectKey = matches[2];

            // 4. Obtener URL firmada para descarga
            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const signedUrlEndpoint = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3download`;

            const signedResponse = await this.httpClient.get<any>(signedUrlEndpoint, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!signedResponse.data?.url) {
                throw new Error('No se recibió URL firmada en la respuesta');
            }

            const signedUrl = signedResponse.data.url;

            // 5. Descargar el archivo usando la URL firmada
            const fileResponse = await this.httpClient.get<any>(signedUrl, {
                responseType: 'arraybuffer',
            });

            const fileName = itemInfo.data.attributes?.displayName || 'archivo_descargado';

            return {
                data: fileResponse.data,
                fileName: fileName,
                storageId: storageId,
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

    // ==================== DATA MANAGEMENT VERSIONS ====================

    /**
     * Obtiene una versión específica por ID
     */
    async obtenerVersionPorId(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los formatos de descarga disponibles para una versión
     */
    async obtenerFormatosDescarga(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/downloadFormats`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener formatos de descarga: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene información de descarga para una versión
     */
    async obtenerDescargas(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/downloads`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener descargas: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene el item asociado a una versión
     */
    async obtenerItemVersion(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/item`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener item de versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las referencias (refs) de una versión
     */
    async obtenerReferenciasVersion(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/refs`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data.data || [],
                links: response.data.links || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener referencias de versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las relaciones de links de una versión
     */
    async obtenerRelacionesLinksVersion(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/relationships/links`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener relaciones de links de versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene las relaciones de refs de una versión
     */
    async obtenerRelacionesRefsVersion(accessToken: string, projectId: string, versionId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/relationships/refs`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data.data || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener relaciones de refs de versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una nueva versión
     */
    async crearVersion(accessToken: string, projectId: string, versionData: Record<string, any>, copyFrom?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionData) {
                throw new Error('Los datos de la versión son requeridos');
            }

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/data/v1/projects/${encodeURIComponent(dataManagementProjectId)}/versions`;
            
            // Si se proporciona copyFrom, agregarlo como query parameter
            if (copyFrom) {
                url += `?copyFrom=${encodeURIComponent(copyFrom)}`;
            }

            const body = {
                jsonapi: { version: '1.0' },
                data: versionData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una referencia en una versión
     */
    async crearReferenciaVersion(accessToken: string, projectId: string, versionId: string, refData: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }
            if (!refData) {
                throw new Error('Los datos de la referencia son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}/relationships/refs`;

            const body = {
                jsonapi: { version: '1.0' },
                data: refData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear referencia en versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza una versión
     */
    async actualizarVersion(accessToken: string, projectId: string, versionId: string, updateData: Record<string, any>): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!versionId) {
                throw new Error('El ID de la versión es requerido');
            }
            if (!updateData) {
                throw new Error('Los datos de actualización son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`;

            const body = {
                jsonapi: { version: '1.0' },
                data: updateData,
            };

            const response = await this.httpClient.patch<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar versión: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== COMPANIES API ====================

    /**
     * Crea una nueva compañía
     */
    async crearCompany(accessToken: string, accountId: string, companyData: Record<string, any>, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.post<any>(url, companyData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear compañía: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Importa múltiples compañías
     */
    async importarCompanies(accessToken: string, accountId: string, companies: any[], region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!companies || companies.length === 0) {
                throw new Error('Debe proporcionar al menos una compañía para importar');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies/import`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.post<any>(url, { companies }, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al importar compañías: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene las compañías de una cuenta
     */
    async obtenerCompanies(accessToken: string, accountId: string, params: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            let url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies`;

            const queryParams: Record<string, string> = {};
            if (params.limit) queryParams.limit = params.limit.toString();
            if (params.offset) queryParams.offset = params.offset.toString();
            if (params.filter) {
                if (typeof params.filter === 'object') {
                    for (const [key, value] of Object.entries(params.filter)) {
                        queryParams[`filter[${key}]`] = String(value);
                    }
                } else {
                    queryParams.filter = String(params.filter);
                }
            }

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data.results || response.data,
                pagination: response.data.pagination || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener compañías: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene una compañía específica por ID
     */
    async obtenerCompanyPorId(accessToken: string, accountId: string, companyId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!companyId) {
                throw new Error('El ID de la compañía es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies/${encodeURIComponent(companyId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener compañía: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Busca compañías
     */
    async buscarCompanies(accessToken: string, accountId: string, searchTerm: string, params: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!searchTerm) {
                throw new Error('El término de búsqueda es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            let url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies/search`;

            const queryParams: Record<string, string> = {
                term: searchTerm,
            };
            if (params.limit) queryParams.limit = params.limit.toString();
            if (params.offset) queryParams.offset = params.offset.toString();

            url += '?' + new URLSearchParams(queryParams).toString();

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data.results || response.data,
                pagination: response.data.pagination || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al buscar compañías: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene las compañías de un proyecto
     */
    async obtenerCompaniesPorProyecto(accessToken: string, accountId: string, projectId: string, params: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            let url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/projects/${encodeURIComponent(projectId)}/companies`;

            const queryParams: Record<string, string> = {};
            if (params.limit) queryParams.limit = params.limit.toString();
            if (params.offset) queryParams.offset = params.offset.toString();

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data.results || response.data,
                pagination: response.data.pagination || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener compañías del proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Actualiza una compañía
     */
    async actualizarCompany(accessToken: string, accountId: string, companyId: string, updateData: Record<string, any>, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!companyId) {
                throw new Error('El ID de la compañía es requerido');
            }
            if (!updateData || Object.keys(updateData).length === 0) {
                throw new Error('Debe proporcionar datos para actualizar');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies/${encodeURIComponent(companyId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.patch<any>(url, updateData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar compañía: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Sube una imagen para una compañía
     */
    async subirImagenCompany(accessToken: string, accountId: string, companyId: string, file: Express.Multer.File, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!companyId) {
                throw new Error('El ID de la compañía es requerido');
            }
            if (!file) {
                throw new Error('El archivo de imagen es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/companies/${encodeURIComponent(companyId)}/image`;

            const FormData = require('form-data');
            const formData = new FormData();

            const extensionMap: Record<string, string> = {
                'image/png': 'png',
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/bmp': 'bmp',
                'image/gif': 'gif',
            };
            const ext = extensionMap[file.mimetype] || 'jpg';
            const fileName = `company_image_${Date.now()}.${ext}`;

            formData.append('file', file.buffer, {
                filename: fileName,
                contentType: file.mimetype,
            });

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                ...formData.getHeaders(),
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.patch<any>(url, formData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al subir imagen de compañía: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    // ==================== ACCOUNT USERS API ====================

    /**
     * Crea un nuevo usuario en el directorio de miembros
     */
    async crearUsuario(accessToken: string, accountId: string, userData: Record<string, any>, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!userData.email) {
                throw new Error('El email es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.post<any>(url, userData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear usuario: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Importa múltiples usuarios
     */
    async importarUsuarios(accessToken: string, accountId: string, users: any[], region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!users || users.length === 0) {
                throw new Error('Debe proporcionar al menos un usuario');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/import`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.post<any>(url, { users }, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al importar usuarios: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene todos los usuarios de una cuenta
     */
    async obtenerUsuarios(accessToken: string, accountId: string, filters: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            let url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener usuarios: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene un usuario específico por ID
     */
    async obtenerUsuarioPorId(accessToken: string, accountId: string, userId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!userId) {
                throw new Error('El ID del usuario es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/${encodeURIComponent(userId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener usuario: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene los proyectos de un usuario
     */
    async obtenerProyectosUsuario(accessToken: string, accountId: string, userId: string, filters: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!userId) {
                throw new Error('El ID del usuario es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            let url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/${encodeURIComponent(userId)}/projects`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyectos del usuario: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene los productos de un usuario
     */
    async obtenerProductosUsuario(accessToken: string, accountId: string, userId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!userId) {
                throw new Error('El ID del usuario es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/${encodeURIComponent(userId)}/products`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener productos del usuario: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene los roles de un usuario
     */
    async obtenerRolesUsuario(accessToken: string, accountId: string, userId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!userId) {
                throw new Error('El ID del usuario es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/${encodeURIComponent(userId)}/roles`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener roles del usuario: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Busca usuarios por nombre
     */
    async buscarUsuarios(accessToken: string, accountId: string, searchTerm: string, filters: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!searchTerm) {
                throw new Error('El término de búsqueda es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            let url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/search`;

            const queryParams: Record<string, string> = {
                name: searchTerm,
            };
            if (filters.limit) queryParams.limit = filters.limit.toString();
            if (filters.offset) queryParams.offset = filters.offset.toString();
            if (filters.operator) queryParams.operator = filters.operator;
            if (filters.partial !== undefined) queryParams.partial = filters.partial.toString();

            url += '?' + new URLSearchParams(queryParams).toString();

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al buscar usuarios: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Actualiza un usuario
     */
    async actualizarUsuario(accessToken: string, accountId: string, userId: string, userData: Record<string, any>, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!userId) {
                throw new Error('El ID del usuario es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/users/${encodeURIComponent(userId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.patch<any>(url, userData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar usuario: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    // ==================== PROJECT USERS API ====================

    /**
     * Obtiene usuarios de un proyecto con filtros avanzados
     */
    async obtenerUsuariosProyecto(accessToken: string, projectId: string, filters: Record<string, any> = {}, region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener usuarios del proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene un usuario específico de un proyecto
     */
    async obtenerUsuarioProyectoPorId(accessToken: string, projectId: string, projectUserId: string, region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!projectUserId) {
                throw new Error('El ID del usuario del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users/${encodeURIComponent(projectUserId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener usuario del proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Busca usuarios en un proyecto
     */
    async buscarUsuariosProyecto(accessToken: string, projectId: string, filters: Record<string, any> = {}, region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users/search`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al buscar usuarios en el proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Agrega un usuario a un proyecto
     */
    async agregarUsuarioProyecto(accessToken: string, projectId: string, userData: Record<string, any>, region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!userData.email) {
                throw new Error('El email es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.post<any>(url, userData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al agregar usuario al proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Importa múltiples usuarios a un proyecto
     */
    async importarUsuariosProyecto(accessToken: string, projectId: string, users: any[], region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!users || users.length === 0) {
                throw new Error('Debe proporcionar al menos un usuario');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users:import`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.post<any>(url, { users }, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al importar usuarios al proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Actualiza un usuario en un proyecto
     */
    async actualizarUsuarioProyecto(accessToken: string, projectId: string, projectUserId: string, userData: Record<string, any>, region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!projectUserId) {
                throw new Error('El ID del usuario del proyecto es requerido');
            }
            if (!userData || Object.keys(userData).length === 0) {
                throw new Error('Debe proporcionar datos para actualizar');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users/${encodeURIComponent(projectUserId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            const response = await this.httpClient.patch<any>(url, userData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar usuario del proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Elimina un usuario de un proyecto
     */
    async eliminarUsuarioProyecto(accessToken: string, projectId: string, projectUserId: string, region?: string, userId?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!projectUserId) {
                throw new Error('El ID del usuario del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/projects/${encodeURIComponent(projectId)}/users/${encodeURIComponent(projectUserId)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
            };

            if (region) {
                headers['Region'] = region;
            }
            if (userId) {
                headers['User-Id'] = userId;
            }

            await this.httpClient.delete<any>(url, { headers });

            return {
                data: null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al eliminar usuario del proyecto: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    // ==================== BUSINESS UNITS API ====================

    /**
     * Obtiene todas las business units de una cuenta
     */
    async obtenerBusinessUnits(accessToken: string, accountId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/business_units_structure`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data.business_units || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener business units: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    /**
     * Obtiene una business unit específica por ID
     */
    async obtenerBusinessUnitPorId(accessToken: string, accountId: string, businessUnitId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!businessUnitId) {
                throw new Error('El ID de la business unit es requerido');
            }

            const resultado = await this.obtenerBusinessUnits(accessToken, accountId, region);
            const businessUnits = resultado.data;

            const businessUnit = businessUnits.find((unit: any) => unit.id === businessUnitId);

            if (!businessUnit) {
                throw new Error(`Business unit no encontrada con ID: ${businessUnitId}`);
            }

            return {
                data: businessUnit,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener business unit: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene business units hijas de una business unit padre
     */
    async obtenerBusinessUnitsHijas(accessToken: string, accountId: string, parentId?: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const resultado = await this.obtenerBusinessUnits(accessToken, accountId, region);
            const businessUnits = resultado.data;

            const hijas = businessUnits.filter((unit: any) => unit.parent_id === parentId);

            return {
                data: hijas,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener business units hijas: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene el árbol jerárquico de business units
     */
    async obtenerArbolBusinessUnits(accessToken: string, accountId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const resultado = await this.obtenerBusinessUnits(accessToken, accountId, region);
            const businessUnits = resultado.data;

            const unitsMap: Record<string, any> = {};
            businessUnits.forEach((unit: any) => {
                unitsMap[unit.id] = { ...unit, children: [] };
            });

            const tree: any[] = [];
            businessUnits.forEach((unit: any) => {
                if (unit.parent_id === null || unit.parent_id === undefined) {
                    tree.push(unitsMap[unit.id]);
                } else {
                    if (unitsMap[unit.parent_id]) {
                        unitsMap[unit.parent_id].children.push(unitsMap[unit.id]);
                    }
                }
            });

            return {
                data: tree,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener árbol de business units: ${error.message}`,
            );
        }
    }

    /**
     * Busca business units por nombre
     */
    async buscarBusinessUnits(accessToken: string, accountId: string, searchTerm: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!searchTerm) {
                throw new Error('El término de búsqueda es requerido');
            }

            const resultado = await this.obtenerBusinessUnits(accessToken, accountId, region);
            const businessUnits = resultado.data;

            const searchTermLower = searchTerm.toLowerCase();
            const resultados = businessUnits.filter((unit: any) => {
                const nameLower = (unit.name || '').toLowerCase();
                const descriptionLower = (unit.description || '').toLowerCase();
                return nameLower.includes(searchTermLower) || descriptionLower.includes(searchTermLower);
            });

            return {
                data: resultados,
            };
        } catch (error: any) {
            throw new Error(
                `Error al buscar business units: ${error.message}`,
            );
        }
    }

    /**
     * Crea o actualiza business units
     */
    async crearOActualizarBusinessUnits(accessToken: string, accountId: string, businessUnits: any[], region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!businessUnits || businessUnits.length === 0) {
                throw new Error('Debe proporcionar al menos una business unit');
            }

            const hqBaseUrl = this.configService.get<string>('ACC_HQ_URL_BASE') || 'https://developer.api.autodesk.com/hq/v1';
            const url = `${hqBaseUrl}/accounts/${encodeURIComponent(accountId)}/business_units_structure`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region;
            }

            const response = await this.httpClient.put<any>(url, { business_units: businessUnits }, { headers });

            return {
                data: response.data.business_units || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear/actualizar business units: ${error.response?.data?.message || error.response?.data?.error || error.message}`,
            );
        }
    }

    // ==================== BIM 360 PROJECTS API ====================

    /**
     * Construye la URL base para BIM 360 Projects API según la región
     */
    private buildBim360ProjectsUrl(accountId: string, region?: string, projectId?: string, endpoint?: string): string {
        const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
        let url = '';

        if (region && region.toUpperCase() !== 'US') {
            url = `${baseUrl}/hq/v1/regions/${region.toLowerCase()}/accounts/${encodeURIComponent(accountId)}/projects`;
        } else {
            url = `${baseUrl}/hq/v1/accounts/${encodeURIComponent(accountId)}/projects`;
        }

        if (projectId) {
            url += `/${encodeURIComponent(projectId)}`;
        }

        if (endpoint) {
            url += `/${endpoint}`;
        }

        return url;
    }

    /**
     * Crea un nuevo proyecto BIM 360
     */
    async crearProyectoBim360(accessToken: string, accountId: string, projectData: Record<string, any>, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const url = this.buildBim360ProjectsUrl(accountId, region);

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region.toUpperCase();
            }

            const response = await this.httpClient.post<any>(url, projectData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear proyecto BIM 360: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene proyectos de una cuenta (Legacy - solo BIM 360)
     */
    async obtenerProyectosLegacy(accessToken: string, accountId: string, filters: Record<string, any> = {}, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            let url = this.buildBim360ProjectsUrl(accountId, region);

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region.toUpperCase();
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyectos legacy: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene proyectos de una cuenta (New - compatible con ACC)
     */
    async obtenerProyectosNew(accessToken: string, accountId: string, filters: Record<string, any> = {}): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/construction/admin/v1/accounts/${encodeURIComponent(accountId)}/projects`;

            if (Object.keys(filters).length > 0) {
                url += '?' + new URLSearchParams(filters as any).toString();
            }

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyectos new: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene un proyecto específico por ID (Legacy)
     */
    async obtenerProyectoPorIdLegacy(accessToken: string, accountId: string, projectId: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const url = this.buildBim360ProjectsUrl(accountId, region, projectId);

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region.toUpperCase();
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyecto legacy: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene un proyecto específico por ID (New - compatible con ACC)
     */
    async obtenerProyectoPorIdNew(accessToken: string, accountId: string, projectId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/construction/admin/v1/accounts/${encodeURIComponent(accountId)}/projects/${encodeURIComponent(projectId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener proyecto new: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza un proyecto BIM 360
     */
    async actualizarProyectoBim360(accessToken: string, accountId: string, projectId: string, updateData: Record<string, any>, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const url = this.buildBim360ProjectsUrl(accountId, region, projectId);

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region.toUpperCase();
            }

            const response = await this.httpClient.patch<any>(url, updateData, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar proyecto BIM 360: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza la imagen de un proyecto BIM 360
     */
    async actualizarImagenProyectoBim360(accessToken: string, accountId: string, projectId: string, imageData: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!imageData) {
                throw new Error('Los datos de la imagen son requeridos');
            }

            const url = this.buildBim360ProjectsUrl(accountId, region, projectId, 'image');

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['Region'] = region.toUpperCase();
            }

            const response = await this.httpClient.patch<any>(url, { image: imageData }, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar imagen del proyecto BIM 360: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene el issueContainerId de un proyecto usando la Data Management API
     */
    async obtenerIssueContainerId(accessToken: string, accountId: string, projectId: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!accountId) {
                throw new Error('El ID de la cuenta es requerido');
            }
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';

            // Convertir accountId a hubId (agregar prefijo 'b.' si no lo tiene)
            const hubId = accountId.startsWith('b.') ? accountId : `b.${accountId}`;

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const url = `${baseUrl}/project/v1/hubs/${encodeURIComponent(hubId)}/projects/${encodeURIComponent(dataManagementProjectId)}`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            // Extraer el issueContainerId
            const projectIdFromResponse = response.data?.data?.id || null;

            if (!projectIdFromResponse) {
                throw new Error('No se pudo obtener el ID del proyecto desde la respuesta');
            }

            // Remover el prefijo 'b.' si existe para obtener el containerId
            const issueContainerId = projectIdFromResponse.startsWith('b.')
                ? projectIdFromResponse.substring(2)
                : projectIdFromResponse;

            return {
                issueContainerId,
                projectId: projectIdFromResponse,
                hubId,
                projectData: response.data?.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener issue container ID: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== DATA MANAGEMENT OSS BUCKETS API ====================

    /**
     * Obtiene los buckets de la aplicación con paginación
     */
    async obtenerBuckets(accessToken: string, region?: string, limit?: number, startAt?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            let url = `${baseUrl}/oss/v2/buckets`;

            const queryParams: Record<string, string> = {};
            if (region) queryParams.region = region;
            if (limit) queryParams.limit = limit.toString();
            if (startAt) queryParams.startAt = startAt;

            if (Object.keys(queryParams).length > 0) {
                url += '?' + new URLSearchParams(queryParams).toString();
            }

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data.items || [],
                next: response.data.next || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener buckets: ${error.response?.data?.reason || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene los detalles de un bucket específico
     */
    async obtenerDetallesBucket(accessToken: string, bucketKey: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!bucketKey) {
                throw new Error('El bucket key es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/details`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['region'] = region;
            }

            const response = await this.httpClient.get<any>(url, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al obtener detalles del bucket: ${error.response?.data?.reason || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un nuevo bucket
     */
    async crearBucket(accessToken: string, bucketKey: string, policyKey: string = 'transient', region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!bucketKey) {
                throw new Error('El bucket key es requerido');
            }

            const validPolicies = ['transient', 'temporary', 'persistent'];
            if (!validPolicies.includes(policyKey)) {
                throw new Error('Policy key inválido. Valores permitidos: transient, temporary, persistent');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets`;

            const payload = {
                bucketKey,
                policyKey,
            };

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };

            if (region) {
                headers['region'] = region;
            }

            const response = await this.httpClient.post<any>(url, payload, { headers });

            return {
                data: response.data,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear bucket: ${error.response?.data?.reason || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Elimina un bucket
     */
    async eliminarBucket(accessToken: string, bucketKey: string, region?: string): Promise<any> {
        try {
            if (!accessToken) {
                throw new Error('El token de acceso es requerido');
            }
            if (!bucketKey) {
                throw new Error('El bucket key es requerido');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}`;

            const headers: Record<string, string> = {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            };

            if (region) {
                headers['region'] = region;
            }

            await this.httpClient.delete<any>(url, { headers });

            return {
                message: 'Bucket eliminado exitosamente',
            };
        } catch (error: any) {
            throw new Error(
                `Error al eliminar bucket: ${error.response?.data?.reason || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea storage para subir un archivo a una carpeta específica
     */
    async crearStorageParaItem(accessToken: string, projectId: string, folderId: string, fileName: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !folderId || !fileName) {
                throw new Error('Token, projectId, folderId y fileName son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/storage`;

            const storageData = {
                jsonapi: {
                    version: '1.0',
                },
                data: {
                    type: 'objects',
                    attributes: {
                        name: fileName,
                    },
                    relationships: {
                        target: {
                            data: {
                                type: 'folders',
                                id: folderId,
                            },
                        },
                    },
                },
            };

            const response = await this.httpClient.post<any>(url, storageData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                success: true,
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear storage: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Obtiene URL firmada de S3 para subir archivo
     */
    async obtenerUrlFirmadaS3(accessToken: string, bucketKey: string, objectKey: string, parts: number = 1): Promise<any> {
        try {
            if (!accessToken || !bucketKey || !objectKey) {
                throw new Error('Token, bucketKey y objectKey son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3upload?parts=${parts}&minutesExpiration=5`;

            const response = await this.httpClient.get<any>(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al obtener URL firmada de S3: ${error.response?.data?.reason || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Sube archivo a URL firmada de S3
     */
    async subirArchivoAUrlFirmada(signedUrl: string, fileBuffer: Buffer): Promise<any> {
        try {
            if (!signedUrl || !fileBuffer) {
                throw new Error('Signed URL y file buffer son requeridos');
            }

            const response = await this.httpClient.put<any>(signedUrl, fileBuffer, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': fileBuffer.length.toString(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });

            return {
                success: true,
                statusCode: response.status || 200,
            };
        } catch (error: any) {
            throw new Error(
                `Error al subir archivo a S3: ${error.response?.status || error.status || 'Unknown'} - ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Completa la subida del archivo
     */
    async completarSubida(accessToken: string, bucketKey: string, objectKey: string, uploadKey: string): Promise<any> {
        try {
            if (!accessToken || !bucketKey || !objectKey || !uploadKey) {
                throw new Error('Token, bucketKey, objectKey y uploadKey son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3upload`;

            const payload = {
                uploadKey,
            };

            const response = await this.httpClient.post<any>(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            return response.data;
        } catch (error: any) {
            throw new Error(
                `Error al completar subida: ${error.response?.data?.reason || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea un item (archivo) en un proyecto
     */
    async crearItem(accessToken: string, projectId: string, itemData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemData) {
                throw new Error('Token, projectId y itemData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items`;

            const response = await this.httpClient.post<any>(url, itemData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                success: true,
                data: response.data.data || null,
                included: response.data.included || [],
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear item: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Crea una referencia en un item
     */
    async crearReferenciaItem(accessToken: string, projectId: string, itemId: string, refData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId || !refData) {
                throw new Error('Token, projectId, itemId y refData son requeridos');
            }

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/relationships/refs`;

            const body = {
                jsonapi: { version: '1.0' },
                data: refData,
            };

            const response = await this.httpClient.post<any>(url, body, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                success: true,
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al crear referencia: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Actualiza un item
     */
    async actualizarItem(accessToken: string, projectId: string, itemId: string, itemData: any): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId || !itemData) {
                throw new Error('Token, projectId, itemId y itemData son requeridos');
            }

            // Asegurar que projectId tenga el prefijo 'b.' para Data Management API
            const dataManagementProjectId = projectId.startsWith('b.') ? projectId : `b.${projectId}`;

            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(dataManagementProjectId)}/items/${encodeURIComponent(itemId)}`;

            const response = await this.httpClient.patch<any>(url, itemData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                success: true,
                data: response.data.data || null,
            };
        } catch (error: any) {
            throw new Error(
                `Error al actualizar item: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Elimina un item (marca como eliminado creando versión Deleted)
     */
    async eliminarItem(accessToken: string, projectId: string, itemId: string): Promise<any> {
        try {
            if (!accessToken || !projectId || !itemId) {
                throw new Error('Token, projectId y itemId son requeridos');
            }

            // Paso 1: Validar la versión tip para evitar duplicar eliminaciones
            const tipInfo = await this.obtenerTipVersion(accessToken, projectId, itemId);
            const tipData = tipInfo.data || null;
            const tipExtension = tipData?.attributes?.extension?.type || null;

            if (tipExtension && tipExtension.toLowerCase().includes('deleted')) {
                return {
                    success: true,
                    message: 'El item ya estaba marcado como eliminado mediante versión Deleted',
                    data: tipData,
                    wasAlreadyDeleted: true,
                };
            }

            // Paso 2: Crear la versión Deleted
            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions`;

            const payload = {
                jsonapi: {
                    version: '1.0',
                },
                data: {
                    type: 'versions',
                    attributes: {
                        extension: {
                            type: 'versions:autodesk.core:Deleted',
                            version: '1.0',
                        },
                    },
                    relationships: {
                        item: {
                            data: {
                                type: 'items',
                                id: itemId,
                            },
                        },
                    },
                },
            };

            const response = await this.httpClient.post<any>(url, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/vnd.api+json',
                },
            });

            return {
                success: true,
                message: 'Item marcado como eliminado creando versión Deleted',
                data: response.data.data || null,
                deletedAt: new Date().toISOString(),
                wasAlreadyDeleted: false,
            };
        } catch (error: any) {
            throw new Error(
                `Error al eliminar item: ${error.response?.data?.errors?.[0]?.detail || error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== OSS / S3 UPLOAD API ====================

    /**
     * Obtiene una URL firmada para subir archivo a S3 (Direct to S3)
     */
    async obtenerUrlFirmadaS3Upload(accessToken: string, bucketKey: string, objectKey: string): Promise<any> {
        try {
            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3upload?parts=1&minutesExpiration=5`;

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
                `Error al obtener URL firmada S3: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Sube un archivo a S3 usando una URL firmada
     */
    async subirArchivoS3(uploadUrl: string, content: Buffer | string, contentType: string): Promise<any> {
        try {
            // Note: direct axios call might be needed if httpClient wraps too much
            // Assuming httpClient supports custom headers and raw body
            const response = await this.httpClient.put<any>(uploadUrl, content, {
                headers: {
                    'Content-Type': contentType,
                    // Content-Length is usually set automatically by axios for Buffers
                },
            });

            return {
                status: response.status,
            };
        } catch (error: any) {
            throw new Error(
                `Error al subir archivo a S3: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    /**
     * Finaliza la subida a S3
     */
    async finalizarUploadS3(accessToken: string, bucketKey: string, objectKey: string, uploadKey: string): Promise<any> {
        try {
            const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
            const url = `${baseUrl}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3upload`;

            const body = {
                uploadKey: uploadKey,
            };

            const response = await this.httpClient.post<any>(url, body, {
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
                `Error al finalizar subida S3: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // ==================== ISSUE THUMBNAIL HELPERS ====================

    /**
     * Intenta resolver el Data Management Project ID a partir de un Issues Project ID
     */
    private async resolverDataManagementProjectId(accessToken: string, issuesProjectId: string): Promise<{ hubId: string, projectId: string } | null> {
        // Método 1: Verificar si ya es correcto (b. o urn:)
        if (issuesProjectId.startsWith('b.') || issuesProjectId.startsWith('urn:')) {
            const hubId = await this.obtenerHubIdDesdeProjectId(accessToken, issuesProjectId);
            if (hubId) {
                return { hubId, projectId: issuesProjectId };
            }
        }

        // Método 2: Buscar en todos los hubs (costoso pero necesario)
        const hubsResponse = await this.obtenerHubs(accessToken);
        const hubs = hubsResponse.data || [];

        for (const hub of hubs) {
            const projectsResponse = await this.obtenerProyectos(accessToken, hub.id);
            const projects = projectsResponse.data || [];

            for (const project of projects) {
                const projectId = project.id;
                const containerId = project.attributes?.extension?.data?.containerId;

                // Match por containerId (UUID issues)
                if (containerId === issuesProjectId) {
                    return { hubId: hub.id, projectId };
                }

                // Match por ID sin prefijo
                const cleanId = projectId.startsWith('b.') ? projectId.substring(2) : projectId;
                if (cleanId === issuesProjectId) {
                    return { hubId: hub.id, projectId };
                }
            }
        }

        return null;
    }

    /**
     * Obtiene el Hub ID dado un Project ID de Data Management
     */
    private async obtenerHubIdDesdeProjectId(accessToken: string, projectId: string): Promise<string | null> {
        try {
            const hubsResponse = await this.obtenerHubs(accessToken);
            const hubs = hubsResponse.data || [];

            for (const hub of hubs) {
                // Verificar proyecto en hub
                try {
                    await this.obtenerHubDeProyecto(accessToken, hub.id, projectId);
                    return hub.id;
                } catch (e) {
                    continue; // No está en este hub
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Sube una miniatura para una incidencia usando el flujo Direct-to-S3
     */
    async subirMiniaturaIssue(
        accessToken: string,
        projectId: string,
        content: Buffer | string,
        filename: string,
        contentType: string
    ): Promise<{ success: boolean; urn?: string; error?: string }> {
        try {
            const normalizedProjectId = this.normalizarProjectId(projectId);

            // 1. Resolver Hub y Project ID correctos
            const dmInfo = await this.resolverDataManagementProjectId(accessToken, normalizedProjectId);

            if (!dmInfo) {
                // Fallback si no se encuentra (puede pasar en algunos entornos de prueba)
                return { success: false, error: 'No se pudo resolver el Project ID de Data Management' };
            }

            const { hubId, projectId: dmProjectId } = dmInfo;

            // 2. Obtener Root Folder (Project Files)
            let rootFolderId = null;
            const topFolders = await this.obtenerCarpetasPrincipales(accessToken, hubId, dmProjectId);
            const folders = topFolders.data || [];

            const projectFiles = folders.find((f: any) => f.attributes?.name === 'Project Files' || f.attributes?.displayName === 'Project Files');
            if (projectFiles) {
                rootFolderId = projectFiles.id; // Usually we want the parent? PHP logic got parent. But storage goes TO a folder.
                // Wait, PHP logic: if name==Project Files, return folder['relationships']['parent']['data']['id']. 
                // Why parent? Maybe strict schema requirements? 
                // Actually if target is 'folders', we usually target the folder itself.
                // Let's stick to targeting the Project Files folder or the root of the project.
                // PHP code: return $folder['relationships']['parent']['data']['id']; 
                // This implies it puts it in the PARENT of Project Files? That's usually the Project Root. 
                // Let's assume targeting 'Project Files' is safe if we can't find parent.
                // But let's trust PHP logic: look for parent of Project Files.
                if (projectFiles.relationships?.parent?.data?.id) {
                    rootFolderId = projectFiles.relationships.parent.data.id;
                } else {
                    rootFolderId = projectFiles.id;
                }
            } else if (folders.length > 0) {
                // Fallback to first folder's parent
                if (folders[0].relationships?.parent?.data?.id) {
                    rootFolderId = folders[0].relationships.parent.data.id;
                } else {
                    rootFolderId = folders[0].id;
                }
            }

            if (!rootFolderId) {
                return { success: false, error: 'No se pudo obtener el Root Folder' };
            }

            // 3. Crear Storage Location
            const storageData = {
                type: 'objects',
                attributes: {
                    name: filename,
                },
                relationships: {
                    target: {
                        data: {
                            type: 'folders',
                            id: rootFolderId,
                        },
                    },
                },
            };

            const storageResult = await this.crearStorage(accessToken, dmProjectId, storageData);
            const storageId = storageResult.data?.id;

            if (!storageId) {
                return { success: false, error: 'Error creando storage location' };
            }

            // 4. Extraer Bucket y Object Key
            // urn:adsk.objects:os.object:bucketKey/objectKey
            const regex = /urn:adsk\.objects:os\.object:([^\/]+)\/(.+)/;
            const matches = storageId.match(regex);

            if (!matches || matches.length !== 3) {
                return { success: false, error: 'Formato de Storage ID inválido' };
            }

            const bucketKey = matches[1];
            const objectKey = matches[2];

            // 5. Obtener URL Firmada S3
            const signedData = await this.obtenerUrlFirmadaS3Upload(accessToken, bucketKey, objectKey);
            if (!signedData.data?.urls?.[0] || !signedData.data?.uploadKey) {
                return { success: false, error: 'No se recibió URL firmada' };
            }

            const uploadUrl = signedData.data.urls[0];
            const uploadKey = signedData.data.uploadKey;

            // 6. Subir archivo
            await this.subirArchivoS3(uploadUrl, content, contentType);

            // 7. Finalizar Subida
            const finishResult = await this.finalizarUploadS3(accessToken, bucketKey, objectKey, uploadKey);

            const urn = finishResult.data?.objectId; // or id? PHP looks for objectId in response

            if (urn) {
                return { success: true, urn };
            } else if (finishResult.data?.id) {
                return { success: true, urn: finishResult.data.id };
            }

            return { success: false, error: 'No se recibió URN final' };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}


