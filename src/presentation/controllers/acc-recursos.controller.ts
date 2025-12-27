import {
    Controller,
    Get,
    Post,
    Put,
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
    GuardarRecursoUseCase,
    ObtenerRecursoUseCase,
    ActualizarRecursoUseCase,
    ObtenerRecursosUsuarioUseCase,
    ObtenerRecursosProyectoUseCase,
    ObtenerRecursosHijosUseCase,
} from '../../application/use-cases/acc-recursos';
import {
    GuardarRecursoDto,
    ActualizarRecursoDto,
    ObtenerRecursosUsuarioDto,
    ObtenerRecursosProyectoDto,
    ObtenerRecursosHijosDto,
} from '../../application/dtos/acc-recursos';

@Controller('acc-recursos')
@UseGuards(JwtAuthGuard)
export class AccRecursosController {
    constructor(
        private readonly guardarRecursoUseCase: GuardarRecursoUseCase,
        private readonly obtenerRecursoUseCase: ObtenerRecursoUseCase,
        private readonly actualizarRecursoUseCase: ActualizarRecursoUseCase,
        private readonly obtenerRecursosUsuarioUseCase: ObtenerRecursosUsuarioUseCase,
        private readonly obtenerRecursosProyectoUseCase: ObtenerRecursosProyectoUseCase,
        private readonly obtenerRecursosHijosUseCase: ObtenerRecursosHijosUseCase,
    ) { }

    /**
     * GET - Obtener recursos de un usuario
     * GET /acc-recursos/usuario/:id
     * IMPORTANTE: Esta ruta debe ir antes de la ruta genérica :tipo/:id
     */
    @Get('usuario/:id')
    @HttpCode(HttpStatus.OK)
    async obtenerRecursosUsuario(
        @Param('id') id: string,
        @Query() dto: ObtenerRecursosUsuarioDto,
    ) {
        const idNumero = parseInt(id, 10);
        if (isNaN(idNumero)) {
            throw new BadRequestException('El ID debe ser un número válido');
        }

        const resultado = await this.obtenerRecursosUsuarioUseCase.execute(idNumero, dto);
        return ApiResponseDto.paginated(
            resultado.data,
            resultado.pagination,
            'Recursos de usuario obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener recursos por proyecto
     * GET /acc-recursos/proyecto/:projectId
     * IMPORTANTE: Esta ruta debe ir antes de la ruta genérica :tipo/:id
     */
    @Get('proyecto/:projectId')
    @HttpCode(HttpStatus.OK)
    async obtenerRecursosPorProyecto(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerRecursosProyectoDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.obtenerRecursosProyectoUseCase.execute(projectId, dto);
        return ApiResponseDto.paginated(
            resultado.data,
            resultado.pagination,
            'Recursos del proyecto obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener recursos hijos
     * GET /acc-recursos/hijos/:parentId
     * IMPORTANTE: Esta ruta debe ir antes de la ruta genérica :tipo/:id
     */
    @Get('hijos/:parentId')
    @HttpCode(HttpStatus.OK)
    async obtenerRecursosHijos(
        @Param('parentId') parentId: string,
        @Query() dto: ObtenerRecursosHijosDto,
    ) {
        if (!parentId) {
            throw new BadRequestException('El ID del recurso padre es requerido');
        }

        const resultado = await this.obtenerRecursosHijosUseCase.execute(parentId, dto);
        return ApiResponseDto.success(
            resultado,
            'Recursos hijos obtenidos exitosamente',
        );
    }

    /**
     * POST - Guardar recurso ACC con mapeo a usuario interno
     * POST /acc-recursos
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async guardarRecurso(
        @Req() request: Request,
        @Body() dto: GuardarRecursoDto,
    ) {
        const user = (request as any).user;
        const ipAddress = request.ip || (request.headers['x-forwarded-for'] as string) || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';

        const resultado = await this.guardarRecursoUseCase.execute(
            dto,
            user.sub,
            String(ipAddress),
            userAgent,
        );

        return ApiResponseDto.created(
            resultado,
            'Recurso ACC guardado exitosamente',
        );
    }

    /**
     * GET - Obtener recurso ACC por tipo e ID
     * GET /acc-recursos/:tipo/:id
     */
    @Get(':tipo/:id')
    @HttpCode(HttpStatus.OK)
    async obtenerRecurso(
        @Param('tipo') tipo: string,
        @Param('id') id: string,
    ) {
        if (!tipo || !id) {
            throw new BadRequestException('Tipo e ID son requeridos');
        }

        const resultado = await this.obtenerRecursoUseCase.execute(tipo, id);
        return ApiResponseDto.success(
            resultado,
            'Recurso obtenido exitosamente',
        );
    }

    /**
     * PUT - Actualizar recurso ACC
     * PUT /acc-recursos/:tipo/:id
     */
    @Put(':tipo/:id')
    @HttpCode(HttpStatus.OK)
    async actualizarRecurso(
        @Req() request: Request,
        @Param('tipo') tipo: string,
        @Param('id') id: string,
        @Body() dto: ActualizarRecursoDto,
    ) {
        if (!tipo || !id) {
            throw new BadRequestException('Tipo e ID son requeridos');
        }

        const user = (request as any).user;
        const ipAddress = request.ip || (request.headers['x-forwarded-for'] as string) || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';

        const resultado = await this.actualizarRecursoUseCase.execute(
            tipo,
            id,
            dto,
            user.sub,
            String(ipAddress),
            userAgent,
        );

        return ApiResponseDto.success(
            resultado,
            'Recurso actualizado exitosamente',
        );
    }
}

