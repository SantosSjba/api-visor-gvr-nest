import { Module } from '@nestjs/common';
import { DataManagementFoldersController } from '../controllers/data-management-folders.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';

// Use cases - Group 1
import { ObtenerCarpetaPorIdUseCase } from '../../application/use-cases/data-management/folders/obtener-carpeta-por-id.use-case';
import { ObtenerContenidoCarpetaUseCase } from '../../application/use-cases/data-management/folders/obtener-contenido-carpeta.use-case';
import { BuscarEnContenidoCarpetaUseCase } from '../../application/use-cases/data-management/folders/buscar-en-contenido-carpeta.use-case';
import { ObtenerCarpetaPadreUseCase } from '../../application/use-cases/data-management/folders/obtener-carpeta-padre.use-case';
import { ObtenerReferenciasUseCase } from '../../application/use-cases/data-management/folders/obtener-referencias.use-case';

// Use cases - Group 2
import { ObtenerRelacionesLinksUseCase } from '../../application/use-cases/data-management/folders/obtener-relaciones-links.use-case';
import { ObtenerRelacionesRefsUseCase } from '../../application/use-cases/data-management/folders/obtener-relaciones-refs.use-case';
import { BuscarEnCarpetaUseCase } from '../../application/use-cases/data-management/folders/buscar-en-carpeta.use-case';

// Use cases - Group 3
import { CrearCarpetaUseCase } from '../../application/use-cases/data-management/folders/crear-carpeta.use-case';
import { CrearSubcarpetaUseCase } from '../../application/use-cases/data-management/folders/crear-subcarpeta.use-case';
import { CrearReferenciaCarpetaUseCase } from '../../application/use-cases/data-management/folders/crear-referencia-carpeta.use-case';
import { ActualizarCarpetaUseCase } from '../../application/use-cases/data-management/folders/actualizar-carpeta.use-case';
import { EliminarCarpetaUseCase } from '../../application/use-cases/data-management/folders/eliminar-carpeta.use-case';

// Infrastructure
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';

@Module({
    imports: [DatabaseModule],
    controllers: [DataManagementFoldersController],
    providers: [
        // Group 1
        ObtenerCarpetaPorIdUseCase,
        ObtenerContenidoCarpetaUseCase,
        BuscarEnContenidoCarpetaUseCase,
        ObtenerCarpetaPadreUseCase,
        ObtenerReferenciasUseCase,
        // Group 2
        ObtenerRelacionesLinksUseCase,
        ObtenerRelacionesRefsUseCase,
        BuscarEnCarpetaUseCase,
        // Group 3
        CrearCarpetaUseCase,
        CrearSubcarpetaUseCase,
        CrearReferenciaCarpetaUseCase,
        ActualizarCarpetaUseCase,
        EliminarCarpetaUseCase,
        // Infrastructure
        AutodeskApiService,
        HttpClientService,
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },
    ],
})
export class DataManagementFoldersModule { }
