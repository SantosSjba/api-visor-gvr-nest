import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const { method, url, body, query, params, ip } = request;
        const userAgent = request.get('user-agent') || '';
        const startTime = Date.now();

        // Log de la petición entrante
        this.logger.log(
            `📥 ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
        );

        // Log del body si existe (excepto passwords)
        if (body && Object.keys(body).length > 0) {
            const sanitizedBody = this.sanitizeBody(body);
            this.logger.log(`   Body: ${JSON.stringify(sanitizedBody)}`);
        }

        // Log de query params si existen
        if (query && Object.keys(query).length > 0) {
            this.logger.log(`   Query: ${JSON.stringify(query)}`);
        }

        // Log de params si existen
        if (params && Object.keys(params).length > 0) {
            this.logger.log(`   Params: ${JSON.stringify(params)}`);
        }

        return next.handle().pipe(
            tap((data) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                const statusEmoji = this.getStatusEmoji(statusCode);

                this.logger.log(
                    `${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`,
                );

                // Log de la respuesta
                if (data) {
                    this.logger.log(`   Response: ${JSON.stringify(data)}`);
                }
            }),
            catchError((error) => {
                const duration = Date.now() - startTime;
                const statusCode = error.status || 500;
                const statusEmoji = this.getStatusEmoji(statusCode);

                this.logger.error(
                    `${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`,
                );
                this.logger.error(`   Error: ${error.message}`);

                if (error.stack) {
                    this.logger.log(`   Stack: ${error.stack}`);
                }

                throw error;
            }),
        );
    }

    /**
     * Sanitiza el body removiendo campos sensibles como passwords
     */
    private sanitizeBody(body: any): any {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        const sanitized = { ...body };

        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    /**
     * Retorna un emoji basado en el código de estado HTTP
     */
    private getStatusEmoji(statusCode: number): string {
        if (statusCode >= 200 && statusCode < 300) {
            return '✅'; // Success
        } else if (statusCode >= 300 && statusCode < 400) {
            return '🔄'; // Redirect
        } else if (statusCode >= 400 && statusCode < 500) {
            return '⚠️'; // Client error
        } else if (statusCode >= 500) {
            return '❌'; // Server error
        }
        return '📋'; // Other
    }
}
