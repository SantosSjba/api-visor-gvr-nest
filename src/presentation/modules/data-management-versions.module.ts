import { Module } from '@nestjs/common';
import { DataManagementVersionsController } from '../controllers/data-management-versions.controller';
import {
    ObtenerVersionPorIdUseCase,
    ObtenerFormatosDescargaUseCase,
    ObtenerDescargasUseCase,
    ObtenerItemUseCase,
    ObtenerReferenciasUseCase,
    ObtenerRelacionesLinksUseCase,
    ObtenerRelacionesRefsUseCase,
    CrearVersionUseCase,
    CrearReferenciaUseCase,
    ActualizarVersionUseCase,
} from '../../application/use-cases/data-management/versions';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Module({
    controllers: [DataManagementVersionsController],
    providers: [
        ObtenerVersionPorIdUseCase,
        ObtenerFormatosDescargaUseCase,
        ObtenerDescargasUseCase,
        ObtenerItemUseCase,
        ObtenerReferenciasUseCase,
        ObtenerRelacionesLinksUseCase,
        ObtenerRelacionesRefsUseCase,
        CrearVersionUseCase,
        CrearReferenciaUseCase,
        ActualizarVersionUseCase,
        AutodeskApiService,
        HttpClientService,
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },
        DatabaseFunctionService,
    ],
})
export class DataManagementVersionsModule { }


