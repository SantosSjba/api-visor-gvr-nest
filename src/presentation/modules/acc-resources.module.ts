import { Module } from '@nestjs/common';
import { AccResourcesController } from '../controllers/acc-resources.controller';
import {
    ListarRecursosUseCase,
    ObtenerRecursoPorIdUseCase,
    CrearRecursoUseCase,
    ActualizarRecursoUseCase,
    EliminarRecursoUseCase,
    ListarPermisosRolUseCase,
    ListarRolesRecursoUseCase,
    AsignarPermisoUseCase,
    RemoverPermisoUseCase,
    SincronizarPermisosRolUseCase,
    ListarPermisosUsuarioUseCase,
    ListarUsuariosRecursoUseCase,
    ListarUsuariosDisponiblesRecursoUseCase,
    AsignarPermisoUsuarioUseCase,
    ActualizarNivelPermisoUsuarioUseCase,
    RemoverPermisoUsuarioUseCase,
    SincronizarPermisosUsuarioUseCase,
    ListarNivelesPermisoUseCase,
} from '../../application/use-cases/acc/resources';
import { AccResourcesRepository } from '../../infrastructure/repositories/acc-resources.repository';
import { ACC_RESOURCES_REPOSITORY } from '../../domain/repositories/acc-resources.repository.interface';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Module({
    controllers: [AccResourcesController],
    providers: [
        // Use Cases
        ListarRecursosUseCase,
        ObtenerRecursoPorIdUseCase,
        CrearRecursoUseCase,
        ActualizarRecursoUseCase,
        EliminarRecursoUseCase,
        ListarPermisosRolUseCase,
        ListarRolesRecursoUseCase,
        AsignarPermisoUseCase,
        RemoverPermisoUseCase,
        SincronizarPermisosRolUseCase,
        ListarPermisosUsuarioUseCase,
        ListarUsuariosRecursoUseCase,
        ListarUsuariosDisponiblesRecursoUseCase,
        AsignarPermisoUsuarioUseCase,
        ActualizarNivelPermisoUsuarioUseCase,
        RemoverPermisoUsuarioUseCase,
        SincronizarPermisosUsuarioUseCase,
        ListarNivelesPermisoUseCase,

        // Repository
        {
            provide: ACC_RESOURCES_REPOSITORY,
            useClass: AccResourcesRepository,
        },

        // Services
        DatabaseFunctionService,
    ],
})
export class AccResourcesModule { }

