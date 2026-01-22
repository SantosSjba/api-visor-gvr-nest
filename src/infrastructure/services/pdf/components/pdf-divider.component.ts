import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';

type PDFDoc = InstanceType<typeof PDFDocument>;

/**
 * Componente para dibujar líneas divisorias
 */
export class PdfDividerComponent {
    /**
     * Dibuja una línea horizontal
     */
    static draw(
        doc: PDFDoc,
        y: number,
        options: {
            width?: number;
            color?: string;
            lineWidth?: number;
            margin?: number;
        } = {},
    ): void {
        const margin = options.margin ?? PdfLayoutConfig.MARGIN_LEFT;
        const width = options.width ?? PdfLayoutConfig.USABLE_WIDTH;
        const color = options.color ?? PdfFontsConfig.COLOR_GRAY_LIGHT;
        const lineWidth = options.lineWidth ?? 0.5;

        const x1 = margin;
        const x2 = margin + width;

        doc.moveTo(x1, y)
            .lineTo(x2, y)
            .strokeColor(color)
            .lineWidth(lineWidth)
            .stroke();
    }

    /**
     * Dibuja una línea vertical
     */
    static drawVertical(
        doc: PDFDoc,
        x: number,
        y1: number,
        y2: number,
        options: {
            color?: string;
            lineWidth?: number;
        } = {},
    ): void {
        const color = options.color ?? PdfFontsConfig.COLOR_GRAY_LIGHT;
        const lineWidth = options.lineWidth ?? 0.5;

        doc.moveTo(x, y1)
            .lineTo(x, y2)
            .strokeColor(color)
            .lineWidth(lineWidth)
            .stroke();
    }
}
