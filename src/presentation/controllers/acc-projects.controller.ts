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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { RequestInfoHelper } from '../../shared/helpers/request-info.helper';

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
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.getProyectosUseCase.execute(accountId, dto);

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
}
