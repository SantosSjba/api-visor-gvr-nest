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
import { ListarProyectosUseCase } from '../../application/use-cases/proyecto/listar-proyectos.use-case';
import { ObtenerProyectoUseCase } from '../../application/use-cases/proyecto/obtener-proyecto.use-case';
import { CrearProyectoUseCase } from '../../application/use-cases/proyecto/crear-proyecto.use-case';
import { EditarProyectoUseCase } from '../../application/use-cases/proyecto/editar-proyecto.use-case';
import { EliminarProyectoUseCase } from '../../application/use-cases/proyecto/eliminar-proyecto.use-case';
import { CreateProyectoDto } from '../../application/dtos/proyecto/create-proyecto.dto';
import { UpdateProyectoDto } from '../../application/dtos/proyecto/update-proyecto.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('proyectos')
@UseGuards(JwtAuthGuard)
export class ProyectoController {
    constructor(
        private readonly listarProyectosUseCase: ListarProyectosUseCase,
        private readonly obtenerProyectoUseCase: ObtenerProyectoUseCase,
        private readonly crearProyectoUseCase: CrearProyectoUseCase,
        private readonly editarProyectoUseCase: EditarProyectoUseCase,
        private readonly eliminarProyectoUseCase: EliminarProyectoUseCase,
        private readonly jwtService: JwtService,
    ) { }

    @Get()
    @HttpCode(HttpStatus.OK)
    async listarProyectos(
        @Req() request: Request,
        @Query('idTipoProyecto', new ParseIntPipe({ optional: true })) idTipoProyecto?: number,
        @Query('idPais', new ParseIntPipe({ optional: true })) idPais?: number,
        @Query('busqueda') busqueda?: string,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuario = payload.sub;

        const data = await this.listarProyectosUseCase.execute({
            idUsuario,
            idTipoProyecto,
            idPais,
            busqueda,
            limit,
            offset,
        });

        return ApiResponseDto.success(data, 'Proyectos obtenidos exitosamente');
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerProyecto(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerProyectoUseCase.execute(id);

        return ApiResponseDto.success(data, 'Proyecto obtenido exitosamente');
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearProyecto(
        @Body() createDto: CreateProyectoDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioCreacion = payload.sub;

        const data = await this.crearProyectoUseCase.execute(createDto, idUsuarioCreacion);

        return ApiResponseDto.created(data, 'Proyecto creado exitosamente');
    }

    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async editarProyecto(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateProyectoDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.editarProyectoUseCase.execute(id, updateDto, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Proyecto actualizado exitosamente');
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async eliminarProyecto(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.eliminarProyectoUseCase.execute(id, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Proyecto eliminado exitosamente');
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
