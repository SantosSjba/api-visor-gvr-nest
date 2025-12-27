import {
    Controller,
    Get,
    Post,
    Put,
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
} from '../../application/use-cases/acc/resources';
import {
    ListarRecursosDto,
    CrearRecursoDto,
    ActualizarRecursoDto,
    ListarPermisosRolDto,
    AsignarPermisoDto,
    SincronizarPermisosRolDto,
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
    ) { }

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
}

