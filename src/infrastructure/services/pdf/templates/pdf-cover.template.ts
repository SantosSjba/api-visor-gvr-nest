import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfSectionComponent } from '../components/pdf-section.component';
import { PdfLabelValueComponent } from '../components/pdf-label-value.component';
import { PdfDividerComponent } from '../components/pdf-divider.component';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface CoverData {
    tituloReporte: string;
    fechaCreacion: Date;
    usuarioCreador: string;
    totalIncidencias: number;
    filtrosTexto: string;
}

/**
 * Template para la página de cubierta
 */
export class PdfCoverTemplate {
    /**
     * Dibuja la cubierta completa
     */
    static draw(doc: PDFDoc, data: CoverData): void {
        const pageWidth = PdfLayoutConfig.PAGE_WIDTH;
        const margin = PdfLayoutConfig.MARGIN_LEFT;
        let y = 100;

        // Título principal
        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_LG,
            color: PdfFontsConfig.COLOR_BLACK,
            bold: true,
        });
        doc.text(data.tituloReporte, margin, y, {
            width: pageWidth - 2 * margin,
        });

        y += PdfLayoutConfig.SPACING_XL;

        // Subtítulo
        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_LG,
            color: PdfFontsConfig.COLOR_BLACK,
            bold: true,
        });
        doc.text('Detalle de la incidencia', margin, y, {
            width: pageWidth - 2 * margin,
        });

        y += PdfLayoutConfig.SPACING_XL * 1.5;

        // Información de creación
        const fechaFormateada = this.formatearFecha(data.fechaCreacion, true);

        const infoItems = [
            { label: 'Creado el', value: fechaFormateada },
            { label: 'Creado por', value: data.usuarioCreador },
            { label: 'Elementos totales', value: data.totalIncidencias.toString() },
            { label: 'Ordenado por', value: 'ID (Descendente)' },
            { label: 'Filtrado por', value: data.filtrosTexto },
        ];

        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_BASE,
            color: PdfFontsConfig.COLOR_BLACK,
        });

        infoItems.forEach((item, index) => {
            // Línea separadora
            PdfDividerComponent.draw(doc, y, {
                width: pageWidth - 2 * margin,
                color: PdfFontsConfig.COLOR_GRAY_LIGHT,
                lineWidth: 0.5,
                margin: margin,
            });

            y += PdfLayoutConfig.SPACING_SM;

            // Label y valor
            y = PdfLabelValueComponent.draw(
                doc,
                y,
                item.label,
                item.value,
                {
                    labelWidth: 150,
                    fontSize: PdfFontsConfig.FONT_SIZE_BASE,
                },
            );

            y += PdfLayoutConfig.SPACING_MD;
        });

        // Línea final
        PdfDividerComponent.draw(doc, y, {
            width: pageWidth - 2 * margin,
            color: PdfFontsConfig.COLOR_GRAY_LIGHT,
            lineWidth: 0.5,
            margin: margin,
        });
    }

    private static formatearFecha(fecha: Date, incluirHora: boolean = false): string {
        const dia = fecha.getDate();
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const mes = meses[fecha.getMonth()];
        const año = fecha.getFullYear();

        let fechaFormateada = `${dia} de ${mes}. de ${año}`;

        if (incluirHora) {
            const hora = fecha.getHours().toString().padStart(2, '0');
            const minutos = fecha.getMinutes().toString().padStart(2, '0');

            const timeZoneOffset = -fecha.getTimezoneOffset() / 60;
            const timeZoneSign = timeZoneOffset >= 0 ? '+' : '-';
            const timeZoneHours = Math.abs(timeZoneOffset).toString().padStart(2, '0');
            const timeZone = `UTC${timeZoneSign}${timeZoneHours}:00`;

            fechaFormateada += `, ${hora}:${minutos} ${timeZone}`;
        }

        return fechaFormateada;
    }
}
