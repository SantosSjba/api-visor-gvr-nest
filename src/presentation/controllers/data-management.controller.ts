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
import { ObtenerHubsUseCase } from '../../application/use-cases/data-management/obtener-hubs.use-case';
import { ObtenerProyectosUseCase } from '../../application/use-cases/data-management/obtener-proyectos.use-case';
import { ObtenerProyectoPorIdUseCase } from '../../application/use-cases/data-management/obtener-proyecto-por-id.use-case';
import { ObtenerItemsUseCase } from '../../application/use-cases/data-management/obtener-items.use-case';
import { ObtenerItemPorIdUseCase } from '../../application/use-cases/data-management/obtener-item-por-id.use-case';
import { ObtenerVersionesItemUseCase } from '../../application/use-cases/data-management/obtener-versiones-item.use-case';
import { ObtenerHubsDto } from '../../application/dtos/data-management/obtener-hubs.dto';
import { ObtenerProyectosDto } from '../../application/dtos/data-management/obtener-proyectos.dto';
import { ObtenerItemsDto } from '../../application/dtos/data-management/obtener-items.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

@Controller('data-management')
@UseGuards(JwtAuthGuard)
export class DataManagementController {
    constructor(
        private readonly obtenerHubsUseCase: ObtenerHubsUseCase,
        private readonly obtenerProyectosUseCase: ObtenerProyectosUseCase,
        private readonly obtenerProyectoPorIdUseCase: ObtenerProyectoPorIdUseCase,
        private readonly obtenerItemsUseCase: ObtenerItemsUseCase,
        private readonly obtenerItemPorIdUseCase: ObtenerItemPorIdUseCase,
        private readonly obtenerVersionesItemUseCase: ObtenerVersionesItemUseCase,
    ) { }

    /**
     * Obtener todos los hubs accesibles
     * GET /data-management/hubs
     */
    @Get('hubs')
    @HttpCode(HttpStatus.OK)
    async obtenerHubs(@Req() request: Request, @Query() dto: ObtenerHubsDto) {
        const user = (request as any).user;
        const resultado = await this.obtenerHubsUseCase.execute(user.sub, dto);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Hubs obtenidos exitosamente',
        );
    }

    /**
     * Obtener proyectos de un hub específico
     * GET /data-management/hubs/:hubId/projects
     */
    @Get('hubs/:hubId/projects')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectos(
        @Req() request: Request,
        @Param('hubId') hubId: string,
        @Query() dto: ObtenerProyectosDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerProyectosUseCase.execute(user.sub, hubId, dto);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Proyectos obtenidos exitosamente',
        );
    }

    /**
     * Obtener un proyecto específico
     * GET /data-management/hubs/:hubId/projects/:projectId
     */
    @Get('hubs/:hubId/projects/:projectId')
    @HttpCode(HttpStatus.OK)
    async obtenerProyectoPorId(
        @Req() request: Request,
        @Param('hubId') hubId: string,
        @Param('projectId') projectId: string,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerProyectoPorIdUseCase.execute(user.sub, hubId, projectId);

        return ApiResponseDto.success(
            resultado.data,
            'Proyecto obtenido exitosamente',
        );
    }

    /**
     * Obtener items de un proyecto (carpetas/archivos)
     * GET /data-management/projects/:projectId/items
     */
    @Get('projects/:projectId/items')
    @HttpCode(HttpStatus.OK)
    async obtenerItems(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Query() dto: ObtenerItemsDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerItemsUseCase.execute(user.sub, projectId, dto);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Items obtenidos exitosamente',
        );
    }

    /**
     * Obtener un item específico
     * GET /data-management/projects/:projectId/items/:itemId
     */
    @Get('projects/:projectId/items/:itemId')
    @HttpCode(HttpStatus.OK)
    async obtenerItemPorId(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerItemPorIdUseCase.execute(user.sub, projectId, itemId);

        return ApiResponseDto.success(
            resultado.data,
            'Item obtenido exitosamente',
        );
    }

    /**
     * Obtener versiones de un item
     * GET /data-management/projects/:projectId/items/:itemId/versions
     */
    @Get('projects/:projectId/items/:itemId/versions')
    @HttpCode(HttpStatus.OK)
    async obtenerVersionesItem(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerVersionesItemUseCase.execute(user.sub, projectId, itemId);

        return ApiResponseDto.success(
            { ...resultado, data: resultado.data, links: resultado.links },
            'Versiones obtenidas exitosamente',
        );
    }
}
