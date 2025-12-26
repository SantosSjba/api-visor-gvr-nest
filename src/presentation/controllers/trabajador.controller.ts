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
import { ListarTrabajadoresUseCase } from '../../application/use-cases/trabajador/listar-trabajadores.use-case';
import { ListarAdministrativosUseCase } from '../../application/use-cases/trabajador/listar-administrativos.use-case';
import { ObtenerTrabajadorUseCase } from '../../application/use-cases/trabajador/obtener-trabajador.use-case';
import { CrearTrabajadorUseCase } from '../../application/use-cases/trabajador/crear-trabajador.use-case';
import { EditarTrabajadorUseCase } from '../../application/use-cases/trabajador/editar-trabajador.use-case';
import { EliminarTrabajadorUseCase } from '../../application/use-cases/trabajador/eliminar-trabajador.use-case';
import { ResetearContrasenaUseCase } from '../../application/use-cases/trabajador/resetear-contrasena.use-case';
import { CreateTrabajadorDto } from '../../application/dtos/trabajador/create-trabajador.dto';
import { UpdateTrabajadorDto } from '../../application/dtos/trabajador/update-trabajador.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard)
export class TrabajadorController {
    constructor(
        private readonly listarTrabajadoresUseCase: ListarTrabajadoresUseCase,
        private readonly listarAdministrativosUseCase: ListarAdministrativosUseCase,
        private readonly obtenerTrabajadorUseCase: ObtenerTrabajadorUseCase,
        private readonly crearTrabajadorUseCase: CrearTrabajadorUseCase,
        private readonly editarTrabajadorUseCase: EditarTrabajadorUseCase,
        private readonly eliminarTrabajadorUseCase: EliminarTrabajadorUseCase,
        private readonly resetearContrasenaUseCase: ResetearContrasenaUseCase,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Listar trabajadores administrativos
     * GET /trabajadores/administradores
     */
    @Get('administradores')
    @HttpCode(HttpStatus.OK)
    async listarAdministrativos() {
        const data = await this.listarAdministrativosUseCase.execute();

        return ApiResponseDto.success(data, 'Administradores listados exitosamente');
    }

    /**
     * Listar trabajadores con búsqueda y paginación
     * GET /trabajadores?idEmpresa=1&busqueda=texto&limit=10&offset=0
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async listarTrabajadores(
        @Req() request: Request,
        @Query('idEmpresa', new ParseIntPipe({ optional: true })) idEmpresa?: number,
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

        const data = await this.listarTrabajadoresUseCase.execute({
            idUsuario,
            idEmpresa,
            busqueda,
            limit,
            offset,
        });

        return ApiResponseDto.success(data, 'Trabajadores obtenidos exitosamente');
    }

    /**
     * Obtener trabajador por ID
     * GET /trabajadores/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerTrabajador(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerTrabajadorUseCase.execute(id);

        return ApiResponseDto.success(data, 'Trabajador obtenido exitosamente');
    }

    /**
     * Crear nuevo trabajador (crea usuario automáticamente)
     * POST /trabajadores
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearTrabajador(
        @Body() createDto: CreateTrabajadorDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioCreacion = payload.sub;

        const data = await this.crearTrabajadorUseCase.execute(createDto, idUsuarioCreacion);

        return ApiResponseDto.created(data, 'Trabajador creado exitosamente');
    }

    /**
     * Editar trabajador existente
     * PUT /trabajadores/:id
     */
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async editarTrabajador(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateTrabajadorDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.editarTrabajadorUseCase.execute(id, updateDto, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Trabajador actualizado exitosamente');
    }

    /**
     * Eliminar trabajador (soft delete - desactiva usuario también)
     * DELETE /trabajadores/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async eliminarTrabajador(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.eliminarTrabajadorUseCase.execute(id, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Trabajador eliminado exitosamente');
    }

    /**
     * Resetear contraseña de trabajador al número de documento
     * POST /trabajadores/:id/resetear-contrasena
     */
    @Post(':id/resetear-contrasena')
    @HttpCode(HttpStatus.OK)
    async resetearContrasena(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.resetearContrasenaUseCase.execute(id, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Contraseña reseteada exitosamente');
    }

    // Helper method
    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
