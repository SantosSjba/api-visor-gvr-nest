import { Module } from '@nestjs/common';
import { Bim360ProjectsController } from '../controllers/bim360-projects.controller';
import {
    CrearProyectoBim360UseCase,
    ObtenerProyectosLegacyUseCase,
    ObtenerProyectosNewUseCase,
    ObtenerProyectoPorIdLegacyUseCase,
    ObtenerProyectoPorIdNewUseCase,
    ActualizarProyectoBim360UseCase,
    ActualizarImagenProyectoBim360UseCase,
    ObtenerIssueContainerIdUseCase,
} from '../../application/use-cases/bim360/projects';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [Bim360ProjectsController],
    providers: [
        CrearProyectoBim360UseCase,
        ObtenerProyectosLegacyUseCase,
        ObtenerProyectosNewUseCase,
        ObtenerProyectoPorIdLegacyUseCase,
        ObtenerProyectoPorIdNewUseCase,
        ActualizarProyectoBim360UseCase,
        ActualizarImagenProyectoBim360UseCase,
        ObtenerIssueContainerIdUseCase,
        AutodeskApiService,
        HttpClientService,
    ],
})
export class Bim360ProjectsModule { }

