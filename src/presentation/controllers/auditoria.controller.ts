import {
    Controller,
    Get,
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
    ListarAuditoriasUseCase,
    ObtenerAuditoriaPorIdUseCase,
    ObtenerHistorialEntidadUseCase,
    ObtenerHistorialUsuarioUseCase,
    ObtenerEstadisticasUseCase,
} from '../../application/use-cases/auditoria';
import {
    ListarAuditoriasDto,
    ObtenerHistorialUsuarioDto,
    ObtenerEstadisticasDto,
} from '../../application/dtos/auditoria';

@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
    constructor(
        private readonly listarAuditoriasUseCase: ListarAuditoriasUseCase,
        private readonly obtenerAuditoriaPorIdUseCase: ObtenerAuditoriaPorIdUseCase,
        private readonly obtenerHistorialEntidadUseCase: ObtenerHistorialEntidadUseCase,
        private readonly obtenerHistorialUsuarioUseCase: ObtenerHistorialUsuarioUseCase,
        private readonly obtenerEstadisticasUseCase: ObtenerEstadisticasUseCase,
    ) { }

    /**
     * GET - Estadísticas de auditoría
     * GET /auditoria/estadisticas
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get('estadisticas')
    @HttpCode(HttpStatus.OK)
    async obtenerEstadisticas(@Query() dto: ObtenerEstadisticasDto) {
        const resultado = await this.obtenerEstadisticasUseCase.execute(dto);
        return ApiResponseDto.success(
            resultado,
            'Estadísticas obtenidas exitosamente',
        );
    }

    /**
     * GET - Historial de una entidad específica
     * GET /auditoria/entidad/:entidad/:id
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get('entidad/:entidad/:id')
    @HttpCode(HttpStatus.OK)
    async obtenerHistorialEntidad(
        @Param('entidad') entidad: string,
        @Param('id') id: string,
    ) {
        if (!entidad || !id) {
            throw new BadRequestException('Entidad e ID son requeridos');
        }

        const resultado = await this.obtenerHistorialEntidadUseCase.execute(entidad, id);
        return ApiResponseDto.success(
            resultado,
            'Historial obtenido exitosamente',
        );
    }

    /**
     * GET - Historial de acciones de un usuario
     * GET /auditoria/usuario/:id
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get('usuario/:id')
    @HttpCode(HttpStatus.OK)
    async obtenerHistorialUsuario(
        @Param('id') id: string,
        @Query() dto: ObtenerHistorialUsuarioDto,
    ) {
        const idNumero = parseInt(id, 10);
        if (isNaN(idNumero)) {
            throw new BadRequestException('El ID debe ser un número válido');
        }

        const resultado = await this.obtenerHistorialUsuarioUseCase.execute(idNumero, dto);
        return ApiResponseDto.paginated(
            resultado.data,
            resultado.pagination,
            'Historial de usuario obtenido exitosamente',
        );
    }

    /**
     * GET - Listar auditorías con filtros
     * GET /auditoria
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    async listarAuditorias(@Query() dto: ListarAuditoriasDto) {
        const resultado = await this.listarAuditoriasUseCase.execute(dto);
        return ApiResponseDto.paginated(
            resultado.data,
            resultado.pagination,
            'Auditorías obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener auditoría por ID
     * GET /auditoria/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async obtenerAuditoriaPorId(@Param('id') id: string) {
        const idNumero = parseInt(id, 10);
        if (isNaN(idNumero)) {
            throw new BadRequestException('El ID debe ser un número válido');
        }

        const resultado = await this.obtenerAuditoriaPorIdUseCase.execute(idNumero);
        return ApiResponseDto.success(
            resultado,
            'Auditoría obtenida exitosamente',
        );
    }
}

