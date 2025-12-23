import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Error interno del servidor';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || message;

                // Handle validation errors
                if (Array.isArray(responseObj.message)) {
                    message = responseObj.message.join(', ');
                }
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        const errorResponse = ApiResponseDto.error(message, status);

        response.status(status).json(errorResponse);
    }
}
