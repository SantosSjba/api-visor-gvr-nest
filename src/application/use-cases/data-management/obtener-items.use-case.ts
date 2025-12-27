import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../domain/repositories/acc.repository.interface';
import { ObtenerItemsDto } from '../../dtos/data-management/obtener-items.dto';

@Injectable()
export class ObtenerItemsUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(userId: number, projectId: string, dto: ObtenerItemsDto): Promise<any> {
        if (!projectId) {
            throw new Error('El ID del proyecto es requerido');
        }

        // Obtener token del usuario
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        // Validar que el token no esté expirado
        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        // Obtener items
        return await this.autodeskApiService.obtenerItems(token.tokenAcceso, projectId, dto.folder_id);
    }
}
