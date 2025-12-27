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
    BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import {
    ObtenerUsuariosProyectoUseCase,
    ObtenerUsuarioProyectoPorIdUseCase,
    BuscarUsuariosProyectoUseCase,
    AgregarUsuarioProyectoUseCase,
    ImportarUsuariosProyectoUseCase,
    ActualizarUsuarioProyectoUseCase,
    EliminarUsuarioProyectoUseCase,
} from '../../application/use-cases/acc/project-users';
import {
    ObtenerUsuariosProyectoDto,
    BuscarUsuariosProyectoDto,
    AgregarUsuarioProyectoDto,
    ImportarUsuariosProyectoDto,
    ActualizarUsuarioProyectoDto,
} from '../../application/dtos/acc/project-users';

@Controller('acc/project-users')
@UseGuards(JwtAuthGuard)
export class AccProjectUsersController {
    constructor(
        private readonly obtenerUsuariosProyectoUseCase: ObtenerUsuariosProyectoUseCase,
        private readonly obtenerUsuarioProyectoPorIdUseCase: ObtenerUsuarioProyectoPorIdUseCase,
        private readonly buscarUsuariosProyectoUseCase: BuscarUsuariosProyectoUseCase,
        private readonly agregarUsuarioProyectoUseCase: AgregarUsuarioProyectoUseCase,
        private readonly importarUsuariosProyectoUseCase: ImportarUsuariosProyectoUseCase,
        private readonly actualizarUsuarioProyectoUseCase: ActualizarUsuarioProyectoUseCase,
        private readonly eliminarUsuarioProyectoUseCase: EliminarUsuarioProyectoUseCase,
    ) { }

    /**
     * GET - Buscar usuarios en un proyecto
     * GET /acc/project-users/:projectId/search
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':projectId/search')
    @HttpCode(HttpStatus.OK)
    async buscarUsuariosProyecto(
        @Param('projectId') projectId: string,
        @Query() dto: BuscarUsuariosProyectoDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.buscarUsuariosProyectoUseCase.execute(projectId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Búsqueda completada exitosamente',
        );
    }

    /**
     * POST - Importar múltiples usuarios a un proyecto
     * POST /acc/project-users/:projectId/import
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Post(':projectId/import')
    @HttpCode(HttpStatus.OK)
    async importarUsuariosProyecto(
        @Param('projectId') projectId: string,
        @Body() dto: ImportarUsuariosProyectoDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.importarUsuariosProyectoUseCase.execute(projectId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Usuarios importados al proyecto exitosamente',
        );
    }

    /**
     * GET - Obtener un usuario específico de un proyecto
     * GET /acc/project-users/:projectId/:userId
     */
    @Get(':projectId/:userId')
    @HttpCode(HttpStatus.OK)
    async obtenerUsuarioProyectoPorId(
        @Param('projectId') projectId: string,
        @Param('userId') userId: string,
        @Query('region') region?: string,
        @Query('user_id') user_id?: string,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario del proyecto es requerido');
        }

        const resultado = await this.obtenerUsuarioProyectoPorIdUseCase.execute(projectId, userId, region, user_id);
        return ApiResponseDto.success(
            resultado.data,
            'Usuario del proyecto obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener usuarios de un proyecto con filtros avanzados
     * GET /acc/project-users/:projectId
     */
    @Get(':projectId')
    @HttpCode(HttpStatus.OK)
    async obtenerUsuariosProyecto(
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerUsuariosProyectoDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.obtenerUsuariosProyectoUseCase.execute(projectId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Usuarios del proyecto obtenidos exitosamente',
        );
    }

    /**
     * POST - Agregar un usuario a un proyecto
     * POST /acc/project-users/:projectId
     */
    @Post(':projectId')
    @HttpCode(HttpStatus.CREATED)
    async agregarUsuarioProyecto(
        @Param('projectId') projectId: string,
        @Body() dto: AgregarUsuarioProyectoDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        const resultado = await this.agregarUsuarioProyectoUseCase.execute(projectId, dto);
        return ApiResponseDto.created(
            resultado.data,
            'Usuario agregado al proyecto exitosamente',
        );
    }

    /**
     * PATCH - Actualizar un usuario en un proyecto
     * PATCH /acc/project-users/:projectId/:userId
     */
    @Patch(':projectId/:userId')
    @HttpCode(HttpStatus.OK)
    async actualizarUsuarioProyecto(
        @Param('projectId') projectId: string,
        @Param('userId') userId: string,
        @Body() dto: ActualizarUsuarioProyectoDto,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario del proyecto es requerido');
        }

        const resultado = await this.actualizarUsuarioProyectoUseCase.execute(projectId, userId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Usuario del proyecto actualizado exitosamente',
        );
    }

    /**
     * DELETE - Eliminar un usuario de un proyecto
     * DELETE /acc/project-users/:projectId/:userId
     */
    @Delete(':projectId/:userId')
    @HttpCode(HttpStatus.OK)
    async eliminarUsuarioProyecto(
        @Param('projectId') projectId: string,
        @Param('userId') userId: string,
        @Query('region') region?: string,
        @Query('user_id') user_id?: string,
    ) {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario del proyecto es requerido');
        }

        await this.eliminarUsuarioProyectoUseCase.execute(projectId, userId, region, user_id);
        return ApiResponseDto.success(
            null,
            'Usuario eliminado del proyecto exitosamente',
        );
    }
}

