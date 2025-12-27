import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataManagementController } from '../controllers/data-management.controller';
import { ObtenerHubsUseCase } from '../../application/use-cases/data-management/obtener-hubs.use-case';
import { ObtenerProyectosUseCase } from '../../application/use-cases/data-management/obtener-proyectos.use-case';
import { ObtenerProyectoPorIdUseCase } from '../../application/use-cases/data-management/obtener-proyecto-por-id.use-case';
import { ObtenerItemsUseCase } from '../../application/use-cases/data-management/obtener-items.use-case';
import { ObtenerItemPorIdUseCase } from '../../application/use-cases/data-management/obtener-item-por-id.use-case';
import { ObtenerVersionesItemUseCase } from '../../application/use-cases/data-management/obtener-versiones-item.use-case';
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [
        ConfigModule,
        DatabaseModule,
    ],
    controllers: [DataManagementController],
    providers: [
        // Shared Services
        HttpClientService,
        AutodeskApiService,

        // Repository
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },

        // Use Cases
        ObtenerHubsUseCase,
        ObtenerProyectosUseCase,
        ObtenerProyectoPorIdUseCase,
        ObtenerItemsUseCase,
        ObtenerItemPorIdUseCase,
        ObtenerVersionesItemUseCase,
    ],
})
export class DataManagementModule { }
