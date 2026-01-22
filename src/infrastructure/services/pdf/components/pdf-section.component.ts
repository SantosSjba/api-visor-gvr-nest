import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfLayoutHelper } from '../helpers/pdf-layout.helper';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface SectionOptions {
    titleSize?: number;
    titleColor?: string;
    spacingAfter?: number;
}

/**
 * Componente para dibujar secciones con títulos
 */
export class PdfSectionComponent {
    /**
     * Dibuja el título de una sección
     */
    static drawTitle(
        doc: PDFDoc,
        y: number,
        title: string,
        options: SectionOptions = {},
    ): number {
        const titleSize = options.titleSize ?? PdfFontsConfig.FONT_SIZE_2XL;
        const titleColor = options.titleColor ?? PdfFontsConfig.COLOR_BLACK;
        const spacingAfter = options.spacingAfter ?? PdfLayoutConfig.SPACING_LG;

        PdfFontsConfig.applyTextStyle(doc, {
            size: titleSize,
            color: titleColor,
            bold: true,
        });

        const margin = PdfLayoutConfig.MARGIN_LEFT;
        const width = PdfLayoutConfig.USABLE_WIDTH;

        doc.text(title, margin, y, { width });

        return y + titleSize + spacingAfter;
    }

    /**
     * Dibuja una sección completa con título y contenido
     */
    static draw(
        doc: PDFDoc,
        startY: number,
        title: string,
        contentCallback: (contentY: number) => number,
        options: SectionOptions = {},
    ): number {
        // Verificar espacio para el título
        const titleHeight = (options.titleSize ?? PdfFontsConfig.FONT_SIZE_2XL) + 
                           (options.spacingAfter ?? PdfLayoutConfig.SPACING_LG);
        let currentY = PdfLayoutHelper.ensureSpace(doc, titleHeight, startY);

        // Dibujar título
        currentY = this.drawTitle(doc, currentY, title, options);

        // Dibujar contenido
        currentY = contentCallback(currentY);

        return currentY;
    }
}
