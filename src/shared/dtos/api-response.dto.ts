export interface PaginationMeta {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

export interface ApiResponse<T = any> {
    data: T;
    message: string;
    status: number;
    pagination?: PaginationMeta;
}

export class ApiResponseDto<T = any> {
    data: T;
    message: string;
    status: number;
    pagination?: PaginationMeta;

    constructor(data: T, message: string, status: number, pagination?: PaginationMeta) {
        this.data = data;
        this.message = message;
        this.status = status;
        if (pagination) {
            this.pagination = pagination;
        }
    }

    // 200 - Success
    static success<T>(data: T, message: string = 'Operación exitosa'): ApiResponseDto<T> {
        return new ApiResponseDto(data, message, 200);
    }

    // 201 - Created
    static created<T>(data: T, message: string = 'Recurso creado exitosamente'): ApiResponseDto<T> {
        return new ApiResponseDto(data, message, 201);
    }

    // 200 - Updated
    static updated<T>(data: T, message: string = 'Recurso actualizado exitosamente'): ApiResponseDto<T> {
        return new ApiResponseDto(data, message, 200);
    }

    // 200 - Deleted
    static deleted<T = null>(data: T = null as T, message: string = 'Recurso eliminado exitosamente'): ApiResponseDto<T> {
        return new ApiResponseDto(data, message, 200);
    }

    // 204 - No Content (for delete without response body)
    static noContent(message: string = 'Operación completada sin contenido'): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, 204);
    }

    // 404 - Not Found
    static notFound(message: string = 'Recurso no encontrado'): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, 404);
    }

    // 400 - Bad Request
    static badRequest(message: string = 'Solicitud incorrecta'): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, 400);
    }

    // 401 - Unauthorized
    static unauthorized(message: string = 'No autorizado'): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, 401);
    }

    // 403 - Forbidden
    static forbidden(message: string = 'Acceso prohibido'): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, 403);
    }

    // 409 - Conflict
    static conflict(message: string = 'Conflicto con el estado actual del recurso'): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, 409);
    }

    // 500 - Internal Server Error
    static error(message: string = 'Error interno del servidor', status: number = 500): ApiResponseDto<null> {
        return new ApiResponseDto(null, message, status);
    }

    // 200 - Paginated Response
    static paginated<T>(
        data: T,
        pagination: PaginationMeta,
        message: string = 'Datos obtenidos exitosamente',
    ): ApiResponseDto<T> {
        return new ApiResponseDto(data, message, 200, pagination);
    }

    // Custom response with any status code
    static custom<T>(data: T, message: string, status: number, pagination?: PaginationMeta): ApiResponseDto<T> {
        return new ApiResponseDto(data, message, status, pagination);
    }
}
