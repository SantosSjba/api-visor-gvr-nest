import { Injectable } from '@nestjs/common';
import { ExportarIncidenciasDto, FormatoExportacion } from '../../../dtos/acc/issues/exportar-incidencias.dto';
import { ExportacionIncidenciasService } from '../../../../infrastructure/services/exportacion-incidencias.service';

@Injectable()
export class ExportarIncidenciasUseCase {
    constructor(
        private readonly exportacionIncidenciasService: ExportacionIncidenciasService,
    ) { }

    async execute(userId: number, projectId: string, dto: ExportarIncidenciasDto): Promise<any> {
        let data: Buffer;
        let contentType: string;
        let filename: string;

        if (dto.formato === FormatoExportacion.PDF) {
            data = await this.exportacionIncidenciasService.exportarPDF(userId, projectId, dto);
            contentType = 'application/pdf';
            filename = `${dto.titulo || 'reporte'}_${Date.now()}.pdf`;
        } else {
            data = await this.exportacionIncidenciasService.exportarBCF(userId, projectId, dto);
            contentType = 'application/zip';
            filename = `${dto.titulo || 'reporte'}_${Date.now()}.bcfzip`;
        }

        return {
            success: true,
            data,
            contentType,
            filename,
        };
    }
}
