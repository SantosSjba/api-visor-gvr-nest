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
    Req,
    BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

// Use Cases
import { ObtenerPerfilUsuarioBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-perfil-usuario.use-case';
import { ObtenerTiposIncidenciasBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-tipos-incidencias.use-case';
import { ObtenerDefinicionesAtributosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-definiciones-atributos.use-case';
import { ObtenerMapeosAtributosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-mapeos-atributos.use-case';
import { ObtenerCategoriasRaizBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-categorias-raiz.use-case';
import { ObtenerIncidenciasPorDocumentoBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-incidencias-por-documento.use-case';
import { ObtenerIncidenciasBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-incidencias.use-case';
import { CrearIncidenciaBim360UseCase } from '../../application/use-cases/issues-bim360/crear-incidencia.use-case';
import { ObtenerIncidenciaPorIdBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-incidencia-por-id.use-case';
import { ActualizarIncidenciaBim360UseCase } from '../../application/use-cases/issues-bim360/actualizar-incidencia.use-case';
import { ObtenerComentariosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-comentarios.use-case';
import { CrearComentarioBim360UseCase } from '../../application/use-cases/issues-bim360/crear-comentario.use-case';
import { ObtenerAdjuntosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-adjuntos.use-case';
import { CrearAdjuntoBim360UseCase } from '../../application/use-cases/issues-bim360/crear-adjunto.use-case';
import { ActualizarAdjuntoBim360UseCase } from '../../application/use-cases/issues-bim360/actualizar-adjunto.use-case';

// DTOs
import { ObtenerTiposIncidenciasDto } from '../../application/dtos/issues-bim360/obtener-tipos-incidencias.dto';
import { ObtenerDefinicionesAtributosDto } from '../../application/dtos/issues-bim360/obtener-definiciones-atributos.dto';
import { ObtenerMapeosAtributosDto } from '../../application/dtos/issues-bim360/obtener-mapeos-atributos.dto';
import { ObtenerCategoriasRaizDto } from '../../application/dtos/issues-bim360/obtener-categorias-raiz.dto';
import { ObtenerIncidenciasPorDocumentoDto } from '../../application/dtos/issues-bim360/obtener-incidencias-por-documento.dto';
import { ObtenerIncidenciasDto } from '../../application/dtos/issues-bim360/obtener-incidencias.dto';
import { CrearIncidenciaDto } from '../../application/dtos/issues-bim360/crear-incidencia.dto';
import { ActualizarIncidenciaDto } from '../../application/dtos/issues-bim360/actualizar-incidencia.dto';
import { ObtenerComentariosDto } from '../../application/dtos/issues-bim360/obtener-comentarios.dto';
import { CrearComentarioDto } from '../../application/dtos/issues-bim360/crear-comentario.dto';
import { CrearAdjuntoDto } from '../../application/dtos/issues-bim360/crear-adjunto.dto';
import { ObtenerAdjuntosDto } from '../../application/dtos/issues-bim360/obtener-adjuntos.dto';
import { ActualizarAdjuntoDto } from '../../application/dtos/issues-bim360/actualizar-adjunto.dto';

@Controller('issues/projects/:projectId')
export class IssuesBim360Controller {
    constructor(
        private readonly obtenerPerfilUsuarioBim360UseCase: ObtenerPerfilUsuarioBim360UseCase,
        private readonly obtenerTiposIncidenciasBim360UseCase: ObtenerTiposIncidenciasBim360UseCase,
        private readonly obtenerDefinicionesAtributosBim360UseCase: ObtenerDefinicionesAtributosBim360UseCase,
        private readonly obtenerMapeosAtributosBim360UseCase: ObtenerMapeosAtributosBim360UseCase,
        private readonly obtenerCategoriasRaizBim360UseCase: ObtenerCategoriasRaizBim360UseCase,
        private readonly obtenerIncidenciasPorDocumentoBim360UseCase: ObtenerIncidenciasPorDocumentoBim360UseCase,
        private readonly obtenerIncidenciasBim360UseCase: ObtenerIncidenciasBim360UseCase,
        private readonly crearIncidenciaBim360UseCase: CrearIncidenciaBim360UseCase,
        private readonly obtenerIncidenciaPorIdBim360UseCase: ObtenerIncidenciaPorIdBim360UseCase,
        private readonly actualizarIncidenciaBim360UseCase: ActualizarIncidenciaBim360UseCase,
        private readonly obtenerComentariosBim360UseCase: ObtenerComentariosBim360UseCase,
        private readonly crearComentarioBim360UseCase: CrearComentarioBim360UseCase,
        private readonly obtenerAdjuntosBim360UseCase: ObtenerAdjuntosBim360UseCase,
        private readonly crearAdjuntoBim360UseCase: CrearAdjuntoBim360UseCase,
        private readonly actualizarAdjuntoBim360UseCase: ActualizarAdjuntoBim360UseCase,
    ) { }

    /**
     * GET - Obtener perfil de usuario
     * GET /issues/projects/:projectId/users/me
     */
    @Get('users/me')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerPerfilUsuario(
        @Param('projectId') projectId: string,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerPerfilUsuarioBim360UseCase.execute(userId, projectId);

        return ApiResponseDto.success(
            resultado,
            'Perfil de usuario obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener tipos de incidencias
     * GET /issues/projects/:projectId/issue-types
     */
    @Get('issue-types')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerTiposIncidencias(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerTiposIncidenciasDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerTiposIncidenciasBim360UseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Tipos de incidencias obtenidos exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Tipos de incidencias obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener definiciones de atributos
     * GET /issues/projects/:projectId/issue-attribute-definitions
     */
    @Get('issue-attribute-definitions')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerDefinicionesAtributos(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerDefinicionesAtributosDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerDefinicionesAtributosBim360UseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Definiciones de atributos obtenidas exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Definiciones de atributos obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener mapeos de atributos
     * GET /issues/projects/:projectId/issue-attribute-mappings
     */
    @Get('issue-attribute-mappings')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerMapeosAtributos(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerMapeosAtributosDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerMapeosAtributosBim360UseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Mapeos de atributos obtenidos exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Mapeos de atributos obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener categorías de causa raíz
     * GET /issues/projects/:projectId/issue-root-cause-categories
     */
    @Get('issue-root-cause-categories')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerCategoriasRaiz(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerCategoriasRaizDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerCategoriasRaizBim360UseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Categorías de causa raíz obtenidas exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Categorías de causa raíz obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener incidencias por documento
     * GET /issues/projects/:projectId/issues/by-document
     */
    @Get('issues/by-document')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerIncidenciasPorDocumento(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerIncidenciasPorDocumentoDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!dto.documentUrn) {
            throw new BadRequestException('El parámetro documentUrn es requerido en query params');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerIncidenciasPorDocumentoBim360UseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Incidencias del documento obtenidas exitosamente (BIM 360)',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Incidencias del documento obtenidas exitosamente (BIM 360)',
        );
    }

    /**
     * GET - Obtener incidencias
     * GET /issues/projects/:projectId/issues
     */
    @Get('issues')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerIncidencias(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerIncidenciasDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerIncidenciasBim360UseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Incidencias obtenidas exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Incidencias obtenidas exitosamente',
        );
    }

    /**
     * POST - Crear incidencia
     * POST /issues/projects/:projectId/issues
     */
    @Post('issues')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async crearIncidencia(
        @Param('projectId') projectId: string,
        @Body() dto: CrearIncidenciaDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!dto.title) {
            throw new BadRequestException('El título de la incidencia es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.crearIncidenciaBim360UseCase.execute(userId, projectId, dto);

        return ApiResponseDto.created(
            resultado,
            'Incidencia creada exitosamente',
        );
    }

    /**
     * GET - Obtener incidencia por ID
     * GET /issues/projects/:projectId/issues/:issueId
     */
    @Get('issues/:issueId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerIncidenciaPorId(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId) {
            throw new BadRequestException('Project ID y Issue ID son requeridos');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerIncidenciaPorIdBim360UseCase.execute(userId, projectId, issueId);

        return ApiResponseDto.success(
            resultado,
            'Incidencia obtenida exitosamente',
        );
    }

    /**
     * PATCH - Actualizar incidencia
     * PATCH /issues/projects/:projectId/issues/:issueId
     */
    @Patch('issues/:issueId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async actualizarIncidencia(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Body() dto: ActualizarIncidenciaDto,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId) {
            throw new BadRequestException('Project ID y Issue ID son requeridos');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.actualizarIncidenciaBim360UseCase.execute(userId, projectId, issueId, dto);

        return ApiResponseDto.success(
            resultado,
            'Incidencia actualizada exitosamente',
        );
    }

    /**
     * GET - Obtener comentarios de una incidencia
     * GET /issues/projects/:projectId/issues/:issueId/comments
     */
    @Get('issues/:issueId/comments')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerComentarios(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Query() dto: ObtenerComentariosDto,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId) {
            throw new BadRequestException('Project ID y Issue ID son requeridos');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerComentariosBim360UseCase.execute(userId, projectId, issueId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Comentarios obtenidos exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Comentarios obtenidos exitosamente',
        );
    }

    /**
     * POST - Crear comentario en una incidencia
     * POST /issues/projects/:projectId/issues/:issueId/comments
     */
    @Post('issues/:issueId/comments')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async crearComentario(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Body() dto: CrearComentarioDto,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId) {
            throw new BadRequestException('Project ID y Issue ID son requeridos');
        }

        if (!dto.body) {
            throw new BadRequestException('El contenido del comentario es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.crearComentarioBim360UseCase.execute(userId, projectId, issueId, dto);

        return ApiResponseDto.created(
            resultado,
            'Comentario creado exitosamente',
        );
    }

    /**
     * GET - Obtener adjuntos de una incidencia
     * GET /issues/projects/:projectId/issues/:issueId/attachments
     */
    @Get('issues/:issueId/attachments')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerAdjuntos(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Query() dto: ObtenerAdjuntosDto,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId) {
            throw new BadRequestException('Project ID y Issue ID son requeridos');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerAdjuntosBim360UseCase.execute(userId, projectId, issueId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Adjuntos obtenidos exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Adjuntos obtenidos exitosamente',
        );
    }

    /**
     * POST - Crear adjunto para una incidencia
     * POST /issues/projects/:projectId/issues/:issueId/attachments
     */
    @Post('issues/:issueId/attachments')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async crearAdjunto(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Body() dto: CrearAdjuntoDto,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId) {
            throw new BadRequestException('Project ID y Issue ID son requeridos');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.crearAdjuntoBim360UseCase.execute(userId, projectId, issueId, dto);

        return ApiResponseDto.created(
            resultado,
            'Adjunto creado exitosamente',
        );
    }

    /**
     * PATCH - Actualizar adjunto de una incidencia
     * PATCH /issues/projects/:projectId/issues/:issueId/attachments/:attachmentId
     */
    @Patch('issues/:issueId/attachments/:attachmentId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async actualizarAdjunto(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Param('attachmentId') attachmentId: string,
        @Body() dto: ActualizarAdjuntoDto,
        @Req() request: Request,
    ) {
        if (!projectId || !issueId || !attachmentId) {
            throw new BadRequestException('Project ID, Issue ID y Attachment ID son requeridos');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.actualizarAdjuntoBim360UseCase.execute(userId, projectId, issueId, attachmentId, dto);

        return ApiResponseDto.success(
            resultado,
            'Adjunto actualizado exitosamente',
        );
    }
}

