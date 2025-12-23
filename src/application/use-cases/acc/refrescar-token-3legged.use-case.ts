import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IAccRepository } from '../../../domain/repositories/acc.repository.interface';
import { ACC_REPOSITORY } from '../../../domain/repositories/acc.repository.interface';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';

export interface RefrescarToken3LeggedResponse {
    access_token: string;
    expires_at: Date;
    token_type: string;
}

@Injectable()
export class RefrescarToken3LeggedUseCase {
    constructor(
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AutodeskApiService)
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(idUsuario: number): Promise<RefrescarToken3LeggedResponse> {
        // Get user's current token
        const tokenActual = await this.accRepository.obtenerToken3LeggedPorUsuario(idUsuario);

        if (!tokenActual) {
            throw new NotFoundException('No se encontró token activo para este usuario');
        }

        if (!tokenActual.tokenRefresco) {
            throw new BadRequestException('No hay refresh token disponible');
        }

        // Refresh the token
        const nuevoToken = await this.autodeskApiService.refrescarToken(tokenActual.tokenRefresco);

        // Update token in database
        const tokenActualizado = await this.accRepository.actualizarToken3Legged(
            tokenActual.id!,
            nuevoToken.access_token,
            nuevoToken.refresh_token || tokenActual.tokenRefresco,
            nuevoToken.expires_at,
        );

        return {
            access_token: tokenActualizado.tokenAcceso,
            expires_at: tokenActualizado.expiraEn,
            token_type: tokenActualizado.tipoToken,
        };
    }
}
