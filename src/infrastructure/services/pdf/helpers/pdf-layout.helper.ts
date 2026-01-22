import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';

type PDFDoc = InstanceType<typeof PDFDocument>;

/**
 * Helpers para gestión de layout y saltos de página
 */
export class PdfLayoutHelper {
    /**
     * Verifica si hay espacio suficiente antes de dibujar
     * Si no hay espacio, agrega una nueva página
     * @param doc Documento PDF
     * @param requiredHeight Altura requerida
     * @param currentY Posición Y actual (opcional, usa doc.y si no se proporciona)
     * @param minSpace Espacio mínimo antes del salto de página
     * @returns Nueva posición Y (puede ser en nueva página)
     */
    static ensureSpace(
        doc: PDFDoc,
        requiredHeight: number,
        currentY?: number,
        minSpace: number = PdfLayoutConfig.MIN_SPACE_BEFORE_PAGE_BREAK,
    ): number {
        const y = currentY ?? doc.y;
        const pageHeight = doc.page.height;
        const bottomMargin = doc.page.margins.bottom;
        const availableSpace = pageHeight - y - bottomMargin;

        if (availableSpace < requiredHeight + minSpace) {
            doc.addPage();
            return PdfLayoutConfig.MARGIN_TOP;
        }

        return y;
    }

    /**
     * Obtiene la posición Y actual respetando márgenes
     */
    static getCurrentY(doc: PDFDoc): number {
        return Math.max(doc.y, PdfLayoutConfig.MARGIN_TOP);
    }

    /**
     * Calcula la altura de un texto con wrap
     */
    static calculateTextHeight(
        doc: PDFDoc,
        text: string,
        width: number,
        options?: { fontSize?: number; lineGap?: number },
    ): number {
        const fontSize = options?.fontSize ?? doc.currentLineHeight(false);
        const lineGap = options?.lineGap ?? 0;
        const lines = doc.heightOfString(text, { width });
        return lines * fontSize + (lines - 1) * lineGap;
    }

    /**
     * Mueve el cursor a una nueva línea con espaciado
     */
    static moveToNextLine(doc: PDFDoc, spacing: number = PdfLayoutConfig.SPACING_MD): void {
        doc.y += spacing;
    }

    /**
     * Resetea la posición Y al inicio del área útil
     */
    static resetY(doc: PDFDoc): void {
        doc.y = PdfLayoutConfig.MARGIN_TOP;
    }
}
