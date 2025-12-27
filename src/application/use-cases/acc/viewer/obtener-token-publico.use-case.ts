import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ObtenerTokenPublicoDto } from '../../../dtos/acc/viewer/obtener-token-publico.dto';

@Injectable()
export class ObtenerTokenPublicoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(dto: ObtenerTokenPublicoDto): Promise<any> {
        // Token público con scope viewables:read
        return await this.autodeskApiService.obtenerToken2Legged(['viewables:read']);
    }
}
