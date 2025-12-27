import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GetProyectosDto } from '../../../dtos/acc/projects/get-proyectos.dto';

@Injectable()
export class GetProyectosUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(accountId: string, dto: GetProyectosDto): Promise<any> {
        const options: Record<string, any> = {};

        if (dto.fields) {
            options.fields = dto.fields.split(',').map(f => f.trim());
        }

        if (dto.filter_classification) {
            options['filter[classification]'] = dto.filter_classification;
        }

        if (dto.filter_platform) {
            options['filter[platform]'] = dto.filter_platform;
        }

        if (dto.filter_products) {
            options['filter[products]'] = dto.filter_products;
        }

        if (dto.filter_name) {
            options['filter[name]'] = dto.filter_name;
        }

        if (dto.filter_type) {
            options['filter[type]'] = dto.filter_type;
        }

        if (dto.filter_status) {
            options['filter[status]'] = dto.filter_status;
        }

        if (dto.filter_businessUnitId) {
            options['filter[businessUnitId]'] = dto.filter_businessUnitId;
        }

        if (dto.filter_jobNumber) {
            options['filter[jobNumber]'] = dto.filter_jobNumber;
        }

        if (dto.filter_updatedAt) {
            options['filter[updatedAt]'] = dto.filter_updatedAt;
        }

        if (dto.filterTextMatch) {
            options.filterTextMatch = dto.filterTextMatch;
        }

        if (dto.sort) {
            options.sort = dto.sort;
        }

        options.limit = dto.limit || 20;
        options.offset = dto.offset || 0;

        return await this.autodeskApiService.getAccProjects(
            accountId,
            options,
            dto.token,
        );
    }
}
