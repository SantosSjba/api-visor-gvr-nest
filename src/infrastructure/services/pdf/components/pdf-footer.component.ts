import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfDividerComponent } from './pdf-divider.component';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface FooterOptions {
    leftText?: string;
    rightText?: string;
    showDivider?: boolean;
    dividerColor?: string;
}

/**
 * Componente para dibujar footers en todas las páginas
 */
export class PdfFooterComponent {
    /**
     * Dibuja el footer en una página
     */
    static draw(doc: PDFDoc, currentPage: number, totalPages: number, options: FooterOptions = {}): void {
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = PdfLayoutConfig.MARGIN_LEFT;

        // Guardar posición actual
        const oldX = doc.x;
        const oldY = doc.y;
        const oldBottomMargin = doc.page.margins.bottom;

        // Resetear márgenes temporalmente
        doc.page.margins.bottom = 0;

        const footerY = pageHeight - 30;
        const dividerY = pageHeight - 40;

        // Línea divisoria
        if (options.showDivider !== false) {
            PdfDividerComponent.draw(doc, dividerY, {
                width: pageWidth - 2 * margin,
                color: options.dividerColor ?? PdfFontsConfig.COLOR_GRAY_LIGHT,
                lineWidth: 2,
                margin: margin,
            });
        }

        // Texto izquierdo
        if (options.leftText) {
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_XS,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text(options.leftText, margin, footerY, {
                width: pageWidth - 2 * margin - 100,
            });
        }

        // Número de página (derecha)
        const pageText = `Página ${currentPage} de ${totalPages}`;
        
        // Limpiar área del número de página (hacerlo antes de aplicar estilos)
        // Aumentar el área de limpieza para asegurar que cubra todo el texto
        const pageTextWidth = 100;
        const pageTextX = pageWidth - margin - pageTextWidth;
        const clearHeight = 15; // Altura suficiente para cubrir el texto
        
        doc.rect(pageTextX, footerY - 3, pageTextWidth, clearHeight)
            .fillColor(PdfFontsConfig.COLOR_WHITE)
            .fill();

        // Dibujar el texto del número de página
        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_XS,
            color: PdfFontsConfig.COLOR_GRAY,
        });

        doc.text(pageText, pageTextX, footerY, {
            width: pageTextWidth,
            align: 'right',
        });

        // Restaurar posición y márgenes
        doc.x = oldX;
        doc.y = oldY;
        doc.page.margins.bottom = oldBottomMargin;
    }
}
