import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerProyectosUsuarioDto } from '../../../dtos/acc/account-users/obtener-proyectos-usuario.dto';

@Injectable()
export class ObtenerProyectosUsuarioUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, userId: string, dto: ObtenerProyectosUsuarioDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:read']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const filters: Record<string, any> = {};
        if (dto.limit) filters.limit = dto.limit.toString();
        if (dto.offset) filters.offset = dto.offset.toString();

        return await this.autodeskApiService.obtenerProyectosUsuario(token.access_token, accountId, userId, filters, dto.region);
    }
}


