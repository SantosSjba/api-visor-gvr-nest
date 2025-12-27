import { Module } from '@nestjs/common';
import { DataManagementProjectsController } from '../controllers/data-management-projects.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';

// Use cases
import { ObtenerProyectosHubUseCase } from '../../application/use-cases/data-management/projects/obtener-proyectos-hub.use-case';
import { ObtenerProyectoHubPorIdUseCase } from '../../application/use-cases/data-management/projects/obtener-proyecto-hub-por-id.use-case';
import { ObtenerHubDeProyectoUseCase } from '../../application/use-cases/data-management/projects/obtener-hub-de-proyecto.use-case';
import { ObtenerCarpetasPrincipalesUseCase } from '../../application/use-cases/data-management/projects/obtener-carpetas-principales.use-case';
import { CrearStorageUseCase } from '../../application/use-cases/data-management/projects/crear-storage.use-case';
import { CrearDescargaUseCase } from '../../application/use-cases/data-management/projects/crear-descarga.use-case';
import { ObtenerEstadoDescargaUseCase } from '../../application/use-cases/data-management/projects/obtener-estado-descarga.use-case';
import { ObtenerEstadoJobUseCase } from '../../application/use-cases/data-management/projects/obtener-estado-job.use-case';

// Infrastructure
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';

@Module({
    imports: [DatabaseModule],
    controllers: [DataManagementProjectsController],
    providers: [
        // Use cases
        ObtenerProyectosHubUseCase,
        ObtenerProyectoHubPorIdUseCase,
        ObtenerHubDeProyectoUseCase,
        ObtenerCarpetasPrincipalesUseCase,
        CrearStorageUseCase,
        CrearDescargaUseCase,
        ObtenerEstadoDescargaUseCase,
        ObtenerEstadoJobUseCase,
        // Infrastructure
        AutodeskApiService,
        HttpClientService,
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },
    ],
})
export class DataManagementProjectsModule { }
