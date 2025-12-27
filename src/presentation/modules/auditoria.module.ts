import { Module } from '@nestjs/common';
import { AuditoriaController } from '../controllers/auditoria.controller';
import {
    ListarAuditoriasUseCase,
    ObtenerAuditoriaPorIdUseCase,
    ObtenerHistorialEntidadUseCase,
    ObtenerHistorialUsuarioUseCase,
    ObtenerEstadisticasUseCase,
} from '../../application/use-cases/auditoria';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { AUDITORIA_REPOSITORY } from '../../domain/repositories/auditoria.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [AuditoriaController],
    providers: [
        ListarAuditoriasUseCase,
        ObtenerAuditoriaPorIdUseCase,
        ObtenerHistorialEntidadUseCase,
        ObtenerHistorialUsuarioUseCase,
        ObtenerEstadisticasUseCase,
        {
            provide: AUDITORIA_REPOSITORY,
            useClass: AuditoriaRepository,
        },
    ],
})
export class AuditoriaModule { }

