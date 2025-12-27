import {
    Controller,
    Get,
    Put,
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
    ObtenerBusinessUnitsUseCase,
    ObtenerBusinessUnitPorIdUseCase,
    ObtenerBusinessUnitsHijasUseCase,
    ObtenerArbolBusinessUnitsUseCase,
    BuscarBusinessUnitsUseCase,
    CrearOActualizarBusinessUnitsUseCase,
} from '../../application/use-cases/acc/business-units';
import {
    ObtenerBusinessUnitsDto,
    ObtenerBusinessUnitsHijasDto,
    BuscarBusinessUnitsDto,
    CrearOActualizarBusinessUnitsDto,
} from '../../application/dtos/acc/business-units';

@Controller('acc/business-units')
@UseGuards(JwtAuthGuard)
export class BusinessUnitsController {
    constructor(
        private readonly obtenerBusinessUnitsUseCase: ObtenerBusinessUnitsUseCase,
        private readonly obtenerBusinessUnitPorIdUseCase: ObtenerBusinessUnitPorIdUseCase,
        private readonly obtenerBusinessUnitsHijasUseCase: ObtenerBusinessUnitsHijasUseCase,
        private readonly obtenerArbolBusinessUnitsUseCase: ObtenerArbolBusinessUnitsUseCase,
        private readonly buscarBusinessUnitsUseCase: BuscarBusinessUnitsUseCase,
        private readonly crearOActualizarBusinessUnitsUseCase: CrearOActualizarBusinessUnitsUseCase,
    ) { }

    /**
     * GET - Buscar business units por nombre
     * GET /acc/business-units/:accountId/search
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/search')
    @HttpCode(HttpStatus.OK)
    async buscarBusinessUnits(
        @Param('accountId') accountId: string,
        @Query() dto: BuscarBusinessUnitsDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.buscarBusinessUnitsUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Búsqueda completada exitosamente',
        );
    }

    /**
     * GET - Obtener business units hijas de una business unit padre
     * GET /acc/business-units/:accountId/children
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/children')
    @HttpCode(HttpStatus.OK)
    async obtenerBusinessUnitsHijas(
        @Param('accountId') accountId: string,
        @Query() dto: ObtenerBusinessUnitsHijasDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.obtenerBusinessUnitsHijasUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Business units hijas obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener árbol jerárquico de business units
     * GET /acc/business-units/:accountId/tree
     * IMPORTANTE: Esta ruta debe ir antes de las rutas con parámetros dinámicos
     */
    @Get(':accountId/tree')
    @HttpCode(HttpStatus.OK)
    async obtenerArbolBusinessUnits(
        @Param('accountId') accountId: string,
        @Query() dto: ObtenerBusinessUnitsDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.obtenerArbolBusinessUnitsUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Árbol de business units obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener todas las business units de una cuenta
     * GET /acc/business-units/:accountId
     */
    @Get(':accountId')
    @HttpCode(HttpStatus.OK)
    async obtenerBusinessUnits(
        @Param('accountId') accountId: string,
        @Query() dto: ObtenerBusinessUnitsDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.obtenerBusinessUnitsUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Business units obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener una business unit específica por ID
     * GET /acc/business-units/:accountId/:businessUnitId
     */
    @Get(':accountId/:businessUnitId')
    @HttpCode(HttpStatus.OK)
    async obtenerBusinessUnitPorId(
        @Param('accountId') accountId: string,
        @Param('businessUnitId') businessUnitId: string,
        @Query('region') region?: string,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }
        if (!businessUnitId) {
            throw new BadRequestException('El ID de la business unit es requerido');
        }

        const resultado = await this.obtenerBusinessUnitPorIdUseCase.execute(accountId, businessUnitId, region);
        return ApiResponseDto.success(
            resultado.data,
            'Business unit obtenida exitosamente',
        );
    }

    /**
     * PUT - Crear o actualizar business units (requiere scope account:write)
     * PUT /acc/business-units/:accountId
     */
    @Put(':accountId')
    @HttpCode(HttpStatus.OK)
    async crearOActualizarBusinessUnits(
        @Param('accountId') accountId: string,
        @Body() dto: CrearOActualizarBusinessUnitsDto,
    ) {
        if (!accountId) {
            throw new BadRequestException('El ID de la cuenta es requerido');
        }

        const resultado = await this.crearOActualizarBusinessUnitsUseCase.execute(accountId, dto);
        return ApiResponseDto.success(
            resultado.data,
            'Business units creadas/actualizadas exitosamente',
        );
    }
}

