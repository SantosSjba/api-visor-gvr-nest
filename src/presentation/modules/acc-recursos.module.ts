import { Module } from '@nestjs/common';
import { AccRecursosController } from '../controllers/acc-recursos.controller';
import {
    GuardarRecursoUseCase,
    ObtenerRecursoUseCase,
    ActualizarRecursoUseCase,
    ObtenerRecursosUsuarioUseCase,
    ObtenerRecursosProyectoUseCase,
    ObtenerRecursosHijosUseCase,
} from '../../application/use-cases/acc-recursos';
import { AccRecursosRepository } from '../../infrastructure/repositories/acc-recursos.repository';
import { ACC_RECURSOS_REPOSITORY } from '../../domain/repositories/acc-recursos.repository.interface';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { AUDITORIA_REPOSITORY } from '../../domain/repositories/auditoria.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [AccRecursosController],
    providers: [
        GuardarRecursoUseCase,
        ObtenerRecursoUseCase,
        ActualizarRecursoUseCase,
        ObtenerRecursosUsuarioUseCase,
        ObtenerRecursosProyectoUseCase,
        ObtenerRecursosHijosUseCase,
        {
            provide: ACC_RECURSOS_REPOSITORY,
            useClass: AccRecursosRepository,
        },
        {
            provide: AUDITORIA_REPOSITORY,
            useClass: AuditoriaRepository,
        },
    ],
})
export class AccRecursosModule { }

