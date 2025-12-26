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
import { ListarPermisosUseCase } from '../../application/use-cases/permiso/listar-permisos.use-case';
import { ObtenerPermisoUseCase } from '../../application/use-cases/permiso/obtener-permiso.use-case';
import { CrearPermisoUseCase } from '../../application/use-cases/permiso/crear-permiso.use-case';
import { EditarPermisoUseCase } from '../../application/use-cases/permiso/editar-permiso.use-case';
import { EliminarPermisoUseCase } from '../../application/use-cases/permiso/eliminar-permiso.use-case';
import { CreatePermisoDto } from '../../application/dtos/permiso/create-permiso.dto';
import { UpdatePermisoDto } from '../../application/dtos/permiso/update-permiso.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('permisos')
@UseGuards(JwtAuthGuard)
export class PermisoController {
    constructor(
        private readonly listarPermisosUseCase: ListarPermisosUseCase,
        private readonly obtenerPermisoUseCase: ObtenerPermisoUseCase,
        private readonly crearPermisoUseCase: CrearPermisoUseCase,
        private readonly editarPermisoUseCase: EditarPermisoUseCase,
        private readonly eliminarPermisoUseCase: EliminarPermisoUseCase,
        private readonly jwtService: JwtService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    async listarPermisos(
        @Query('busqueda') busqueda?: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    ) {
        const data = await this.listarPermisosUseCase.execute({ busqueda, limit, offset });
        return ApiResponseDto.success(data, 'Permisos obtenidos exitosamente');
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerPermiso(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerPermisoUseCase.execute(id);
        return ApiResponseDto.success(data, 'Permiso obtenido exitosamente');
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearPermiso(@Body() createDto: CreatePermisoDto, @Req() request: Request) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.crearPermisoUseCase.execute(createDto, payload.sub);

        return ApiResponseDto.created(data, 'Permiso creado exitosamente');
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async editarPermiso(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdatePermisoDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.editarPermisoUseCase.execute(id, updateDto, payload.sub);

        return ApiResponseDto.success(data, 'Permiso actualizado exitosamente');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async eliminarPermiso(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException('Token no proporcionado');

        const payload = await this.jwtService.verifyAsync(token);
        const data = await this.eliminarPermisoUseCase.execute(id, payload.sub);

        return ApiResponseDto.success(data, 'Permiso eliminado exitosamente');
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) return undefined;

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
