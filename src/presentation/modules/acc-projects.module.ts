import { Module } from '@nestjs/common';
import { AccProjectsController } from '../controllers/acc-projects.controller';

// Use Cases
import { GetProyectosUseCase } from '../../application/use-cases/acc/projects/get-proyectos.use-case';
import { GetProyectoPorIdUseCase } from '../../application/use-cases/acc/projects/get-proyecto-por-id.use-case';
import { GetPlantillasUseCase } from '../../application/use-cases/acc/projects/get-plantillas.use-case';
import { GetProyectosPorTipoUseCase } from '../../application/use-cases/acc/projects/get-proyectos-por-tipo.use-case';
import { GetProyectosActivosUseCase } from '../../application/use-cases/acc/projects/get-proyectos-activos.use-case';
import { CrearProyectoUseCase } from '../../application/use-cases/acc/projects/crear-proyecto.use-case';
import { ClonarProyectoUseCase } from '../../application/use-cases/acc/projects/clonar-proyecto.use-case';
import { ActualizarProyectoUseCase } from '../../application/use-cases/acc/projects/actualizar-proyecto.use-case';
import { SubirImagenProyectoUseCase } from '../../application/use-cases/acc/projects/subir-imagen-proyecto.use-case';

// Services
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [AccProjectsController],
    providers: [
        // Use Cases
        GetProyectosUseCase,
        GetProyectoPorIdUseCase,
        GetPlantillasUseCase,
        GetProyectosPorTipoUseCase,
        GetProyectosActivosUseCase,
        CrearProyectoUseCase,
        ClonarProyectoUseCase,
        ActualizarProyectoUseCase,
        SubirImagenProyectoUseCase,

        // Services
        AutodeskApiService,
        HttpClientService,
    ],
})
export class AccProjectsModule { }
