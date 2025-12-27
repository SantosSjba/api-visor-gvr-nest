import { Module } from '@nestjs/common';
import { AccProjectUsersController } from '../controllers/acc-project-users.controller';
import {
    ObtenerUsuariosProyectoUseCase,
    ObtenerUsuarioProyectoPorIdUseCase,
    BuscarUsuariosProyectoUseCase,
    AgregarUsuarioProyectoUseCase,
    ImportarUsuariosProyectoUseCase,
    ActualizarUsuarioProyectoUseCase,
    EliminarUsuarioProyectoUseCase,
} from '../../application/use-cases/acc/project-users';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [AccProjectUsersController],
    providers: [
        ObtenerUsuariosProyectoUseCase,
        ObtenerUsuarioProyectoPorIdUseCase,
        BuscarUsuariosProyectoUseCase,
        AgregarUsuarioProyectoUseCase,
        ImportarUsuariosProyectoUseCase,
        ActualizarUsuarioProyectoUseCase,
        EliminarUsuarioProyectoUseCase,
        AutodeskApiService,
        HttpClientService,
    ],
})
export class AccProjectUsersModule { }


