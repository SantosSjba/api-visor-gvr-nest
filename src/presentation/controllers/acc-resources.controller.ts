import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
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
import {
    ListarRecursosUseCase,
    ObtenerRecursoPorIdUseCase,
    CrearRecursoUseCase,
    ActualizarRecursoUseCase,
    EliminarRecursoUseCase,
    ListarPermisosRolUseCase,
    ListarRolesRecursoUseCase,
    AsignarPermisoUseCase,
    RemoverPermisoUseCase,
    SincronizarPermisosRolUseCase,
    ListarPermisosUsuarioUseCase,
    ListarUsuariosRecursoUseCase,
    ListarUsuariosDisponiblesRecursoUseCase,
    AsignarPermisoUsuarioUseCase,
    ActualizarNivelPermisoUsuarioUseCase,
    RemoverPermisoUsuarioUseCase,
    SincronizarPermisosUsuarioUseCase,
    ListarNivelesPermisoUseCase,
} from '../../application/use-cases/acc/resources';
import {
    ListarRecursosDto,
    CrearRecursoDto,
    ActualizarRecursoDto,
    ListarPermisosRolDto,
    AsignarPermisoDto,
    SincronizarPermisosRolDto,
    ListarPermisosUsuarioDto,
    AsignarPermisoUsuarioDto,
    ActualizarNivelPermisoUsuarioDto,
    SincronizarPermisosUsuarioDto,
    ListarUsuariosDisponiblesRecursoDto,
} from '../../application/dtos/acc/resources';

@Controller('acc/resources')
@UseGuards(JwtAuthGuard)
export class AccResourcesController {
    constructor(
        private readonly listarRecursosUseCase: ListarRecursosUseCase,
        private readonly obtenerRecursoPorIdUseCase: ObtenerRecursoPorIdUseCase,
        private readonly crearRecursoUseCase: CrearRecursoUseCase,
        private readonly actualizarRecursoUseCase: ActualizarRecursoUseCase,
        private readonly eliminarRecursoUseCase: EliminarRecursoUseCase,
        private readonly listarPermisosRolUseCase: ListarPermisosRolUseCase,
        private readonly listarRolesRecursoUseCase: ListarRolesRecursoUseCase,
        private readonly asignarPermisoUseCase: AsignarPermisoUseCase,
        private readonly removerPermisoUseCase: RemoverPermisoUseCase,
        private readonly sincronizarPermisosRolUseCase: SincronizarPermisosRolUseCase,
        private readonly listarPermisosUsuarioUseCase: ListarPermisosUsuarioUseCase,
        private readonly listarUsuariosRecursoUseCase: ListarUsuariosRecursoUseCase,
        private readonly listarUsuariosDisponiblesRecursoUseCase: ListarUsuariosDisponiblesRecursoUseCase,
        private readonly asignarPermisoUsuarioUseCase: AsignarPermisoUsuarioUseCase,
        private readonly actualizarNivelPermisoUsuarioUseCase: ActualizarNivelPermisoUsuarioUseCase,
        private readonly removerPermisoUsuarioUseCase: RemoverPermisoUsuarioUseCase,
        private readonly sincronizarPermisosUsuarioUseCase: SincronizarPermisosUsuarioUseCase,
        private readonly listarNivelesPermisoUseCase: ListarNivelesPermisoUseCase,
    ) { }

    /**
     * GET - Listar niveles de permisos disponibles
     * GET /acc/resources/permission-levels
     * IMPORTANTE: Esta ruta debe ir ANTES de las rutas con parámetros dinámicos
     */
    @Get('permission-levels')
    @HttpCode(HttpStatus.OK)
    async listPermissionLevels() {
        const resultado = await this.listarNivelesPermisoUseCase.execute();
        return ApiResponseDto.success(
            resultado.data,
            'Niveles de permisos listados exitosamente',
        );
    }

    /**
     * GET - Listar recursos ACC con paginación y búsqueda
     * GET /acc/resources
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async index(@Query() dto: ListarRecursosDto) {
        const resultado = await this.listarRecursosUseCase.execute(dto);
        if (resultado.pagination) {
            return ApiResponseDto.paginated(
                resultado.data,
                {
                    currentPage: resultado.pagination.current_page || 1,
                    itemsPerPage: resultado.pagination.limit,
                    totalItems: resultado.pagination.total,
                    totalPages: resultado.pagination.total_pages || 0,
                },
                'Recursos listados exitosamente',
            );
        }
        return ApiResponseDto.success(
            resultado.data,
            'Recursos listados exitosamente',
        );
    }

    /**
     * GET - Listar permisos de un rol
     * GET /acc/resources/roles/:roleId/permissions
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get('roles/:roleId/permissions')
    @HttpCode(HttpStatus.OK)
    async listRolePermissions(
        @Param('roleId') roleId: string,
        @Query() dto: ListarPermisosRolDto,
    ) {
        const roleIdNum = parseInt(roleId, 10);
        if (isNaN(roleIdNum)) {
            throw new BadRequestException('El ID del rol debe ser un número válido');
        }

        const resultado = await this.listarPermisosRolUseCase.execute(roleIdNum, dto);
        if (resultado.pagination) {
            return ApiResponseDto.paginated(
                resultado.data,
                {
                    currentPage: resultado.pagination.current_page || 1,
                    itemsPerPage: resultado.pagination.limit,
                    totalItems: resultado.pagination.total,
                    totalPages: resultado.pagination.total_pages || 0,
                },
                'Permisos listados exitosamente',
            );
        }
        return ApiResponseDto.success(
            resultado.data,
            'Permisos listados exitosamente',
        );
    }

    /**
     * GET - Listar roles con acceso a un recurso
     * GET /acc/resources/:resourceId/roles
     * IMPORTANTE: Esta ruta debe ir antes de la ruta genérica :id
     */
    @Get(':resourceId/roles')
    @HttpCode(HttpStatus.OK)
    async listResourceRoles(@Param('resourceId') resourceId: string) {
        const resourceIdNum = parseInt(resourceId, 10);
        if (isNaN(resourceIdNum)) {
            throw new BadRequestException('El ID del recurso debe ser un número válido');
        }

        const resultado = await this.listarRolesRecursoUseCase.execute(resourceIdNum);
        return ApiResponseDto.success(
            resultado.data,
            'Roles listados exitosamente',
        );
    }

    /**
     * GET - Obtener recurso ACC por ID
     * GET /acc/resources/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async show(@Param('id') id: string) {
        const resourceId = parseInt(id, 10);
        if (isNaN(resourceId)) {
            throw new BadRequestException('El ID del recurso debe ser un número válido');
        }

        const resultado = await this.obtenerRecursoPorIdUseCase.execute(resourceId);
        return ApiResponseDto.success(
            resultado,
            'Recurso obtenido exitosamente',
        );
    }

    /**
     * POST - Crear o sincronizar recurso ACC
     * POST /acc/resources
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async store(@Body() dto: CrearRecursoDto, @Req() request: Request) {
        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.crearRecursoUseCase.execute(dto, userId);
        return ApiResponseDto.created(
            { id: resultado.id },
            resultado.message || 'Recurso creado exitosamente',
        );
    }

    /**
     * PUT - Actualizar recurso ACC
     * PUT /acc/resources/:id
     */
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() dto: ActualizarRecursoDto,
        @Req() request: Request,
    ) {
        const resourceId = parseInt(id, 10);
        if (isNaN(resourceId)) {
            throw new BadRequestException('El ID del recurso debe ser un número válido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.actualizarRecursoUseCase.execute(resourceId, dto, userId);
        return ApiResponseDto.success(
            null,
            resultado.message || 'Recurso actualizado exitosamente',
        );
    }

    /**
     * DELETE - Eliminar recurso ACC (Soft Delete)
     * DELETE /acc/resources/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async destroy(@Param('id') id: string, @Req() request: Request) {
        const resourceId = parseInt(id, 10);
        if (isNaN(resourceId)) {
            throw new BadRequestException('El ID del recurso debe ser un número válido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.eliminarRecursoUseCase.execute(resourceId, userId);
        return ApiResponseDto.success(
            null,
            resultado.message || 'Recurso eliminado exitosamente',
        );
    }


    /**
     * POST - Asignar permiso de recurso a rol
     * POST /acc/resources/permissions
     */
    @Post('permissions')
    @HttpCode(HttpStatus.CREATED)
    async assignPermission(@Body() dto: AsignarPermisoDto, @Req() request: Request) {
        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.asignarPermisoUseCase.execute(dto, userId);
        return ApiResponseDto.created(
            { id: resultado.id },
            resultado.message || 'Permiso asignado exitosamente',
        );
    }

    /**
     * DELETE - Remover permiso de recurso a rol
     * DELETE /acc/resources/permissions/:id
     */
    @Delete('permissions/:id')
    @HttpCode(HttpStatus.OK)
    async removePermission(@Param('id') id: string, @Req() request: Request) {
        const permissionId = parseInt(id, 10);
        if (isNaN(permissionId)) {
            throw new BadRequestException('El ID del permiso debe ser un número válido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.removerPermisoUseCase.execute(permissionId, userId);
        return ApiResponseDto.success(
            null,
            resultado.message || 'Permiso removido exitosamente',
        );
    }

    /**
     * PUT - Sincronizar permisos de un rol (asignar múltiples recursos)
     * PUT /acc/resources/roles/:roleId/permissions/sync
     */
    @Put('roles/:roleId/permissions/sync')
    @HttpCode(HttpStatus.OK)
    async syncRolePermissions(
        @Param('roleId') roleId: string,
        @Body() dto: SincronizarPermisosRolDto,
        @Req() request: Request,
    ) {
        const roleIdNum = parseInt(roleId, 10);
        if (isNaN(roleIdNum)) {
            throw new BadRequestException('El ID del rol debe ser un número válido');
        }

        if (dto.role_id !== roleIdNum) {
            throw new BadRequestException('El role_id en el body debe coincidir con el roleId en la URL');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.sincronizarPermisosRolUseCase.execute(dto, userId);
        return ApiResponseDto.success(
            { asignados: resultado.asignados },
            resultado.message || 'Permisos sincronizados exitosamente',
        );
    }

    /**
     * GET - Listar permisos de un usuario específico
     * GET /acc/resources/users/:userId/permissions
     */
    @Get('users/:userId/permissions')
    @HttpCode(HttpStatus.OK)
    async listUserPermissions(
        @Param('userId') userId: string,
        @Query() dto: ListarPermisosUsuarioDto,
    ) {
        const userIdNum = parseInt(userId, 10);
        if (isNaN(userIdNum)) {
            throw new BadRequestException('El ID del usuario debe ser un número válido');
        }

        const resultado = await this.listarPermisosUsuarioUseCase.execute(userIdNum, dto);
        if (resultado.pagination) {
            return ApiResponseDto.paginated(
                resultado.data,
                {
                    currentPage: resultado.pagination.current_page || 1,
                    itemsPerPage: resultado.pagination.limit,
                    totalItems: resultado.pagination.total,
                    totalPages: resultado.pagination.total_pages || 0,
                },
                'Permisos listados exitosamente',
            );
        }
        return ApiResponseDto.success(
            resultado.data,
            'Permisos listados exitosamente',
        );
    }

    /**
     * GET - Listar usuarios disponibles para un recurso (incluye búsqueda)
     * GET /acc/resources/:resourceId/users/available
     * IMPORTANTE: Esta ruta debe ir antes de la ruta genérica :id
     */
    @Get(':resourceId/users/available')
    @HttpCode(HttpStatus.OK)
    async listAvailableUsersForResource(
        @Param('resourceId') resourceId: string,
        @Query() dto: ListarUsuariosDisponiblesRecursoDto,
    ) {
        const resourceIdNum = parseInt(resourceId, 10);
        if (isNaN(resourceIdNum)) {
            throw new BadRequestException('El ID del recurso debe ser un número válido');
        }

        const resultado = await this.listarUsuariosDisponiblesRecursoUseCase.execute(resourceIdNum, dto);
        if (resultado.pagination) {
            return ApiResponseDto.paginated(
                resultado.data,
                {
                    currentPage: resultado.pagination.current_page || 1,
                    itemsPerPage: resultado.pagination.limit,
                    totalItems: resultado.pagination.total,
                    totalPages: resultado.pagination.total_pages || 0,
                },
                'Usuarios disponibles listados exitosamente',
            );
        }
        return ApiResponseDto.success(
            resultado.data,
            'Usuarios disponibles listados exitosamente',
        );
    }

    /**
     * GET - Listar usuarios con acceso a un recurso
     * GET /acc/resources/:resourceId/users
     * IMPORTANTE: Esta ruta debe ir antes de la ruta genérica :id
     */
    @Get(':resourceId/users')
    @HttpCode(HttpStatus.OK)
    async listResourceUsers(@Param('resourceId') resourceId: string) {
        const resourceIdNum = parseInt(resourceId, 10);
        if (isNaN(resourceIdNum)) {
            throw new BadRequestException('El ID del recurso debe ser un número válido');
        }

        const resultado = await this.listarUsuariosRecursoUseCase.execute(resourceIdNum);
        return ApiResponseDto.success(
            resultado.data,
            'Usuarios listados exitosamente',
        );
    }

    /**
     * POST - Asignar permiso de recurso a usuario (con nivel de permiso)
     * POST /acc/resources/users/permissions
     */
    @Post('users/permissions')
    @HttpCode(HttpStatus.CREATED)
    async assignUserPermission(@Body() dto: AsignarPermisoUsuarioDto, @Req() request: Request) {
        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.asignarPermisoUsuarioUseCase.execute(dto, userId);
        return ApiResponseDto.created(
            { id: resultado.id },
            resultado.message || 'Permiso asignado exitosamente',
        );
    }

    /**
     * PATCH - Actualizar nivel de permiso de un usuario
     * PATCH /acc/resources/users/permissions/:id/level
     */
    @Patch('users/permissions/:id/level')
    @HttpCode(HttpStatus.OK)
    async updateUserPermissionLevel(
        @Param('id') id: string,
        @Body() dto: ActualizarNivelPermisoUsuarioDto,
        @Req() request: Request,
    ) {
        const permissionId = parseInt(id, 10);
        if (isNaN(permissionId)) {
            throw new BadRequestException('El ID del permiso debe ser un número válido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.actualizarNivelPermisoUsuarioUseCase.execute(
            permissionId,
            dto,
            userId,
        );
        return ApiResponseDto.success(
            null,
            resultado.message || 'Nivel de permiso actualizado exitosamente',
        );
    }

    /**
     * DELETE - Remover permiso de recurso a usuario
     * DELETE /acc/resources/users/permissions/:id
     */
    @Delete('users/permissions/:id')
    @HttpCode(HttpStatus.OK)
    async removeUserPermission(@Param('id') id: string, @Req() request: Request) {
        const permissionId = parseInt(id, 10);
        if (isNaN(permissionId)) {
            throw new BadRequestException('El ID del permiso debe ser un número válido');
        }

        const user = (request as any).user;
        const userId = user?.sub || user?.id || 1;

        const resultado = await this.removerPermisoUsuarioUseCase.execute(permissionId, userId);
        return ApiResponseDto.success(
            null,
            resultado.message || 'Permiso removido exitosamente',
        );
    }

    /**
     * PUT - Sincronizar permisos de un usuario (asignar múltiples recursos)
     * PUT /acc/resources/users/:userId/permissions/sync
     */
    @Put('users/:userId/permissions/sync')
    @HttpCode(HttpStatus.OK)
    async syncUserPermissions(
        @Param('userId') userId: string,
        @Body() dto: SincronizarPermisosUsuarioDto,
        @Req() request: Request,
    ) {
        const userIdNum = parseInt(userId, 10);
        if (isNaN(userIdNum)) {
            throw new BadRequestException('El ID del usuario debe ser un número válido');
        }

        if (dto.user_id !== userIdNum) {
            throw new BadRequestException('El user_id en el body debe coincidir con el userId en la URL');
        }

        const user = (request as any).user;
        const idUsuarioModificacion = user?.sub || user?.id || 1;

        const resultado = await this.sincronizarPermisosUsuarioUseCase.execute(dto, idUsuarioModificacion);
        return ApiResponseDto.success(
            { asignados: resultado.asignados },
            resultado.message || 'Permisos sincronizados exitosamente',
        );
    }
}

