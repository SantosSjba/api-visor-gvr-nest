import { Module } from '@nestjs/common';
import { DataManagementItemsController } from '../controllers/data-management-items.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';

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
import { DesplazarItemUseCase } from '../../application/use-cases/data-management/items/desplazar-item.use-case';

// Infrastructure
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { AUDITORIA_REPOSITORY } from '../../domain/repositories/auditoria.repository.interface';

@Module({
    imports: [DatabaseModule],
    controllers: [DataManagementItemsController],
    providers: [
        // Use cases - Grupo 1
        ObtenerItemPorIdUseCase,
        DescargarItemUseCase,
        ObtenerItemPadreUseCase,
        ObtenerReferenciasItemUseCase,
        ObtenerRelacionesLinksItemUseCase,
        // Use cases - Grupo 2
        ObtenerRelacionesRefsItemUseCase,
        ObtenerTipVersionUseCase,
        ObtenerVersionesUseCase,
        ObtenerActividadesArchivoUseCase,
        // Upload
        SubirArchivoUseCase,
        // Create/Update/Delete
        CrearItemUseCase,
        CrearReferenciaItemUseCase,
        ActualizarItemUseCase,
        EliminarItemUseCase,
        DesplazarItemUseCase,
        // Infrastructure
        AutodeskApiService,
        HttpClientService,
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },
        {
            provide: AUDITORIA_REPOSITORY,
            useClass: AuditoriaRepository,
        },
    ],
})
export class DataManagementItemsModule { }
