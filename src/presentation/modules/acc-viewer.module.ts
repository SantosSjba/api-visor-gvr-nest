import { Module } from '@nestjs/common';
import { AccViewerController } from '../controllers/acc-viewer.controller';

// Use cases
import { GenerarTokenViewerUseCase } from '../../application/use-cases/acc/viewer/generar-token-viewer.use-case';
import { ObtenerTokenPublicoUseCase } from '../../application/use-cases/acc/viewer/obtener-token-publico.use-case';
import { ObtenerManifiestoUseCase } from '../../application/use-cases/acc/viewer/obtener-manifiesto.use-case';
import { ObtenerMetadatosUseCase } from '../../application/use-cases/acc/viewer/obtener-metadatos.use-case';

// Infrastructure
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [AccViewerController],
    providers: [
        // Use cases
        GenerarTokenViewerUseCase,
        ObtenerTokenPublicoUseCase,
        ObtenerManifiestoUseCase,
        ObtenerMetadatosUseCase,
        // Infrastructure
        AutodeskApiService,
        HttpClientService,
    ],
})
export class AccViewerModule { }
