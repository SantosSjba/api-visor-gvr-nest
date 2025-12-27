import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

// Use cases
import { GenerarTokenViewerUseCase } from '../../application/use-cases/acc/viewer/generar-token-viewer.use-case';
import { ObtenerTokenPublicoUseCase } from '../../application/use-cases/acc/viewer/obtener-token-publico.use-case';
import { ObtenerManifiestoUseCase } from '../../application/use-cases/acc/viewer/obtener-manifiesto.use-case';
import { ObtenerMetadatosUseCase } from '../../application/use-cases/acc/viewer/obtener-metadatos.use-case';

// DTOs
import { GenerarTokenViewerDto } from '../../application/dtos/acc/viewer/generar-token-viewer.dto';
import { ObtenerTokenPublicoDto } from '../../application/dtos/acc/viewer/obtener-token-publico.dto';

@Controller('acc/viewer')
export class AccViewerController {
    constructor(
        private readonly generarTokenViewerUseCase: GenerarTokenViewerUseCase,
        private readonly obtenerTokenPublicoUseCase: ObtenerTokenPublicoUseCase,
        private readonly obtenerManifiestoUseCase: ObtenerManifiestoUseCase,
        private readonly obtenerMetadatosUseCase: ObtenerMetadatosUseCase,
    ) { }

    /**
     * POST - Generar token para el viewer (2-legged con scope viewables:read)
     * POST /acc/viewer/token
     */
    @Post('token')
    @HttpCode(HttpStatus.OK)
    async generarTokenViewer(@Body() dto: GenerarTokenViewerDto) {
        const resultado = await this.generarTokenViewerUseCase.execute(dto);

        return ApiResponseDto.success(
            resultado,
            'Token generado exitosamente',
        );
    }

    /**
     * POST - Token público (con validaciones adicionales de seguridad)
     * POST /acc/viewer/token/public
     */
    @Post('token/public')
    @HttpCode(HttpStatus.OK)
    async obtenerTokenPublico(@Body() dto: ObtenerTokenPublicoDto) {
        const resultado = await this.obtenerTokenPublicoUseCase.execute(dto);

        return ApiResponseDto.success(
            resultado,
            'Token público generado exitosamente',
        );
    }

    /**
     * GET - Obtener manifiesto de un archivo traducido
     * GET /acc/viewer/manifest/:urn
     */
    @Get('manifest/:urn')
    @HttpCode(HttpStatus.OK)
    async obtenerManifiesto(@Param('urn') urn: string) {
        const resultado = await this.obtenerManifiestoUseCase.execute(urn);

        return ApiResponseDto.success(
            resultado.data,
            'Manifiesto obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener metadatos de un modelo
     * GET /acc/viewer/metadata/:urn
     */
    @Get('metadata/:urn')
    @HttpCode(HttpStatus.OK)
    async obtenerMetadatos(@Param('urn') urn: string) {
        const resultado = await this.obtenerMetadatosUseCase.execute(urn);

        return ApiResponseDto.success(
            resultado.data,
            'Metadatos obtenidos exitosamente',
        );
    }
}
