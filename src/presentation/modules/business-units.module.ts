import { Module } from '@nestjs/common';
import { BusinessUnitsController } from '../controllers/business-units.controller';
import {
    ObtenerBusinessUnitsUseCase,
    ObtenerBusinessUnitPorIdUseCase,
    ObtenerBusinessUnitsHijasUseCase,
    ObtenerArbolBusinessUnitsUseCase,
    BuscarBusinessUnitsUseCase,
    CrearOActualizarBusinessUnitsUseCase,
} from '../../application/use-cases/acc/business-units';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';

@Module({
    controllers: [BusinessUnitsController],
    providers: [
        ObtenerBusinessUnitsUseCase,
        ObtenerBusinessUnitPorIdUseCase,
        ObtenerBusinessUnitsHijasUseCase,
        ObtenerArbolBusinessUnitsUseCase,
        BuscarBusinessUnitsUseCase,
        CrearOActualizarBusinessUnitsUseCase,
        AutodeskApiService,
        HttpClientService,
    ],
})
export class BusinessUnitsModule { }


