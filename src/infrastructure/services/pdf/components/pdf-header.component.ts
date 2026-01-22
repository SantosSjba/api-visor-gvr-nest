import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfDividerComponent } from './pdf-divider.component';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface HeaderOptions {
    leftText?: string;
    rightText?: string;
    showDivider?: boolean;
    dividerColor?: string;
}

/**
 * Componente para dibujar headers en todas las páginas
 */
export class PdfHeaderComponent {
    /**
     * Dibuja el header en una página
     */
    static draw(doc: PDFDoc, options: HeaderOptions = {}): void {
        const pageWidth = doc.page.width;
        const margin = PdfLayoutConfig.MARGIN_LEFT;
        const headerY = 30;

        // Guardar posición actual
        const oldX = doc.x;
        const oldY = doc.y;
        const oldTopMargin = doc.page.margins.top;
        const oldBottomMargin = doc.page.margins.bottom;

        // Resetear márgenes temporalmente
        doc.page.margins.top = 0;
        doc.page.margins.bottom = 0;

        // Texto izquierdo
        if (options.leftText) {
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_MD,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text(options.leftText, margin, headerY, {
                width: pageWidth / 2 - margin,
            });
        }

        // Texto derecho
        if (options.rightText) {
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_MD,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text(options.rightText, pageWidth / 2, headerY, {
                width: pageWidth / 2 - margin,
                align: 'right',
            });
        }

        // Línea divisoria
        if (options.showDivider !== false) {
            const dividerY = 50;
            PdfDividerComponent.draw(doc, dividerY, {
                width: pageWidth - 2 * margin,
                color: options.dividerColor ?? PdfFontsConfig.COLOR_GRAY_LIGHT,
                lineWidth: 2,
                margin: margin,
            });
        }

        // Restaurar posición y márgenes
        doc.x = oldX;
        doc.y = oldY;
        doc.page.margins.top = oldTopMargin;
        doc.page.margins.bottom = oldBottomMargin;
    }
}
