import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GetProyectoPorIdDto } from '../../../dtos/acc/projects/get-proyecto-por-id.dto';

@Injectable()
export class GetProyectoPorIdUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(projectId: string, dto: GetProyectoPorIdDto): Promise<any> {
        const fields = dto.fields ? dto.fields.split(',').map(f => f.trim()) : [];

        return await this.autodeskApiService.getAccProjectById(
            projectId,
            fields,
            dto.token,
        );
    }
}
