import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

// Use cases
import { ObtenerProyectosHubUseCase } from '../../application/use-cases/data-management/projects/obtener-proyectos-hub.use-case';
import { ObtenerProyectoHubPorIdUseCase } from '../../application/use-cases/data-management/projects/obtener-proyecto-hub-por-id.use-case';
import { ObtenerHubDeProyectoUseCase } from '../../application/use-cases/data-management/projects/obtener-hub-de-proyecto.use-case';
import { ObtenerCarpetasPrincipalesUseCase } from '../../application/use-cases/data-management/projects/obtener-carpetas-principales.use-case';
import { CrearStorageUseCase } from '../../application/use-cases/data-management/projects/crear-storage.use-case';
import { CrearDescargaUseCase } from '../../application/use-cases/data-management/projects/crear-descarga.use-case';
import { ObtenerEstadoDescargaUseCase } from '../../application/use-cases/data-management/projects/obtener-estado-descarga.use-case';
import { ObtenerEstadoJobUseCase } from '../../application/use-cases/data-management/projects/obtener-estado-job.use-case';

// DTOs
import { ObtenerProyectosDto } from '../../application/dtos/data-management/projects/obtener-proyectos.dto';
import { ObtenerProyectoPorIdDto } from '../../application/dtos/data-management/projects/obtener-proyecto-por-id.dto';
import { ObtenerHubDeProyectoDto } from '../../application/dtos/data-management/projects/obtener-hub-de-proyecto.dto';
import { ObtenerCarpetasPrincipalesDto } from '../../application/dtos/data-management/projects/obtener-carpetas-principales.dto';
import { CrearStorageDto } from '../../application/dtos/data-management/projects/crear-storage.dto';
import { CrearDescargaDto } from '../../application/dtos/data-management/projects/crear-descarga.dto';
import { ObtenerEstadoDescargaDto } from '../../application/dtos/data-management/projects/obtener-estado-descarga.dto';
import { ObtenerEstadoJobDto } from '../../application/dtos/data-management/projects/obtener-estado-job.dto';

@Controller('data-management/projects')
@UseGuards(JwtAuthGuard)
export class DataManagementProjectsController {
    constructor(
        private readonly obtenerProyectosHubUseCase: ObtenerProyectosHubUseCase,
        private readonly obtenerProyectoHubPorIdUseCase: ObtenerProyectoHubPorIdUseCase,
        private readonly obtenerHubDeProyectoUseCase: ObtenerHubDeProyectoUseCase,
        private readonly obtenerCarpetasPrincipalesUseCase: ObtenerCarpetasPrincipalesUseCase,
        private readonly crearStorageUseCase: CrearStorageUseCase,
        private readonly crearDescargaUseCase: CrearDescargaUseCase,
        private readonly obtenerEstadoDescargaUseCase: ObtenerEstadoDescargaUseCase,
        private readonly obtenerEstadoJobUseCase: ObtenerEstadoJobUseCase,
    ) { }

    /**
     * GET - Obtener proyectos de un hub específico
     * GET /data-management/projects/hubs/:hubId/projects
     */
    @Get('hubs/:hubId/projects')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectos(
        @Req() request: Request,
        @Param('hubId') hubId: string,
        @Query() dto: ObtenerProyectosDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerProyectosHubUseCase.execute(user.sub, hubId, dto);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Proyectos obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener un proyecto específico por ID
     * GET /data-management/projects/hubs/:hubId/projects/:projectId
     */
    @Get('hubs/:hubId/projects/:projectId')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectoPorId(
        @Req() request: Request,
        @Param('hubId') hubId: string,
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerProyectoPorIdDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerProyectoHubPorIdUseCase.execute(user.sub, hubId, projectId, dto);

        return ApiResponseDto.success(
            resultado.data,
            'Proyecto obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener el hub de un proyecto específico
     * GET /data-management/projects/hubs/:hubId/projects/:projectId/hub
     */
    @Get('hubs/:hubId/projects/:projectId/hub')
    @HttpCode(HttpStatus.OK)
    async obtenerHubDeProyecto(
        @Req() request: Request,
        @Param('hubId') hubId: string,
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerHubDeProyectoDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerHubDeProyectoUseCase.execute(user.sub, hubId, projectId, dto);

        return ApiResponseDto.success(
            resultado.data,
            'Hub de proyecto obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener carpetas principales (top folders) de un proyecto
     * GET /data-management/projects/hubs/:hubId/projects/:projectId/topFolders
     */
    @Get('hubs/:hubId/projects/:projectId/topFolders')
    @HttpCode(HttpStatus.OK)
    async obtenerCarpetasPrincipales(
        @Req() request: Request,
        @Param('hubId') hubId: string,
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerCarpetasPrincipalesDto,
    ) {
        const user = (request as any).user;
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;
        const resultado = await this.obtenerCarpetasPrincipalesUseCase.execute(user.sub, hubId, projectId, dto, userRole);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Carpetas principales obtenidas exitosamente',
        );
    }

    /**
     * POST - Crear storage para subir archivos
     * POST /data-management/projects/:projectId/storage
     */
    @Post(':projectId/storage')
    @HttpCode(HttpStatus.CREATED)
    async crearStorage(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Body() dto: CrearStorageDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.crearStorageUseCase.execute(user.sub, projectId, dto);

        return ApiResponseDto.success(
            resultado.data,
            'Storage creado exitosamente',
        );
    }

    /**
     * POST - Crear descarga batch
     * POST /data-management/projects/:projectId/downloads
     */
    @Post(':projectId/downloads')
    @HttpCode(HttpStatus.CREATED)
    async crearDescarga(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Body() dto: CrearDescargaDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.crearDescargaUseCase.execute(user.sub, projectId, dto);

        return ApiResponseDto.success(
            resultado.data,
            'Descarga creada exitosamente',
        );
    }

    /**
     * GET - Obtener estado de descarga
     * GET /data-management/projects/:projectId/downloads/:downloadId
     */
    @Get(':projectId/downloads/:downloadId')
    @HttpCode(HttpStatus.OK)
    async obtenerEstadoDescarga(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('downloadId') downloadId: string,
        @Query() dto: ObtenerEstadoDescargaDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerEstadoDescargaUseCase.execute(user.sub, projectId, downloadId, dto);

        return ApiResponseDto.success(
            resultado.data,
            'Estado de descarga obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener estado de job
     * GET /data-management/projects/:projectId/jobs/:jobId
     */
    @Get(':projectId/jobs/:jobId')
    @HttpCode(HttpStatus.OK)
    async obtenerEstadoJob(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('jobId') jobId: string,
        @Query() dto: ObtenerEstadoJobDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerEstadoJobUseCase.execute(user.sub, projectId, jobId, dto);

        return ApiResponseDto.success(
            resultado.data,
            'Estado de job obtenido exitosamente',
        );
    }
}
