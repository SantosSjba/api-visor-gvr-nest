import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import {
    ObtenerBucketsUseCase,
    ObtenerDetallesBucketUseCase,
    CrearBucketUseCase,
    EliminarBucketUseCase,
} from '../../application/use-cases/data-management/buckets';
import {
    ObtenerBucketsDto,
    CrearBucketDto,
} from '../../application/dtos/data-management/buckets';

@Controller('data-management/buckets')
@UseGuards(JwtAuthGuard)
export class DataManagementBucketsController {
    constructor(
        private readonly obtenerBucketsUseCase: ObtenerBucketsUseCase,
        private readonly obtenerDetallesBucketUseCase: ObtenerDetallesBucketUseCase,
        private readonly crearBucketUseCase: CrearBucketUseCase,
        private readonly eliminarBucketUseCase: EliminarBucketUseCase,
    ) { }

    /**
     * GET - Obtener todos los buckets con paginación
     * GET /data-management/buckets
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async obtenerBuckets(
        @Req() request: Request,
        @Query() dto: ObtenerBucketsDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerBucketsUseCase.execute(user.sub, dto);

        return ApiResponseDto.success(
            {
                buckets: resultado.data,
                next: resultado.next,
            },
            'Buckets obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener detalles de un bucket específico
     * GET /data-management/buckets/:bucketKey/details
     */
    @Get(':bucketKey/details')
    @HttpCode(HttpStatus.OK)
    async obtenerDetallesBucket(
        @Req() request: Request,
        @Param('bucketKey') bucketKey: string,
        @Query('region') region?: string,
    ) {
        if (!bucketKey) {
            throw new BadRequestException('El bucket key es requerido');
        }

        const user = (request as any).user;
        const resultado = await this.obtenerDetallesBucketUseCase.execute(user.sub, bucketKey, region);

        return ApiResponseDto.success(
            resultado.data,
            'Detalles del bucket obtenidos exitosamente',
        );
    }

    /**
     * POST - Crear un nuevo bucket
     * POST /data-management/buckets
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearBucket(
        @Req() request: Request,
        @Body() dto: CrearBucketDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.crearBucketUseCase.execute(user.sub, dto);

        return ApiResponseDto.created(
            resultado.data,
            'Bucket creado exitosamente',
        );
    }

    /**
     * DELETE - Eliminar un bucket
     * DELETE /data-management/buckets/:bucketKey
     */
    @Delete(':bucketKey')
    @HttpCode(HttpStatus.OK)
    async eliminarBucket(
        @Req() request: Request,
        @Param('bucketKey') bucketKey: string,
        @Query('region') region?: string,
    ) {
        if (!bucketKey) {
            throw new BadRequestException('El bucket key es requerido');
        }

        const user = (request as any).user;
        const resultado = await this.eliminarBucketUseCase.execute(user.sub, bucketKey, region);

        return ApiResponseDto.success(
            null,
            resultado.message,
        );
    }
}

