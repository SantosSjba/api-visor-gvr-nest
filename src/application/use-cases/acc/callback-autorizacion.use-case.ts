import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IAccRepository } from '../../../domain/repositories/acc.repository.interface';
import { ACC_REPOSITORY } from '../../../domain/repositories/acc.repository.interface';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { CallbackAutorizacionDto } from '../../dtos/acc/callback-autorizacion.dto';

export interface CallbackAutorizacionResponse {
    token_id: number;
    access_token: string;
    expires_at: Date;
    token_type: string;
}

@Injectable()
export class CallbackAutorizacionUseCase {
    constructor(
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AutodeskApiService)
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(dto: CallbackAutorizacionDto, idUsuario: number): Promise<CallbackAutorizacionResponse> {
        if (dto.error) {
            throw new BadRequestException(`Error en autorización: ${dto.error_description || dto.error}`);
        }

        if (!dto.code) {
            throw new BadRequestException('No se recibió el código de autorización');
        }

        // Note: State validation is skipped here as we don't have server-side session persistence.
        // In a stateless architecture, the client should validate the state before making the callback request
        // or we would need a distributed cache (Redis) to store states.

        // Exchange code for token
        const tokenData = await this.autodeskApiService.intercambiarCodigoPorToken(dto.code);

        // Save token in database
        const tokenGuardado = await this.accRepository.guardarToken3Legged(
            idUsuario,
            tokenData.access_token,
            tokenData.refresh_token || null,
            tokenData.expires_at,
            tokenData.token_type,
        );

        return {
            token_id: tokenGuardado.id!,
            access_token: tokenGuardado.tokenAcceso,
            expires_at: tokenGuardado.expiraEn,
            token_type: tokenGuardado.tipoToken,
        };
    }
}
