import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { CrearBucketDto } from '../../../dtos/data-management/buckets/crear-bucket.dto';

@Injectable()
export class CrearBucketUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(userId: number, dto: CrearBucketDto): Promise<any> {
        if (!dto.bucketKey) {
            throw new BadRequestException('El bucket key es requerido');
        }

        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        return await this.autodeskApiService.crearBucket(
            token.tokenAcceso,
            dto.bucketKey,
            dto.policyKey || 'transient',
            dto.region,
        );
    }
}

