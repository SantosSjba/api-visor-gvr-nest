import { Request } from 'express';

export interface RequestInfo {
    ipAddress: string;
    userAgent: string;
    userId: number;
}

export class RequestInfoHelper {
    static extract(request: Request): RequestInfo {
        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        
        // Obtener IP address
        const ipAddress = 
            (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (request.headers['x-real-ip'] as string) ||
            request.socket.remoteAddress ||
            'unknown';

        // Obtener User-Agent
        const userAgent = request.headers['user-agent'] || 'unknown';

        return {
            ipAddress,
            userAgent,
            userId: userId ? parseInt(userId.toString(), 10) : 0,
        };
    }
}

