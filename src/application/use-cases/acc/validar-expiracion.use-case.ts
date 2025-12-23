import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ValidarExpiracionDto } from '../../dtos/acc/validar-expiracion.dto';

export interface ValidarExpiracionResponse {
    expirado: boolean;
}

@Injectable()
export class ValidarExpiracionUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(dto: ValidarExpiracionDto): Promise<ValidarExpiracionResponse> {
        const esExpirado = this.autodeskApiService.esTokenExpirado(dto.expires_at);

        return {
            expirado: esExpirado,
        };
    }
}
