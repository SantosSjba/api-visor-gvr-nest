import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GetProyectosActivosDto } from '../../../dtos/acc/projects/get-proyectos-activos.dto';

@Injectable()
export class GetProyectosActivosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: GetProyectosActivosDto): Promise<any> {
        const options: Record<string, any> = {};

        if (dto.fields) {
            options.fields = dto.fields.split(',').map(f => f.trim());
        }

        if (dto.filter_type) {
            options['filter[type]'] = dto.filter_type;
        }

        if (dto.filter_name) {
            options['filter[name]'] = dto.filter_name;
        }

        if (dto.sort) {
            options.sort = dto.sort;
        }

        options.limit = dto.limit || 20;
        options.offset = dto.offset || 0;

        // Force status to active
        options['filter[status]'] = 'active';

        return await this.autodeskApiService.getAccProjects(
            accountId,
            options,
            dto.token,
        );
    }
}
