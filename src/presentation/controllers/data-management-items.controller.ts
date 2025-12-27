import {
    Controller,
    Get,
    Query,
    Param,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

// Use cases - Grupo 1
import { ObtenerItemPorIdUseCase } from '../../application/use-cases/data-management/items/obtener-item-por-id.use-case';
import { DescargarItemUseCase } from '../../application/use-cases/data-management/items/descargar-item.use-case';
import { ObtenerItemPadreUseCase } from '../../application/use-cases/data-management/items/obtener-item-padre.use-case';
import { ObtenerReferenciasItemUseCase } from '../../application/use-cases/data-management/items/obtener-referencias-item.use-case';
import { ObtenerRelacionesLinksItemUseCase } from '../../application/use-cases/data-management/items/obtener-relaciones-links-item.use-case';

// Use cases - Grupo 2
import { ObtenerRelacionesRefsItemUseCase } from '../../application/use-cases/data-management/items/obtener-relaciones-refs-item.use-case';
import { ObtenerTipVersionUseCase } from '../../application/use-cases/data-management/items/obtener-tip-version.use-case';
import { ObtenerVersionesUseCase } from '../../application/use-cases/data-management/items/obtener-versiones.use-case';

@Controller('data-management/items')
@UseGuards(JwtAuthGuard)
export class DataManagementItemsController {
    constructor(
        // Grupo 1
        private readonly obtenerItemPorIdUseCase: ObtenerItemPorIdUseCase,
        private readonly descargarItemUseCase: DescargarItemUseCase,
        private readonly obtenerItemPadreUseCase: ObtenerItemPadreUseCase,
        private readonly obtenerReferenciasItemUseCase: ObtenerReferenciasItemUseCase,
        private readonly obtenerRelacionesLinksItemUseCase: ObtenerRelacionesLinksItemUseCase,
        // Grupo 2
        private readonly obtenerRelacionesRefsItemUseCase: ObtenerRelacionesRefsItemUseCase,
        private readonly obtenerTipVersionUseCase: ObtenerTipVersionUseCase,
        private readonly obtenerVersionesUseCase: ObtenerVersionesUseCase,
    ) { }

    /**
     * GET - Obtener un item específico por ID
     * GET /data-management/items/:projectId/:itemId
     */
    @Get(':projectId/:itemId')
    @HttpCode(HttpStatus.OK)
    async obtenerItemPorId(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerItemPorIdUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            resultado.data,
            'Item obtenido exitosamente',
        );
    }

    /**
     * GET - Descargar un item (archivo)
     * GET /data-management/items/:projectId/:itemId/download
     */
    @Get(':projectId/:itemId/download')
    @HttpCode(HttpStatus.OK)
    async descargarItem(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.descargarItemUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            resultado.data,
            'URL de descarga obtenida exitosamente',
        );
    }

    /**
     * GET - Obtener el padre de un item
     * GET /data-management/items/:projectId/:itemId/parent
     */
    @Get(':projectId/:itemId/parent')
    @HttpCode(HttpStatus.OK)
    async obtenerItemPadre(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerItemPadreUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            resultado.data,
            'Item padre obtenido exitosamente',
        );
    }

    /**
     * GET - Obtener las referencias (refs) de un item
     * GET /data-management/items/:projectId/:itemId/refs
     */
    @Get(':projectId/:itemId/refs')
    @HttpCode(HttpStatus.OK)
    async obtenerReferencias(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerReferenciasItemUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Referencias obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener las relaciones de links de un item
     * GET /data-management/items/:projectId/:itemId/relationships/links
     */
    @Get(':projectId/:itemId/relationships/links')
    @HttpCode(HttpStatus.OK)
    async obtenerRelacionesLinks(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerRelacionesLinksItemUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            resultado.data,
            'Relaciones de links obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener las relaciones de refs de un item
     * GET /data-management/items/:projectId/:itemId/relationships/refs
     */
    @Get(':projectId/:itemId/relationships/refs')
    @HttpCode(HttpStatus.OK)
    async obtenerRelacionesRefs(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerRelacionesRefsItemUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            resultado.data,
            'Relaciones de refs obtenidas exitosamente',
        );
    }

    /**
     * GET - Obtener la versión tip (más reciente) de un item
     * GET /data-management/items/:projectId/:itemId/tip
     */
    @Get(':projectId/:itemId/tip')
    @HttpCode(HttpStatus.OK)
    async obtenerTipVersion(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerTipVersionUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            resultado.data,
            'Versión tip obtenida exitosamente',
        );
    }

    /**
     * GET - Obtener las versiones de un item
     * GET /data-management/items/:projectId/:itemId/versions
     */
    @Get(':projectId/:itemId/versions')
    @HttpCode(HttpStatus.OK)
    async obtenerVersiones(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Query() queryParams: any,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerVersionesUseCase.execute(user.sub, projectId, itemId, queryParams);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Versiones obtenidas exitosamente',
        );
    }
}
