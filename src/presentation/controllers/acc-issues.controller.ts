import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { RequestInfoHelper } from '../../shared/helpers/request-info.helper';

// Use Cases
import { ObtenerPerfilUsuarioUseCase } from '../../application/use-cases/acc/issues/obtener-perfil-usuario.use-case';
import { ObtenerTiposIncidenciasUseCase } from '../../application/use-cases/acc/issues/obtener-tipos-incidencias.use-case';
import { ObtenerDefinicionesAtributosUseCase } from '../../application/use-cases/acc/issues/obtener-definiciones-atributos.use-case';
import { ObtenerMapeosAtributosUseCase } from '../../application/use-cases/acc/issues/obtener-mapeos-atributos.use-case';
import { ObtenerCategoriasRaizUseCase } from '../../application/use-cases/acc/issues/obtener-categorias-raiz.use-case';
import { ObtenerIncidenciasPorDocumentoUseCase } from '../../application/use-cases/acc/issues/obtener-incidencias-por-documento.use-case';
import { ObtenerUrlMiniaturaUseCase } from '../../application/use-cases/acc/issues/obtener-url-miniatura.use-case';
import { ObtenerIncidenciasUseCase } from '../../application/use-cases/acc/issues/obtener-incidencias.use-case';
import { CrearIncidenciaUseCase } from '../../application/use-cases/acc/issues/crear-incidencia.use-case';
import { ObtenerIncidenciaPorIdUseCase } from '../../application/use-cases/acc/issues/obtener-incidencia-por-id.use-case';
import { ActualizarIncidenciaUseCase } from '../../application/use-cases/acc/issues/actualizar-incidencia.use-case';
import { ObtenerComentariosUseCase } from '../../application/use-cases/acc/issues/obtener-comentarios.use-case';
import { CrearComentarioUseCase } from '../../application/use-cases/acc/issues/crear-comentario.use-case';
import { CrearAdjuntoUseCase } from '../../application/use-cases/acc/issues/crear-adjunto.use-case';
import { ObtenerAdjuntosUseCase } from '../../application/use-cases/acc/issues/obtener-adjuntos.use-case';
import { EliminarAdjuntoUseCase } from '../../application/use-cases/acc/issues/eliminar-adjunto.use-case';

// DTOs
import { ObtenerTiposIncidenciasDto } from '../../application/dtos/acc/issues/obtener-tipos-incidencias.dto';
import { ObtenerDefinicionesAtributosDto } from '../../application/dtos/acc/issues/obtener-definiciones-atributos.dto';
import { ObtenerMapeosAtributosDto } from '../../application/dtos/acc/issues/obtener-mapeos-atributos.dto';
import { ObtenerCategoriasRaizDto } from '../../application/dtos/acc/issues/obtener-categorias-raiz.dto';
import { ObtenerIncidenciasPorDocumentoDto } from '../../application/dtos/acc/issues/obtener-incidencias-por-documento.dto';
import { ObtenerUrlMiniaturaDto } from '../../application/dtos/acc/issues/obtener-url-miniatura.dto';
import { ObtenerIncidenciasDto } from '../../application/dtos/acc/issues/obtener-incidencias.dto';
import { CrearIncidenciaDto } from '../../application/dtos/acc/issues/crear-incidencia.dto';
import { ActualizarIncidenciaDto } from '../../application/dtos/acc/issues/actualizar-incidencia.dto';
import { ObtenerComentariosDto } from '../../application/dtos/acc/issues/obtener-comentarios.dto';
import { CrearComentarioDto } from '../../application/dtos/acc/issues/crear-comentario.dto';
import { CrearAdjuntoDto } from '../../application/dtos/acc/issues/crear-adjunto.dto';
import { ObtenerAdjuntosDto } from '../../application/dtos/acc/issues/obtener-adjuntos.dto';

@Controller('acc/projects/:projectId')
export class AccIssuesController {
    constructor(
        private readonly obtenerPerfilUsuarioUseCase: ObtenerPerfilUsuarioUseCase,
        private readonly obtenerTiposIncidenciasUseCase: ObtenerTiposIncidenciasUseCase,
        private readonly obtenerDefinicionesAtributosUseCase: ObtenerDefinicionesAtributosUseCase,
        private readonly obtenerMapeosAtributosUseCase: ObtenerMapeosAtributosUseCase,
        private readonly obtenerCategoriasRaizUseCase: ObtenerCategoriasRaizUseCase,
        private readonly obtenerIncidenciasPorDocumentoUseCase: ObtenerIncidenciasPorDocumentoUseCase,
        private readonly obtenerUrlMiniaturaUseCase: ObtenerUrlMiniaturaUseCase,
        private readonly obtenerIncidenciasUseCase: ObtenerIncidenciasUseCase,
        private readonly crearIncidenciaUseCase: CrearIncidenciaUseCase,
        private readonly obtenerIncidenciaPorIdUseCase: ObtenerIncidenciaPorIdUseCase,
        private readonly actualizarIncidenciaUseCase: ActualizarIncidenciaUseCase,
        private readonly obtenerComentariosUseCase: ObtenerComentariosUseCase,
        private readonly crearComentarioUseCase: CrearComentarioUseCase,
        private readonly crearAdjuntoUseCase: CrearAdjuntoUseCase,
        private readonly obtenerAdjuntosUseCase: ObtenerAdjuntosUseCase,
        private readonly eliminarAdjuntoUseCase: EliminarAdjuntoUseCase,
    ) { }

    /**
     * GET - Obtener perfil de usuario
     * GET /acc/projects/:projectId/users/me
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

        const resultado = await this.obtenerPerfilUsuarioUseCase.execute(userId, projectId);

        return ApiResponseDto.success(
            resultado,
            'Perfil de usuario obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener tipos de incidencias
     * GET /acc/projects/:projectId/issue-types
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

        const resultado = await this.obtenerTiposIncidenciasUseCase.execute(userId, projectId, dto);

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
     * GET /acc/projects/:projectId/issue-attribute-definitions
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

        const resultado = await this.obtenerDefinicionesAtributosUseCase.execute(userId, projectId, dto);

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
     * GET /acc/projects/:projectId/issue-attribute-mappings
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

        const resultado = await this.obtenerMapeosAtributosUseCase.execute(userId, projectId, dto);

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
     * GET /acc/projects/:projectId/issue-root-cause-categories
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

        const resultado = await this.obtenerCategoriasRaizUseCase.execute(userId, projectId, dto);

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
     * GET /acc/projects/:projectId/issues/by-document
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

        const resultado = await this.obtenerIncidenciasPorDocumentoUseCase.execute(userId, projectId, dto);

        if (resultado.pagination && Object.keys(resultado.pagination).length > 0) {
            return ApiResponseDto.custom(
                resultado.data,
                'Incidencias del documento obtenidas exitosamente',
                200,
                resultado.pagination,
            );
        }

        return ApiResponseDto.success(
            resultado.data,
            'Incidencias del documento obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener URL de miniatura
     * GET /acc/projects/:projectId/issues/thumbnail-url
     */
    @Get('issues/thumbnail-url')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerUrlMiniatura(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerUrlMiniaturaDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!dto.snapshotUrn) {
            throw new BadRequestException('El parámetro snapshotUrn es requerido en query params');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        const resultado = await this.obtenerUrlMiniaturaUseCase.execute(userId, projectId, dto);

        if (!resultado.success) {
            throw new BadRequestException(resultado.error || 'Error al obtener URL de miniatura');
        }

        return ApiResponseDto.success(
            { url: resultado.url },
            'URL de miniatura obtenida exitosamente',
        );
    }

    /**
     * GET - Obtener incidencias
     * GET /acc/projects/:projectId/issues
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

        const resultado = await this.obtenerIncidenciasUseCase.execute(userId, projectId, dto);

        return ApiResponseDto.success(
            resultado,
            'Incidencias obtenidas exitosamente',
        );
    }

    /**
     * POST - Crear incidencia
     * POST /acc/projects/:projectId/issues
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

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        // Extraer información del request para auditoría
        const requestInfo = RequestInfoHelper.extract(request);
        
        // Asegurar que usamos el userId validado
        const userIdNumero = typeof userId === 'number' ? userId : parseInt(userId.toString(), 10);
        if (isNaN(userIdNumero) || userIdNumero <= 0) {
            throw new BadRequestException('User ID inválido');
        }

        // Obtener el rol del usuario (primer rol si tiene múltiples)
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.crearIncidenciaUseCase.execute(
            userIdNumero,
            projectId,
            dto,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.created(
            resultado,
            'Incidencia creada exitosamente',
        );
    }

    /**
     * GET - Obtener incidencia por ID
     * GET /acc/projects/:projectId/issues/:issueId
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

        const resultado = await this.obtenerIncidenciaPorIdUseCase.execute(userId, projectId, issueId);

        return ApiResponseDto.success(
            resultado,
            'Incidencia obtenida exitosamente',
        );
    }

    /**
     * PATCH - Actualizar incidencia
     * PATCH /acc/projects/:projectId/issues/:issueId
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

        // Extraer información del request para auditoría
        const requestInfo = RequestInfoHelper.extract(request);
        
        // Asegurar que usamos el userId validado
        const userIdNumero = typeof userId === 'number' ? userId : parseInt(userId.toString(), 10);
        if (isNaN(userIdNumero) || userIdNumero <= 0) {
            throw new BadRequestException('User ID inválido');
        }

        // Obtener el rol del usuario (primer rol si tiene múltiples)
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.actualizarIncidenciaUseCase.execute(
            userIdNumero,
            projectId,
            issueId,
            dto,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            'Incidencia actualizada exitosamente',
        );
    }

    /**
     * GET - Obtener comentarios de una incidencia
     * GET /acc/projects/:projectId/issues/:issueId/comments
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

        const resultado = await this.obtenerComentariosUseCase.execute(userId, projectId, issueId, dto);

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
     * POST /acc/projects/:projectId/issues/:issueId/comments
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

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        // Extraer información del request para auditoría
        const requestInfo = RequestInfoHelper.extract(request);
        
        // Asegurar que usamos el userId validado, no el del helper (que puede ser 0)
        const userIdNumero = typeof userId === 'number' ? userId : parseInt(userId.toString(), 10);
        if (isNaN(userIdNumero) || userIdNumero <= 0) {
            throw new BadRequestException('User ID inválido');
        }

        // Obtener el rol del usuario (primer rol si tiene múltiples)
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.crearComentarioUseCase.execute(
            userIdNumero,
            projectId,
            issueId,
            dto,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.created(
            resultado,
            'Comentario creado exitosamente',
        );
    }

    /**
     * POST - Crear adjunto para una incidencia
     * POST /acc/projects/:projectId/attachments
     */
    @Post('attachments')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async crearAdjunto(
        @Param('projectId') projectId: string,
        @Body() dto: CrearAdjuntoDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!dto.issueId) {
            throw new BadRequestException('El issueId es requerido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id;
        if (!userId) {
            throw new BadRequestException('User ID es requerido');
        }

        // Extraer información del request para auditoría
        const requestInfo = RequestInfoHelper.extract(request);
        
        // Asegurar que usamos el userId validado, no el del helper (que puede ser 0)
        const userIdNumero = typeof userId === 'number' ? userId : parseInt(userId.toString(), 10);
        if (isNaN(userIdNumero) || userIdNumero <= 0) {
            throw new BadRequestException('User ID inválido');
        }

        // Obtener el rol del usuario (primer rol si tiene múltiples)
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.crearAdjuntoUseCase.execute(
            userIdNumero,
            projectId,
            dto,
            file,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.created(
            resultado,
            'Adjunto creado exitosamente',
        );
    }

    /**
     * GET - Obtener adjuntos de una incidencia
     * GET /acc/projects/:projectId/issues/:issueId/attachments
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

        const resultado = await this.obtenerAdjuntosUseCase.execute(userId, projectId, issueId, dto);

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
     * DELETE - Eliminar adjunto de una incidencia
     * DELETE /acc/projects/:projectId/issues/:issueId/attachments/:attachmentId
     */
    @Delete('issues/:issueId/attachments/:attachmentId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async eliminarAdjunto(
        @Param('projectId') projectId: string,
        @Param('issueId') issueId: string,
        @Param('attachmentId') attachmentId: string,
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

        const resultado = await this.eliminarAdjuntoUseCase.execute(userId, projectId, issueId, attachmentId);

        return ApiResponseDto.success(
            null,
            resultado.message || 'Adjunto eliminado exitosamente',
        );
    }
}

