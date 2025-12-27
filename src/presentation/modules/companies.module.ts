import { Module } from '@nestjs/common';
import { CompaniesController, ProjectsCompaniesController } from '../controllers/companies.controller';
import {
    CrearCompanyUseCase,
    ImportarCompaniesUseCase,
    ObtenerCompaniesUseCase,
    ObtenerCompanyPorIdUseCase,
    BuscarCompaniesUseCase,
    ObtenerCompaniesProyectoUseCase,
    ActualizarCompanyUseCase,
    SubirImagenCompanyUseCase,
} from '../../application/use-cases/acc/companies';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [CompaniesController, ProjectsCompaniesController],
    providers: [
        CrearCompanyUseCase,
        ImportarCompaniesUseCase,
        ObtenerCompaniesUseCase,
        ObtenerCompanyPorIdUseCase,
        BuscarCompaniesUseCase,
        ObtenerCompaniesProyectoUseCase,
        ActualizarCompanyUseCase,
        SubirImagenCompanyUseCase,
        AutodeskApiService,
        HttpClientService,
    ],
})
export class CompaniesModule { }


