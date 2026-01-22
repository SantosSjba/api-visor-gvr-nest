import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfLayoutHelper } from '../helpers/pdf-layout.helper';
import { PdfDividerComponent } from './pdf-divider.component';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface CardOptions {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    padding?: number;
    borderRadius?: number;
}

/**
 * Componente para dibujar cards/rectángulos con contenido
 */
export class PdfCardComponent {
    /**
     * Dibuja un card con fondo y borde
     */
    static draw(
        doc: PDFDoc,
        x: number,
        y: number,
        width: number,
        height: number,
        options: CardOptions = {},
    ): void {
        const backgroundColor = options.backgroundColor;
        const borderColor = options.borderColor ?? PdfFontsConfig.COLOR_GRAY_LIGHT;
        const borderWidth = options.borderWidth ?? 0.5;
        const borderRadius = options.borderRadius ?? 0;

        if (borderRadius > 0) {
            // Rectángulo con bordes redondeados
            doc.roundedRect(x, y, width, height, borderRadius)
                .fillColor(backgroundColor || PdfFontsConfig.COLOR_WHITE)
                .fill()
                .strokeColor(borderColor)
                .lineWidth(borderWidth)
                .stroke();
        } else {
            // Rectángulo simple
            if (backgroundColor) {
                doc.rect(x, y, width, height)
                    .fillColor(backgroundColor)
                    .fill();
            }
            doc.rect(x, y, width, height)
                .strokeColor(borderColor)
                .lineWidth(borderWidth)
                .stroke();
        }
    }

    /**
     * Dibuja un card con contenido interno
     */
    static drawWithContent(
        doc: PDFDoc,
        x: number,
        y: number,
        width: number,
        contentHeight: number,
        options: CardOptions = {},
        contentCallback: (contentX: number, contentY: number, contentWidth: number) => number,
    ): number {
        const padding = options.padding ?? PdfLayoutConfig.SPACING_SM;
        const totalHeight = contentHeight + padding * 2;

        // Verificar espacio
        const finalY = PdfLayoutHelper.ensureSpace(doc, totalHeight, y);

        // Dibujar card
        this.draw(doc, x, finalY, width, totalHeight, options);

        // Dibujar contenido
        const contentX = x + padding;
        const contentY = finalY + padding;
        const contentWidth = width - padding * 2;

        const newY = contentCallback(contentX, contentY, contentWidth);

        return newY;
    }
}
