import { Module } from '@nestjs/common';
import { DataManagementBucketsController } from '../controllers/data-management-buckets.controller';
import {
    ObtenerBucketsUseCase,
    ObtenerDetallesBucketUseCase,
    CrearBucketUseCase,
    EliminarBucketUseCase,
} from '../../application/use-cases/data-management/buckets';
import { AutodeskApiService } from '../../infrastructure/services/autodesk-api.service';
import { HttpClientService } from '../../shared/services/http-client.service';
import { AccRepository } from '../../infrastructure/repositories/acc.repository';
import { ACC_REPOSITORY } from '../../domain/repositories/acc.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [DataManagementBucketsController],
    providers: [
        ObtenerBucketsUseCase,
        ObtenerDetallesBucketUseCase,
        CrearBucketUseCase,
        EliminarBucketUseCase,
        AutodeskApiService,
        HttpClientService,
        {
            provide: ACC_REPOSITORY,
            useClass: AccRepository,
        },
    ],
})
export class DataManagementBucketsModule { }

