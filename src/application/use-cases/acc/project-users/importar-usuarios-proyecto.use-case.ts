import { Injectable, BadRequestException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ImportarUsuariosProyectoDto } from '../../../dtos/acc/project-users/importar-usuarios-proyecto.dto';

@Injectable()
export class ImportarUsuariosProyectoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(projectId: string, dto: ImportarUsuariosProyectoDto): Promise<any> {
        const token = await this.autodeskApiService.obtenerToken2Legged(['account:write']);

        if (this.autodeskApiService.esTokenExpirado(token.expires_at)) {
            throw new BadRequestException('El token ha expirado. Por favor, genera un nuevo token.');
        }

        return await this.autodeskApiService.importarUsuariosProyecto(
            token.access_token,
            projectId,
            dto.users,
            dto.region,
            dto.user_id,
        );
    }
}

