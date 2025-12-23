import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccController } from '../controllers/acc.controller';
import { ObtenerToken2LeggedUseCase } from '../../application/use-cases/acc/obtener-token-2legged.use-case';
import { GenerarUrlAutorizacionUseCase } from '../../application/use-cases/acc/generar-url-autorizacion.use-case';
import { ObtenerMiTokenUseCase } from '../../application/use-cases/acc/obtener-mi-token.use-case';
import { CallbackAutorizacionUseCase } from '../../application/use-cases/acc/callback-autorizacion.use-case';
import { RefrescarToken3LeggedUseCase } from '../../application/use-cases/acc/refrescar-token-3legged.use-case';
import { RevocarTokenUseCase } from '../../application/use-cases/acc/revocar-token.use-case';
import { ValidarExpiracionUseCase } from '../../application/use-cases/acc/validar-expiracion.use-case';
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
    controllers: [AccController],
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
        ObtenerToken2LeggedUseCase,
        GenerarUrlAutorizacionUseCase,
        ObtenerMiTokenUseCase,
        CallbackAutorizacionUseCase,
        RefrescarToken3LeggedUseCase,
        RevocarTokenUseCase,
        ValidarExpiracionUseCase,
    ],
    exports: [ACC_REPOSITORY, AutodeskApiService],
})
export class AccModule { }
