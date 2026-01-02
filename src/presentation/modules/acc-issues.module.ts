import { Module } from '@nestjs/common';
import { AccIssuesController } from '../controllers/acc-issues.controller';

// Use Cases
import { ObtenerPerfilUsuarioUseCase } from '../../application/use-cases/acc/issues/obtener-perfil-usuario.use-case';
import { ObtenerTiposIncidenciasUseCase } from '../../application/use-cases/acc/issues/obtener-tipos-incidencias.use-case';
import { ObtenerDefinicionesAtributosUseCase } from '../../application/use-cases/acc/issues/obtener-definiciones-atributos.use-case';
import { ObtenerMapeosAtributosUseCase } from '../../application/use-cases/acc/issues/obtener-mapeos-atributos.use-case';
import { ObtenerCategoriasRaizUseCase } from '../../application/use-cases/acc/issues/obtener-categorias-raiz.use-case';
import { ObtenerIncidenciasPorDocumentoUseCase } from '../../application/use-cases/acc/issues/obtener-incidencias-por-documento.use-case';
import { ObtenerUrlMiniaturaUseCase } from '../../application/use-cases/acc/issues/obtener-url-miniatura.use-case';
import { ObtenerIncidenciasUseCase } from '../../application/use-cases/acc/issues/obtener-incidencias.use-case';
import { CrearIncidenciaUseCase } from '../../application/use-cases/acc/issues/crear-incidencia.use-case';
import { ObtenerIncidenciaPorIdUseCase } from '../../application/use-cases/acc/issues/obtener-incidencia-por-id.use-case';
import { ActualizarIncidenciaUseCase } from '../../application/use-cases/acc/issues/actualizar-incidencia.use-case';
import { ObtenerComentariosUseCase } from '../../application/use-cases/acc/issues/obtener-comentarios.use-case';
import { CrearComentarioUseCase } from '../../application/use-cases/acc/issues/crear-comentario.use-case';
import { CrearAdjuntoUseCase } from '../../application/use-cases/acc/issues/crear-adjunto.use-case';
import { ObtenerAdjuntosUseCase } from '../../application/use-cases/acc/issues/obtener-adjuntos.use-case';
import { EliminarAdjuntoUseCase } from '../../application/use-cases/acc/issues/eliminar-adjunto.use-case';
import ObtenerTokenValidoHelper from '../../application/use-cases/acc/issues/obtener-token-valido.helper';

// Services
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

// Repositories
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { AUDITORIA_REPOSITORY } from '../../domain/repositories/auditoria.repository.interface';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Module({
    controllers: [AccIssuesController],
    providers: [
        // Helper
        ObtenerTokenValidoHelper,

        // Use Cases
        ObtenerPerfilUsuarioUseCase,
        ObtenerTiposIncidenciasUseCase,
        ObtenerDefinicionesAtributosUseCase,
        ObtenerMapeosAtributosUseCase,
        ObtenerCategoriasRaizUseCase,
        ObtenerIncidenciasPorDocumentoUseCase,
        ObtenerUrlMiniaturaUseCase,
        ObtenerIncidenciasUseCase,
        CrearIncidenciaUseCase,
        ObtenerIncidenciaPorIdUseCase,
        ActualizarIncidenciaUseCase,
        ObtenerComentariosUseCase,
        CrearComentarioUseCase,
        CrearAdjuntoUseCase,
        ObtenerAdjuntosUseCase,
        EliminarAdjuntoUseCase,

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
        DatabaseFunctionService,
    ],
})
export class AccIssuesModule { }

