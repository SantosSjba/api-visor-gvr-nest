import { Module } from '@nestjs/common';
import { AccAccountUsersController } from '../controllers/acc-account-users.controller';
import {
    CrearUsuarioUseCase,
    ImportarUsuariosUseCase,
    ObtenerUsuariosUseCase,
    ObtenerUsuarioPorIdUseCase,
    BuscarUsuariosUseCase,
    ObtenerProyectosUsuarioUseCase,
    ObtenerProductosUsuarioUseCase,
    ObtenerRolesUsuarioUseCase,
    ActualizarUsuarioUseCase,
} from '../../application/use-cases/acc/account-users';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [AccAccountUsersController],
    providers: [
        CrearUsuarioUseCase,
        ImportarUsuariosUseCase,
        ObtenerUsuariosUseCase,
        ObtenerUsuarioPorIdUseCase,
        BuscarUsuariosUseCase,
        ObtenerProyectosUsuarioUseCase,
        ObtenerProductosUsuarioUseCase,
        ObtenerRolesUsuarioUseCase,
        ActualizarUsuarioUseCase,
        AutodeskApiService,
        HttpClientService,
    ],
})
export class AccAccountUsersModule { }

