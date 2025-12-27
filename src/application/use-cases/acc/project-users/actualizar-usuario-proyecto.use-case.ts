import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ActualizarUsuarioProyectoDto } from '../../../dtos/acc/project-users/actualizar-usuario-proyecto.dto';

@Injectable()
export class ActualizarUsuarioProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(projectId: string, projectUserId: string, dto: ActualizarUsuarioProyectoDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        const userData: Record<string, any> = {};
        if (dto.companyId !== undefined) userData.companyId = dto.companyId;
        if (dto.roleIds !== undefined) userData.roleIds = dto.roleIds;
        if (dto.products !== undefined) userData.products = dto.products;

        if (Object.keys(userData).length === 0) {
            throw new BadRequestException('Debe proporcionar al menos un campo para actualizar');
        }

        return await this.autodeskApiService.actualizarUsuarioProyecto(
            token.access_token,
            projectId,
            projectUserId,
            userData,
            dto.region,
            dto.user_id,
        );
    }
}

