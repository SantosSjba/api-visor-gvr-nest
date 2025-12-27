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
    CrearUsuarioUseCase,
    ImportarUsuariosUseCase,
    ObtenerUsuariosUseCase,
    ObtenerUsuarioPorIdUseCase,
    BuscarUsuariosUseCase,
    ObtenerProyectosUsuarioUseCase,
    ObtenerProductosUsuarioUseCase,
    ObtenerRolesUsuarioUseCase,
    ActualizarUsuarioUseCase,
} from '../../application/use-cases/acc/account-users';
import {
    CrearUsuarioDto,
    ImportarUsuariosDto,
    ObtenerUsuariosDto,
    BuscarUsuariosDto,
    ActualizarUsuarioDto,
    ObtenerProyectosUsuarioDto,
} from '../../application/dtos/acc/account-users';

@Controller('acc/account-users')
@UseGuards(JwtAuthGuard)
export class AccAccountUsersController {
    constructor(
        private readonly crearUsuarioUseCase: CrearUsuarioUseCase,
        private readonly importarUsuariosUseCase: ImportarUsuariosUseCase,
        private readonly obtenerUsuariosUseCase: ObtenerUsuariosUseCase,
        private readonly obtenerUsuarioPorIdUseCase: ObtenerUsuarioPorIdUseCase,
        private readonly buscarUsuariosUseCase: BuscarUsuariosUseCase,
        private readonly obtenerProyectosUsuarioUseCase: ObtenerProyectosUsuarioUseCase,
        private readonly obtenerProductosUsuarioUseCase: ObtenerProductosUsuarioUseCase,
        private readonly obtenerRolesUsuarioUseCase: ObtenerRolesUsuarioUseCase,
        private readonly actualizarUsuarioUseCase: ActualizarUsuarioUseCase,
    ) { }

    /**
     * POST - Crear un nuevo usuario en BIM 360/ACC
     * POST /acc/account-users/:accountId
     */
    @Post(':accountId')
    @HttpCode(HttpStatus.CREATED)
    async crearUsuario(
        @Param('accountId') accountId: string,
        @Body() dto: CrearUsuarioDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.crearUsuarioUseCase.execute(accountId, dto);
        return ApiResponseDto.created(
            resultado.data,
            'Usuario creado exitosamente',
        );
    }

    /**
     * POST - Importar múltiples usuarios
     * POST /acc/account-users/:accountId/import
     */
    @Post(':accountId/import')
    @HttpCode(HttpStatus.OK)
    async importarUsuarios(
        @Param('accountId') accountId: string,
        @Body() dto: ImportarUsuariosDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.importarUsuariosUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Usuarios importados exitosamente',
        );
    }

    /**
     * GET - Obtener todos los usuarios de una cuenta
     * GET /acc/account-users/:accountId
     */
    @Get(':accountId')
    @HttpCode(HttpStatus.OK)
    async obtenerUsuarios(
        @Param('accountId') accountId: string,
        @Query() dto: ObtenerUsuariosDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.obtenerUsuariosUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Usuarios obtenidos exitosamente',
        );
    }

    /**
     * GET - Buscar usuarios por nombre
     * GET /acc/account-users/:accountId/search
     */
    @Get(':accountId/search')
    @HttpCode(HttpStatus.OK)
    async buscarUsuarios(
        @Param('accountId') accountId: string,
        @Query() dto: BuscarUsuariosDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.buscarUsuariosUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Búsqueda completada exitosamente',
        );
    }

    /**
     * GET - Obtener un usuario específico por ID
     * GET /acc/account-users/:accountId/:userId
     */
    @Get(':accountId/:userId')
    @HttpCode(HttpStatus.OK)
    async obtenerUsuarioPorId(
        @Param('accountId') accountId: string,
        @Param('userId') userId: string,
        @Query('region') region?: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario es requerido');
        }

        const resultado = await this.obtenerUsuarioPorIdUseCase.execute(accountId, userId, region);
        return ApiResponseDto.success(
            resultado.data,
            'Usuario obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener los proyectos de un usuario
     * GET /acc/account-users/:accountId/:userId/projects
     */
    @Get(':accountId/:userId/projects')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectosUsuario(
        @Param('accountId') accountId: string,
        @Param('userId') userId: string,
        @Query() dto: ObtenerProyectosUsuarioDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario es requerido');
        }

        const resultado = await this.obtenerProyectosUsuarioUseCase.execute(accountId, userId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Proyectos del usuario obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener los productos de un usuario
     * GET /acc/account-users/:accountId/:userId/products
     */
    @Get(':accountId/:userId/products')
    @HttpCode(HttpStatus.OK)
    async obtenerProductosUsuario(
        @Param('accountId') accountId: string,
        @Param('userId') userId: string,
        @Query('region') region?: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario es requerido');
        }

        const resultado = await this.obtenerProductosUsuarioUseCase.execute(accountId, userId, region);
        return ApiResponseDto.success(
            resultado.data,
            'Productos del usuario obtenidos exitosamente',
        );
    }

    /**
     * GET - Obtener los roles de un usuario
     * GET /acc/account-users/:accountId/:userId/roles
     */
    @Get(':accountId/:userId/roles')
    @HttpCode(HttpStatus.OK)
    async obtenerRolesUsuario(
        @Param('accountId') accountId: string,
        @Param('userId') userId: string,
        @Query('region') region?: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario es requerido');
        }

        const resultado = await this.obtenerRolesUsuarioUseCase.execute(accountId, userId, region);
        return ApiResponseDto.success(
            resultado.data,
            'Roles del usuario obtenidos exitosamente',
        );
    }

    /**
     * PATCH - Actualizar un usuario
     * PATCH /acc/account-users/:accountId/:userId
     */
    @Patch(':accountId/:userId')
    @HttpCode(HttpStatus.OK)
    async actualizarUsuario(
        @Param('accountId') accountId: string,
        @Param('userId') userId: string,
        @Body() dto: ActualizarUsuarioDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!userId) {
            throw new BadRequestException('El ID del usuario es requerido');
        }

        const resultado = await this.actualizarUsuarioUseCase.execute(accountId, userId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Usuario actualizado exitosamente',
        );
    }
}


