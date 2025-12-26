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
    Req,
    UseGuards,
    UnauthorizedException,
    ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ListarRolesUseCase } from '../../application/use-cases/rol/listar-roles.use-case';
import { ListarRolesForListUseCase } from '../../application/use-cases/rol/listar-roles-for-list.use-case';
import { ObtenerRolUseCase } from '../../application/use-cases/rol/obtener-rol.use-case';
import { CrearRolUseCase } from '../../application/use-cases/rol/crear-rol.use-case';
import { EditarRolUseCase } from '../../application/use-cases/rol/editar-rol.use-case';
import { EliminarRolUseCase } from '../../application/use-cases/rol/eliminar-rol.use-case';
import { ListarPermisosRolUseCase } from '../../application/use-cases/rol/listar-permisos-rol.use-case';
import { ListarPermisosDisponiblesUseCase } from '../../application/use-cases/rol/listar-permisos-disponibles.use-case';
import { AsignarPermisoRolUseCase } from '../../application/use-cases/rol/asignar-permiso-rol.use-case';
import { AsignarPermisosRolUseCase } from '../../application/use-cases/rol/asignar-permisos-rol.use-case';
import { RemoverPermisoRolUseCase } from '../../application/use-cases/rol/remover-permiso-rol.use-case';
import { SincronizarPermisosRolUseCase } from '../../application/use-cases/rol/sincronizar-permisos-rol.use-case';
import { ObtenerDetalleRolUseCase } from '../../application/use-cases/rol/obtener-detalle-rol.use-case';
import { GestionarRolesUsuarioUseCase } from '../../application/use-cases/rol/gestionar-roles-usuario.use-case';
import { CreateRolDto } from '../../application/dtos/rol/create-rol.dto';
import { UpdateRolDto } from '../../application/dtos/rol/update-rol.dto';
import { AsignarPermisoDto } from '../../application/dtos/rol/asignar-permiso.dto';
import { AsignarPermisosDto } from '../../application/dtos/rol/asignar-permisos.dto';
import { GestionarRolesUsuarioDto } from '../../application/dtos/rol/gestionar-roles-usuario.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('rolesv2')
@UseGuards(JwtAuthGuard)
export class RolController {
    constructor(
        private readonly listarRolesUseCase: ListarRolesUseCase,
        private readonly listarRolesForListUseCase: ListarRolesForListUseCase,
        private readonly obtenerRolUseCase: ObtenerRolUseCase,
        private readonly crearRolUseCase: CrearRolUseCase,
        private readonly editarRolUseCase: EditarRolUseCase,
        private readonly eliminarRolUseCase: EliminarRolUseCase,
        private readonly listarPermisosRolUseCase: ListarPermisosRolUseCase,
        private readonly listarPermisosDisponiblesUseCase: ListarPermisosDisponiblesUseCase,
        private readonly asignarPermisoRolUseCase: AsignarPermisoRolUseCase,
        private readonly asignarPermisosRolUseCase: AsignarPermisosRolUseCase,
        private readonly removerPermisoRolUseCase: RemoverPermisoRolUseCase,
        private readonly sincronizarPermisosRolUseCase: SincronizarPermisosRolUseCase,
        private readonly obtenerDetalleRolUseCase: ObtenerDetalleRolUseCase,
        private readonly gestionarRolesUsuarioUseCase: GestionarRolesUsuarioUseCase,
        private readonly jwtService: JwtService,
    ) { }

    @Get('forList')
    @HttpCode(HttpStatus.OK)
    async listarRolesForList() {
        const data = await this.listarRolesForListUseCase.execute();
        return ApiResponseDto.success(data, 'Roles obtenidos exitosamente');
    }

    @Post('usuarios/:idUsuario')
    @HttpCode(HttpStatus.OK)
    async gestionarRolesUsuario(
        @Param('idUsuario', ParseIntPipe) idUsuario: number,
        @Body() gestionarDto: GestionarRolesUsuarioDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.gestionarRolesUsuarioUseCase.execute(idUsuario, gestionarDto, payload.sub);

        return ApiResponseDto.success(data, 'Roles del usuario gestionados exitosamente');
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async listarRoles(
        @Query('busqueda') busqueda?: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    ) {
        const data = await this.listarRolesUseCase.execute({ busqueda, limit, offset });
        return ApiResponseDto.success(data, 'Roles obtenidos exitosamente');
    }

    @Get(':id/detalle')
    @HttpCode(HttpStatus.OK)
    async obtenerDetalleRol(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerDetalleRolUseCase.execute(id);
        return ApiResponseDto.success(data, 'Detalle del rol obtenido exitosamente');
    }

    @Get(':id/permisos')
    @HttpCode(HttpStatus.OK)
    async listarPermisosRol(@Param('id', ParseIntPipe) id: number) {
        const data = await this.listarPermisosRolUseCase.execute(id);
        return ApiResponseDto.success(data, 'Permisos del rol obtenidos exitosamente');
    }

    @Get(':id/permisos-disponibles')
    @HttpCode(HttpStatus.OK)
    async listarPermisosDisponibles(@Param('id', ParseIntPipe) id: number) {
        const data = await this.listarPermisosDisponiblesUseCase.execute(id);
        return ApiResponseDto.success(data, 'Permisos disponibles obtenidos exitosamente');
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerRol(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerRolUseCase.execute(id);
        return ApiResponseDto.success(data, 'Rol obtenido exitosamente');
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearRol(@Body() createDto: CreateRolDto, @Req() request: Request) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.crearRolUseCase.execute(createDto, payload.sub);

        return ApiResponseDto.created(data, 'Rol creado exitosamente');
    }

    @Post(':id/permisos')
    @HttpCode(HttpStatus.CREATED)
    async asignarPermisoRol(
        @Param('id', ParseIntPipe) id: number,
        @Body() asignarDto: AsignarPermisoDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.asignarPermisoRolUseCase.execute(id, asignarDto, payload.sub);

        return ApiResponseDto.created(data, 'Permiso asignado exitosamente');
    }

    @Post(':id/permisos-multiples')
    @HttpCode(HttpStatus.CREATED)
    async asignarPermisosRol(
        @Param('id', ParseIntPipe) id: number,
        @Body() asignarDto: AsignarPermisosDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.asignarPermisosRolUseCase.execute(id, asignarDto, payload.sub);

        return ApiResponseDto.created(data, 'Permisos asignados exitosamente');
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async editarRol(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateRolDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.editarRolUseCase.execute(id, updateDto, payload.sub);

        return ApiResponseDto.success(data, 'Rol actualizado exitosamente');
    }

    @Put(':id/permisos/sincronizar')
    @HttpCode(HttpStatus.OK)
    async sincronizarPermisosRol(
        @Param('id', ParseIntPipe) id: number,
        @Body() sincronizarDto: AsignarPermisosDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.sincronizarPermisosRolUseCase.execute(id, sincronizarDto, payload.sub);

        return ApiResponseDto.success(data, 'Permisos sincronizados exitosamente');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async eliminarRol(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.eliminarRolUseCase.execute(id, payload.sub);

        return ApiResponseDto.success(data, 'Rol eliminado exitosamente');
    }

    @Delete(':id/permisos/:idPermiso')
    @HttpCode(HttpStatus.OK)
    async removerPermisoRol(
        @Param('id', ParseIntPipe) id: number,
        @Param('idPermiso', ParseIntPipe) idPermiso: number,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.removerPermisoRolUseCase.execute(id, idPermiso, payload.sub);

        return ApiResponseDto.success(data, 'Permiso removido exitosamente');
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
