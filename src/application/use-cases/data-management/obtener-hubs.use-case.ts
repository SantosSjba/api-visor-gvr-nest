import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../domain/repositories/acc.repository.interface';
import { ObtenerHubsDto } from '../../dtos/data-management/obtener-hubs.dto';

@Injectable()
export class ObtenerHubsUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(userId: number, dto: ObtenerHubsDto): Promise<any> {
        // Obtener token del usuario
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        // Validar que el token no esté expirado
        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        // Obtener hubs
        return await this.autodeskApiService.obtenerHubs(token.tokenAcceso, dto.filters || {});
    }
}
