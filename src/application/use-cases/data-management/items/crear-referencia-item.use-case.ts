import { Injectable, Inject, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';

@Injectable()
export class CrearReferenciaItemUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(userId: number, projectId: string, itemId: string, refData: any): Promise<any> {
        if (!projectId) {
            throw new BadRequestException('El ID del proyecto es requerido');
        }

        if (!itemId) {
            throw new BadRequestException('El ID del item es requerido');
        }

        if (!refData || Object.keys(refData).length === 0) {
            throw new BadRequestException('Los datos de la referencia son requeridos');
        }

        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        return await this.autodeskApiService.crearReferenciaItem(token.tokenAcceso, projectId, itemId, refData);
    }
}

