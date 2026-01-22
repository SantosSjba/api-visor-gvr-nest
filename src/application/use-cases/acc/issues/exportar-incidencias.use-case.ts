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

        // Limpiar el título para el nombre de archivo (remover caracteres problemáticos)
        const tituloLimpio = dto.titulo
            ? dto.titulo
                  .replace(/[<>:"/\\|?*]/g, '_') // Reemplazar caracteres no permitidos
                  .replace(/\s+/g, '_') // Reemplazar espacios con guiones bajos
                  .substring(0, 100) // Limitar longitud
            : 'reporte';

        if (dto.formato === FormatoExportacion.PDF) {
            data = await this.exportacionIncidenciasService.exportarPDF(userId, projectId, dto);
            contentType = 'application/pdf';
            filename = `${tituloLimpio}_${Date.now()}.pdf`;
        } else {
            data = await this.exportacionIncidenciasService.exportarBCF(userId, projectId, dto);
            contentType = 'application/zip';
            filename = `${tituloLimpio}_${Date.now()}.bcfzip`;
        }

        return {
            success: true,
            data,
            contentType,
            filename,
        };
    }
}
