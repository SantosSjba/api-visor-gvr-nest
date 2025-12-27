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
}
