import {
    Controller,
    Get,
    Query,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    UnauthorizedException,
    ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ListarMenuOpcionesUseCase } from '../../application/use-cases/general/listar-menu-opciones.use-case';
import { ObtenerMenuOpcionUseCase } from '../../application/use-cases/general/obtener-menu-opcion.use-case';
import { ObtenerOpcionesListaUseCase } from '../../application/use-cases/general/obtener-opciones-lista.use-case';
import { ListarMenuRecursivoUseCase } from '../../application/use-cases/general/listar-menu-recursivo.use-case';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class GeneralController {
    constructor(
        private readonly listarMenuOpcionesUseCase: ListarMenuOpcionesUseCase,
        private readonly obtenerMenuOpcionUseCase: ObtenerMenuOpcionUseCase,
        private readonly obtenerOpcionesListaUseCase: ObtenerOpcionesListaUseCase,
        private readonly listarMenuRecursivoUseCase: ListarMenuRecursivoUseCase,
    ) { }

    /**
     * Listar todas las opciones de menú
     * GET /menu-opciones
     */
    @Get('menu-opciones')
    @HttpCode(HttpStatus.OK)
    async listarMenuOpciones() {
        const menuOpciones = await this.listarMenuOpcionesUseCase.execute();

        return ApiResponseDto.success(
            menuOpciones,
            'Opciones de menú obtenidas exitosamente',
        );
    }

    /**
     * Obtener opción de menú por ID
     * GET /menu-opcion?id=1
     */
    @Get('menu-opcion')
    @HttpCode(HttpStatus.OK)
    async obtenerMenuOpcion(
        @Query('id', new ParseIntPipe({ optional: false })) id: number
    ) {
        const menuOpcion = await this.obtenerMenuOpcionUseCase.execute(id);

        return ApiResponseDto.success(
            menuOpcion,
            'Opción de menú obtenida exitosamente',
        );
    }

    /**
     * Obtener opciones por lista
     * GET /listado-opciones?idLista=1
     */
    @Get('listado-opciones')
    @HttpCode(HttpStatus.OK)
    async obtenerOpcionesPorLista(
        @Query('idLista', new ParseIntPipe({ optional: false })) idLista: number
    ) {
        const listaOpciones = await this.obtenerOpcionesListaUseCase.execute(idLista);

        return ApiResponseDto.success(
            listaOpciones,
            'Listado de opciones obtenido exitosamente',
        );
    }

    /**
     * Listar menú recursivo para usuario autenticado
     * GET /listado-opciones-recursivo
     */
    @Get('listado-opciones-recursivo')
    @HttpCode(HttpStatus.OK)
    async listarMenuRecursivo(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const menuOpciones = await this.listarMenuRecursivoUseCase.execute(token);

        return ApiResponseDto.success(
            menuOpciones,
            'Opciones de menú obtenidas exitosamente',
        );
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
