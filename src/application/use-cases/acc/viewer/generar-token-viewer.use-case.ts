import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { GenerarTokenViewerDto } from '../../../dtos/acc/viewer/generar-token-viewer.dto';

@Injectable()
export class GenerarTokenViewerUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(dto: GenerarTokenViewerDto): Promise<any> {
        const scope = dto.scope || 'viewables:read';
        return await this.autodeskApiService.obtenerToken2Legged([scope]);
    }
}
