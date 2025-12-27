import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';

@Injectable()
export class ObtenerManifiestoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
    ) { }

    async execute(urn: string): Promise<any> {
        return await this.autodeskApiService.obtenerManifiesto(urn);
    }
}
