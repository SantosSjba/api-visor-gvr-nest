import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Query,
    Param,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { RequestInfoHelper } from '../../shared/helpers/request-info.helper';

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
import { ObtenerActividadesArchivoUseCase } from '../../application/use-cases/data-management/items/obtener-actividades-archivo.use-case';
import { SubirArchivoUseCase } from '../../application/use-cases/data-management/items/subir-archivo.use-case';
import { CrearItemUseCase } from '../../application/use-cases/data-management/items/crear-item.use-case';
import { CrearReferenciaItemUseCase } from '../../application/use-cases/data-management/items/crear-referencia-item.use-case';
import { ActualizarItemUseCase } from '../../application/use-cases/data-management/items/actualizar-item.use-case';
import { EliminarItemUseCase } from '../../application/use-cases/data-management/items/eliminar-item.use-case';

// DTOs
import { SubirArchivoDto } from '../../application/dtos/data-management/items/subir-archivo.dto';
import { CrearItemDto } from '../../application/dtos/data-management/items/crear-item.dto';
import { CrearReferenciaItemDto } from '../../application/dtos/data-management/items/crear-referencia-item.dto';
import { ActualizarItemDto } from '../../application/dtos/data-management/items/actualizar-item.dto';

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
        private readonly obtenerActividadesArchivoUseCase: ObtenerActividadesArchivoUseCase,
        // Upload
        private readonly subirArchivoUseCase: SubirArchivoUseCase,
        // Create/Update/Delete
        private readonly crearItemUseCase: CrearItemUseCase,
        private readonly crearReferenciaItemUseCase: CrearReferenciaItemUseCase,
        private readonly actualizarItemUseCase: ActualizarItemUseCase,
        private readonly eliminarItemUseCase: EliminarItemUseCase,
    ) { }

    /**
     * POST - Subir archivo completo a una carpeta específica
     * POST /data-management/items/:projectId/upload
     * IMPORTANTE: Esta ruta debe estar ANTES de otras rutas POST con {projectId}
     */
    @Post(':projectId/upload')
    @UseInterceptors(FileInterceptor('file'))
    @HttpCode(HttpStatus.CREATED)
    async subirArchivo(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: SubirArchivoDto,
    ) {
        const user = (request as any).user;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;
        const resultado = await this.subirArchivoUseCase.execute(
            user.sub,
            projectId,
            dto.folderId,
            file,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            {
                storage: resultado.storage,
                item: resultado.item,
                included: resultado.included,
            },
            'Archivo subido exitosamente',
        );
    }

    /**
     * POST - Crear un nuevo item (primera versión de un archivo) - Método manual avanzado
     * POST /data-management/items/:projectId
     * IMPORTANTE: Esta ruta debe estar DESPUÉS de /upload
     */
    @Post(':projectId')
    @HttpCode(HttpStatus.CREATED)
    async crearItem(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Body() dto: CrearItemDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.crearItemUseCase.execute(user.sub, projectId, dto);

        return ApiResponseDto.success(
            {
                item: resultado.data,
                included: resultado.included || [],
            },
            'Item creado exitosamente',
        );
    }

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
        @Res() res: Response,
    ) {
        const user = (request as any).user;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;
        const resultado = await this.descargarItemUseCase.execute(
            user.sub,
            projectId,
            itemId,
            queryParams,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${resultado.fileName}"`,
            'Content-Length': resultado.data.length,
        });

        res.send(resultado.data);
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

    /**
     * GET - Obtener las actividades de un archivo
     * GET /data-management/items/:projectId/:itemId/activities
     */
    @Get(':projectId/:itemId/activities')
    @HttpCode(HttpStatus.OK)
    async obtenerActividadesArchivo(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
    ) {
        const user = (request as any).user;
        const resultado = await this.obtenerActividadesArchivoUseCase.execute(user.sub, projectId, itemId);

        return ApiResponseDto.success(
            resultado,
            'Actividades del archivo obtenidas exitosamente',
        );
    }

    /**
     * POST - Crear una referencia en un item
     * POST /data-management/items/:projectId/:itemId/relationships/refs
     */
    @Post(':projectId/:itemId/relationships/refs')
    @HttpCode(HttpStatus.CREATED)
    async crearReferencia(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Body() dto: CrearReferenciaItemDto,
    ) {
        const user = (request as any).user;
        const resultado = await this.crearReferenciaItemUseCase.execute(user.sub, projectId, itemId, dto.data);

        return ApiResponseDto.success(
            resultado.data,
            'Referencia creada exitosamente',
        );
    }

    /**
     * PATCH - Actualizar un item
     * PATCH /data-management/items/:projectId/:itemId
     */
    @Patch(':projectId/:itemId')
    @HttpCode(HttpStatus.OK)
    async actualizarItem(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
        @Body() dto: ActualizarItemDto,
    ) {
        const user = (request as any).user;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;
        const resultado = await this.actualizarItemUseCase.execute(
            user.sub,
            projectId,
            itemId,
            dto,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        return ApiResponseDto.success(
            resultado.data,
            'Item actualizado exitosamente',
        );
    }

    /**
     * DELETE - Eliminar un item (marcar como oculto/mover a papelera)
     * DELETE /data-management/items/:projectId/:itemId
     */
    @Delete(':projectId/:itemId')
    @HttpCode(HttpStatus.OK)
    async eliminarItem(
        @Req() request: Request,
        @Param('projectId') projectId: string,
        @Param('itemId') itemId: string,
    ) {
        const user = (request as any).user;
        const requestInfo = RequestInfoHelper.extract(request);
        const userRole = user?.roles && Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles[0]?.nombre || user.roles[0]?.name || null
            : null;
        const resultado = await this.eliminarItemUseCase.execute(
            user.sub,
            projectId,
            itemId,
            requestInfo.ipAddress,
            requestInfo.userAgent,
            userRole,
        );

        const message = resultado.message
            || (resultado.wasAlreadyDeleted
                ? 'El item ya estaba marcado como eliminado'
                : 'Item marcado como eliminado creando versión Deleted');

        return ApiResponseDto.success(
            {
                deletedVersion: resultado.data || null,
                deletedAt: resultado.deletedAt || null,
                wasAlreadyDeleted: resultado.wasAlreadyDeleted || false,
            },
            message,
        );
    }
}
