import { Module } from '@nestjs/common';
import { IssuesBim360Controller } from '../controllers/issues-bim360.controller';

// Use Cases
import { ObtenerPerfilUsuarioBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-perfil-usuario.use-case';
import { ObtenerTiposIncidenciasBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-tipos-incidencias.use-case';
import { ObtenerDefinicionesAtributosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-definiciones-atributos.use-case';
import { ObtenerMapeosAtributosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-mapeos-atributos.use-case';
import { ObtenerCategoriasRaizBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-categorias-raiz.use-case';
import { ObtenerIncidenciasPorDocumentoBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-incidencias-por-documento.use-case';
import { ObtenerIncidenciasBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-incidencias.use-case';
import { CrearIncidenciaBim360UseCase } from '../../application/use-cases/issues-bim360/crear-incidencia.use-case';
import { ObtenerIncidenciaPorIdBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-incidencia-por-id.use-case';
import { ActualizarIncidenciaBim360UseCase } from '../../application/use-cases/issues-bim360/actualizar-incidencia.use-case';
import { ObtenerComentariosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-comentarios.use-case';
import { CrearComentarioBim360UseCase } from '../../application/use-cases/issues-bim360/crear-comentario.use-case';
import { ObtenerAdjuntosBim360UseCase } from '../../application/use-cases/issues-bim360/obtener-adjuntos.use-case';
import { CrearAdjuntoBim360UseCase } from '../../application/use-cases/issues-bim360/crear-adjunto.use-case';
import { ActualizarAdjuntoBim360UseCase } from '../../application/use-cases/issues-bim360/actualizar-adjunto.use-case';
import ObtenerTokenValidoHelper from '../../application/use-cases/acc/issues/obtener-token-valido.helper';

// Services
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

// Repositories
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { AUDITORIA_REPOSITORY } from '../../domain/repositories/auditoria.repository.interface';
import { AccRecursosRepository } from '../../infrastructure/repositories/acc-recursos.repository';
import { ACC_RECURSOS_REPOSITORY } from '../../domain/repositories/acc-recursos.repository.interface';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Module({
    controllers: [IssuesBim360Controller],
    providers: [
        // Helper
        ObtenerTokenValidoHelper,

        // Use Cases
        ObtenerPerfilUsuarioBim360UseCase,
        ObtenerTiposIncidenciasBim360UseCase,
        ObtenerDefinicionesAtributosBim360UseCase,
        ObtenerMapeosAtributosBim360UseCase,
        ObtenerCategoriasRaizBim360UseCase,
        ObtenerIncidenciasPorDocumentoBim360UseCase,
        ObtenerIncidenciasBim360UseCase,
        CrearIncidenciaBim360UseCase,
        ObtenerIncidenciaPorIdBim360UseCase,
        ActualizarIncidenciaBim360UseCase,
        ObtenerComentariosBim360UseCase,
        CrearComentarioBim360UseCase,
        ObtenerAdjuntosBim360UseCase,
        CrearAdjuntoBim360UseCase,
        ActualizarAdjuntoBim360UseCase,

        // Services
        AutodeskApiService,
        HttpClientService,

        // Repositories
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },
        {
            provide: AUDITORIA_REPOSITORY,
            useClass: AuditoriaRepository,
        },
        {
            provide: ACC_RECURSOS_REPOSITORY,
            useClass: AccRecursosRepository,
        },
        DatabaseFunctionService,
    ],
})
export class IssuesBim360Module { }


