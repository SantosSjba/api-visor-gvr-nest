import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import {
    CrearProyectoBim360UseCase,
    ObtenerProyectosLegacyUseCase,
    ObtenerProyectosNewUseCase,
    ObtenerProyectoPorIdLegacyUseCase,
    ObtenerProyectoPorIdNewUseCase,
    ActualizarProyectoBim360UseCase,
    ActualizarImagenProyectoBim360UseCase,
    ObtenerIssueContainerIdUseCase,
} from '../../application/use-cases/bim360/projects';
import {
    CrearProyectoBim360Dto,
    ObtenerProyectosLegacyDto,
    ObtenerProyectosNewDto,
    ActualizarProyectoBim360Dto,
    ActualizarImagenProyectoBim360Dto,
} from '../../application/dtos/bim360/projects';

@Controller('bim360/projects')
@UseGuards(JwtAuthGuard)
export class Bim360ProjectsController {
    constructor(
        private readonly crearProyectoBim360UseCase: CrearProyectoBim360UseCase,
        private readonly obtenerProyectosLegacyUseCase: ObtenerProyectosLegacyUseCase,
        private readonly obtenerProyectosNewUseCase: ObtenerProyectosNewUseCase,
        private readonly obtenerProyectoPorIdLegacyUseCase: ObtenerProyectoPorIdLegacyUseCase,
        private readonly obtenerProyectoPorIdNewUseCase: ObtenerProyectoPorIdNewUseCase,
        private readonly actualizarProyectoBim360UseCase: ActualizarProyectoBim360UseCase,
        private readonly actualizarImagenProyectoBim360UseCase: ActualizarImagenProyectoBim360UseCase,
        private readonly obtenerIssueContainerIdUseCase: ObtenerIssueContainerIdUseCase,
    ) { }

    /**
     * GET - Obtener proyectos de una cuenta (Legacy)
     * GET /bim360/projects/:accountId/legacy
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/legacy')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectosLegacy(
        @Param('accountId') accountId: string,
        @Query() dto: ObtenerProyectosLegacyDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.obtenerProyectosLegacyUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Proyectos BIM 360 obtenidos exitosamente (legacy)',
        );
    }

    /**
     * GET - Obtener proyectos de una cuenta (New - compatible con ACC)
     * GET /bim360/projects/:accountId/new
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/new')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectosNew(
        @Param('accountId') accountId: string,
        @Query() dto: ObtenerProyectosNewDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.obtenerProyectosNewUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Proyectos obtenidos exitosamente (new - ACC compatible)',
        );
    }

    /**
     * GET - Obtener un proyecto específico por ID (Legacy)
     * GET /bim360/projects/:accountId/:projectId/legacy
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/:projectId/legacy')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectoPorIdLegacy(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
        @Query('region') region?: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.obtenerProyectoPorIdLegacyUseCase.execute(accountId, projectId, region);
        return ApiResponseDto.success(
            resultado.data,
            'Proyecto BIM 360 obtenido exitosamente (legacy)',
        );
    }

    /**
     * GET - Obtener un proyecto específico por ID (New - compatible con ACC)
     * GET /bim360/projects/:accountId/:projectId/new
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/:projectId/new')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectoPorIdNew(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.obtenerProyectoPorIdNewUseCase.execute(accountId, projectId);
        return ApiResponseDto.success(
            resultado.data,
            'Proyecto obtenido exitosamente (new - ACC compatible)',
        );
    }

    /**
     * GET - Obtener el issueContainerId de un proyecto
     * GET /bim360/projects/:accountId/:projectId/issue-container-id
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/:projectId/issue-container-id')
    @HttpCode(HttpStatus.OK)
    async obtenerIssueContainerId(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.obtenerIssueContainerIdUseCase.execute(accountId, projectId);
        return ApiResponseDto.success(
            resultado,
            'Issue Container ID obtenido exitosamente',
        );
    }

    /**
     * PATCH - Actualizar imagen de un proyecto BIM 360
     * PATCH /bim360/projects/:accountId/:projectId/image
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Patch(':accountId/:projectId/image')
    @HttpCode(HttpStatus.OK)
    async actualizarImagenProyecto(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
        @Body() dto: ActualizarImagenProyectoBim360Dto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.actualizarImagenProyectoBim360UseCase.execute(accountId, projectId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Imagen del proyecto BIM 360 actualizada exitosamente',
        );
    }

    /**
     * POST - Crear un nuevo proyecto BIM 360
     * POST /bim360/projects/:accountId
     */
    @Post(':accountId')
    @HttpCode(HttpStatus.CREATED)
    async crearProyecto(
        @Param('accountId') accountId: string,
        @Body() dto: CrearProyectoBim360Dto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.crearProyectoBim360UseCase.execute(accountId, dto);
        return ApiResponseDto.created(
            resultado.data,
            'Proyecto BIM 360 creado exitosamente',
        );
    }

    /**
     * PATCH - Actualizar un proyecto BIM 360
     * PATCH /bim360/projects/:accountId/:projectId
     */
    @Patch(':accountId/:projectId')
    @HttpCode(HttpStatus.OK)
    async actualizarProyecto(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
        @Body() dto: ActualizarProyectoBim360Dto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.actualizarProyectoBim360UseCase.execute(accountId, projectId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Proyecto BIM 360 actualizado exitosamente',
        );
    }
}

