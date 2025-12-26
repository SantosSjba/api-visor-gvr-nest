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
import { ListarEmpresasUseCase } from '../../application/use-cases/empresa/listar-empresas.use-case';
import { ObtenerEmpresaUseCase } from '../../application/use-cases/empresa/obtener-empresa.use-case';
import { CrearEmpresaUseCase } from '../../application/use-cases/empresa/crear-empresa.use-case';
import { EditarEmpresaUseCase } from '../../application/use-cases/empresa/editar-empresa.use-case';
import { EliminarEmpresaUseCase } from '../../application/use-cases/empresa/eliminar-empresa.use-case';
import { CreateEmpresaDto } from '../../application/dtos/empresa/create-empresa.dto';
import { UpdateEmpresaDto } from '../../application/dtos/empresa/update-empresa.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('empresas')
@UseGuards(JwtAuthGuard)
export class EmpresaController {
    constructor(
        private readonly listarEmpresasUseCase: ListarEmpresasUseCase,
        private readonly obtenerEmpresaUseCase: ObtenerEmpresaUseCase,
        private readonly crearEmpresaUseCase: CrearEmpresaUseCase,
        private readonly editarEmpresaUseCase: EditarEmpresaUseCase,
        private readonly eliminarEmpresaUseCase: EliminarEmpresaUseCase,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Listar empresas con búsqueda y paginación
     * GET /empresas?busqueda=texto&limit=10&offset=0
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async listarEmpresas(
        @Req() request: Request,
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

        const data = await this.listarEmpresasUseCase.execute({
            idUsuario,
            busqueda,
            limit,
            offset,
        });

        return ApiResponseDto.success(data, 'Empresas obtenidas exitosamente');
    }

    /**
     * Obtener empresa por ID
     * GET /empresas/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerEmpresa(@Param('id', ParseIntPipe) id: number) {
        const data = await this.obtenerEmpresaUseCase.execute(id);

        return ApiResponseDto.success(data, 'Empresa obtenida exitosamente');
    }

    /**
     * Crear nueva empresa
     * POST /empresas
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async crearEmpresa(
        @Body() createDto: CreateEmpresaDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioCreacion = payload.sub;

        const data = await this.crearEmpresaUseCase.execute(createDto, idUsuarioCreacion);

        return ApiResponseDto.created(data, 'Empresa creada exitosamente');
    }

    /**
     * Editar empresa existente
     * PUT /empresas/:id
     */
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    async editarEmpresa(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateEmpresaDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.editarEmpresaUseCase.execute(id, updateDto, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Empresa actualizada exitosamente');
    }

    /**
     * Eliminar empresa (soft delete)
     * DELETE /empresas/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async eliminarEmpresa(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const data = await this.eliminarEmpresaUseCase.execute(id, idUsuarioModificacion);

        return ApiResponseDto.success(data, 'Empresa eliminada exitosamente');
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
