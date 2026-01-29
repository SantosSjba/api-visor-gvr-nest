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
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { RequestInfoHelper } from '../../shared/helpers/request-info.helper';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../domain/repositories/acc.repository.interface';

// Use Cases
import { GetProyectosUseCase } from '../../application/use-cases/acc/projects/get-proyectos.use-case';
import { GetProyectoPorIdUseCase } from '../../application/use-cases/acc/projects/get-proyecto-por-id.use-case';
import { GetPlantillasUseCase } from '../../application/use-cases/acc/projects/get-plantillas.use-case';
import { GetProyectosPorTipoUseCase } from '../../application/use-cases/acc/projects/get-proyectos-por-tipo.use-case';
import { GetProyectosActivosUseCase } from '../../application/use-cases/acc/projects/get-proyectos-activos.use-case';
import { CrearProyectoUseCase } from '../../application/use-cases/acc/projects/crear-proyecto.use-case';
import { ClonarProyectoUseCase } from '../../application/use-cases/acc/projects/clonar-proyecto.use-case';
import { ActualizarProyectoUseCase } from '../../application/use-cases/acc/projects/actualizar-proyecto.use-case';
import { SubirImagenProyectoUseCase } from '../../application/use-cases/acc/projects/subir-imagen-proyecto.use-case';
import { ActivarServicioProyectoUseCase } from '../../application/use-cases/acc/projects/activar-servicio-proyecto.use-case';
import { DesactivarServicioProyectoUseCase } from '../../application/use-cases/acc/projects/desactivar-servicio-proyecto.use-case';

// DTOs
import { GetProyectosDto } from '../../application/dtos/acc/projects/get-proyectos.dto';
import { GetProyectoPorIdDto } from '../../application/dtos/acc/projects/get-proyecto-por-id.dto';
import { GetPlantillasDto } from '../../application/dtos/acc/projects/get-plantillas.dto';
import { GetProyectosPorTipoDto } from '../../application/dtos/acc/projects/get-proyectos-por-tipo.dto';
import { GetProyectosActivosDto } from '../../application/dtos/acc/projects/get-proyectos-activos.dto';
import { CrearProyectoDto } from '../../application/dtos/acc/projects/crear-proyecto.dto';
import { ClonarProyectoDto } from '../../application/dtos/acc/projects/clonar-proyecto.dto';
import { ActualizarProyectoDto } from '../../application/dtos/acc/projects/actualizar-proyecto.dto';
import { SubirImagenProyectoDto } from '../../application/dtos/acc/projects/subir-imagen-proyecto.dto';
import { ActivarServicioProyectoDto } from '../../application/dtos/acc/projects/activar-servicio-proyecto.dto';

@Controller('acc/projects')
export class AccProjectsController {
    constructor(
        private readonly getProyectosUseCase: GetProyectosUseCase,
        private readonly getProyectoPorIdUseCase: GetProyectoPorIdUseCase,
        private readonly getPlantillasUseCase: GetPlantillasUseCase,
        private readonly getProyectosPorTipoUseCase: GetProyectosPorTipoUseCase,
        private readonly getProyectosActivosUseCase: GetProyectosActivosUseCase,
        private readonly crearProyectoUseCase: CrearProyectoUseCase,
        private readonly clonarProyectoUseCase: ClonarProyectoUseCase,
        private readonly actualizarProyectoUseCase: ActualizarProyectoUseCase,
        private readonly subirImagenProyectoUseCase: SubirImagenProyectoUseCase,
        private readonly activarServicioProyectoUseCase: ActivarServicioProyectoUseCase,
        private readonly desactivarServicioProyectoUseCase: DesactivarServicioProyectoUseCase,
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    /**
     * GET - Obtener proyectos de una cuenta
     * GET /acc/projects/:accountId
     */
    @Get(':accountId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getProyectos(
        @Param('accountId') accountId: string,
        @Query() dto: GetProyectosDto,
        @Req() request: Request,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        // Convertir a número si es necesario
        let numericUserId: number | undefined = undefined;
        if (internalUserId) {
            if (typeof internalUserId === 'number') {
                numericUserId = internalUserId;
            } else if (typeof internalUserId === 'string') {
                const parsed = parseInt(internalUserId, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    numericUserId = parsed;
                }
            }
        }

        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.getProyectosUseCase.execute(accountId, dto, numericUserId, userRole);

        return ApiResponseDto.success(
            resultado,
            'Proyectos obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener un proyecto específico por ID
     * GET /acc/projects/proyecto/:projectId
     */
    @Get('proyecto/:projectId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getProyectoPorId(
        @Param('projectId') projectId: string,
        @Query() dto: GetProyectoPorIdDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.getProyectoPorIdUseCase.execute(projectId, dto);

        return ApiResponseDto.success(
            resultado,
            'Proyecto obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener plantillas
     * GET /acc/projects/:accountId/templates
     */
    @Get(':accountId/templates')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getPlantillas(
        @Param('accountId') accountId: string,
        @Query() dto: GetPlantillasDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.getPlantillasUseCase.execute(accountId, dto);

        return ApiResponseDto.success(
            resultado,
            'Plantillas obtenidas exitosamente',
        );
    }

    /**
     * POST - Obtener proyectos por tipo
     * POST /acc/projects/:accountId/por-tipo
     */
    @Post(':accountId/por-tipo')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getProyectosPorTipo(
        @Param('accountId') accountId: string,
        @Body() dto: GetProyectosPorTipoDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.getProyectosPorTipoUseCase.execute(accountId, dto);

        return ApiResponseDto.success(
            resultado,
            'Proyectos por tipo obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener proyectos activos
     * GET /acc/projects/:accountId/activos
     */
    @Get(':accountId/activos')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async getProyectosActivos(
        @Param('accountId') accountId: string,
        @Query() dto: GetProyectosActivosDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.getProyectosActivosUseCase.execute(accountId, dto);

        return ApiResponseDto.success(
            resultado,
            'Proyectos activos obtenidos exitosamente',
        );
    }

    /**
     * POST - Crear nuevo proyecto
     * POST /acc/projects/:accountId/crear
     */
    @Post(':accountId/crear')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    async crearProyecto(
        @Param('accountId') accountId: string,
        @Body() dto: CrearProyectoDto,
        @Req() request: Request,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        const autodeskUserId = request.headers['user-id'] as string;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.crearProyectoUseCase.execute(
            accountId,
            dto,
            autodeskUserId || internalUserId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            'Proyecto creado exitosamente',
        );
    }

    /**
     * POST - Clonar proyecto desde plantilla
     * POST /acc/projects/:accountId/clonar
     */
    @Post(':accountId/clonar')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    async clonarProyecto(
        @Param('accountId') accountId: string,
        @Body() dto: ClonarProyectoDto,
        @Req() request: Request,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        const autodeskUserId = request.headers['user-id'] as string;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.clonarProyectoUseCase.execute(
            accountId,
            dto,
            autodeskUserId || internalUserId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            'Proyecto clonado exitosamente desde plantilla',
        );
    }

    /**
     * PATCH - Actualizar proyecto
     * PATCH /acc/projects/:accountId/:projectId/actualizar
     */
    @Patch(':accountId/:projectId/actualizar')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async actualizarProyecto(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
        @Body() dto: ActualizarProyectoDto,
        @Req() request: Request,
    ) {
        if (!accountId || !projectId) {
            throw new BadRequestException('Account ID y Project ID son requeridos');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        const autodeskUserId = request.headers['user-id'] as string;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.actualizarProyectoUseCase.execute(
            accountId,
            projectId,
            dto,
            autodeskUserId || internalUserId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            'Proyecto actualizado exitosamente',
        );
    }

    /**
     * POST - Subir imagen del proyecto
     * POST /acc/projects/:accountId/:projectId/imagen
     */
    @Post(':accountId/:projectId/imagen')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('imagen'))
    @HttpCode(HttpStatus.OK)
    async subirImagenProyecto(
        @Param('accountId') accountId: string,
        @Param('projectId') projectId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: SubirImagenProyectoDto,
        @Req() request: Request,
    ) {
        if (!accountId || !projectId) {
            throw new BadRequestException('Account ID y Project ID son requeridos');
        }

        if (!file) {
            throw new BadRequestException('La imagen es requerida');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.subirImagenProyectoUseCase.execute(
            accountId,
            projectId,
            file,
            dto.token,
            internalUserId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            'Imagen del proyecto subida exitosamente',
        );
    }

    /**
     * POST - Activar un servicio en un proyecto (ej: Docs, Cost, etc.)
     * POST /acc/projects/:projectId/activar-servicio
     */
    @Post(':projectId/activar-servicio')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async activarServicioProyecto(
        @Param('projectId') projectId: string,
        @Body() dto: ActivarServicioProyectoDto,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.activarServicioProyectoUseCase.execute(
            projectId,
            dto,
            internalUserId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            resultado.message || 'Servicio activado exitosamente',
        );
    }

    /**
     * POST - Desactivar un servicio en un proyecto para un usuario
     * POST /acc/projects/:projectId/desactivar-servicio
     */
    @Post(':projectId/desactivar-servicio')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async desactivarServicioProyecto(
        @Param('projectId') projectId: string,
        @Body() dto: { email: string; service: string; region?: string },
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!dto.email || !dto.service) {
            throw new BadRequestException('El email y el servicio son requeridos');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;

        const resultado = await this.desactivarServicioProyectoUseCase.execute(
            projectId,
            dto,
            internalUserId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado,
            resultado.message || 'Servicio desactivado exitosamente',
        );
    }

    /**
     * GET - Obtener los servicios/productos activos del usuario de ACC en el proyecto
     * GET /acc/projects/:projectId/mis-servicios
     * Devuelve los productos a los que el usuario de ACC tiene acceso en el proyecto
     */
    @Get(':projectId/mis-servicios')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerMisServiciosProyecto(
        @Param('projectId') projectId: string,
        @Req() request: Request,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const user = (request as any).user;
        const internalUserId = user?.sub || user?.id;

        if (!internalUserId) {
            throw new BadRequestException('Usuario no autenticado');
        }

        try {
            // Obtener el token 3-legged del usuario
            const token = await this.accRepository.obtenerToken3LeggedPorUsuario(internalUserId);

            if (!token) {
                return ApiResponseDto.success(
                    { products: [], esMiembro: false, mensaje: 'No hay token de ACC' },
                    'No se encontró token de ACC. El usuario debe autorizar la aplicación.',
                );
            }

            // Verificar si el token está expirado
            if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
                return ApiResponseDto.success(
                    { products: [], esMiembro: false, mensaje: 'Token expirado' },
                    'El token de ACC ha expirado.',
                );
            }

            // Obtener el perfil del usuario de ACC para saber su email
            const perfil = await this.autodeskApiService.obtenerPerfilUsuarioAcc(token.tokenAcceso);
            const emailUsuario = perfil?.emailId;

            if (!emailUsuario) {
                return ApiResponseDto.success(
                    { products: [], esMiembro: false, mensaje: 'No se pudo obtener email' },
                    'No se pudo obtener el email del usuario de ACC.',
                );
            }

            // Buscar al usuario en el proyecto por email
            const usuariosResponse = await this.autodeskApiService.obtenerUsuariosProyecto(
                token.tokenAcceso,
                projectId,
                { 'filter[email]': emailUsuario, limit: '1' },
            );

            const usuarios = usuariosResponse?.data?.results || usuariosResponse?.results || [];
            const usuarioEnProyecto = usuarios.find((u: any) =>
                u.email?.toLowerCase() === emailUsuario.toLowerCase()
            );

            if (!usuarioEnProyecto) {
                return ApiResponseDto.success(
                    {
                        products: [],
                        esMiembro: false,
                        email: emailUsuario,
                        mensaje: 'Usuario no es miembro del proyecto'
                    },
                    'El usuario de ACC no es miembro de este proyecto.',
                );
            }

            // El usuario es miembro, devolver sus productos activos
            const productosUsuario = usuarioEnProyecto.products || [];

            // Filtrar solo los productos con acceso (administrator o user)
            const productosActivos = productosUsuario
                .filter((p: any) => p.access === 'administrator' || p.access === 'user')
                .map((p: any) => ({
                    key: p.key,
                    access: p.access,
                }));

            return ApiResponseDto.success(
                {
                    products: productosActivos,
                    esMiembro: true,
                    email: emailUsuario,
                    usuarioId: usuarioEnProyecto.id,
                    nombre: `${usuarioEnProyecto.firstName || ''} ${usuarioEnProyecto.lastName || ''}`.trim(),
                },
                'Servicios del usuario obtenidos exitosamente.',
            );
        } catch (error: any) {
            return ApiResponseDto.error(
                `Error al obtener servicios del usuario: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
