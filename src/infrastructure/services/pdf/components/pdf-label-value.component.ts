import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfLayoutHelper } from '../helpers/pdf-layout.helper';
import { PdfDividerComponent } from './pdf-divider.component';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface LabelValueOptions {
    labelWidth?: number;
    labelColor?: string;
    valueColor?: string;
    fontSize?: number;
    boldLabel?: boolean;
    spacing?: number;
}

/**
 * Componente para dibujar etiquetas con valores (Label: Value)
 */
export class PdfLabelValueComponent {
    /**
     * Dibuja una fila de label + value
     */
    static draw(
        doc: PDFDoc,
        y: number,
        label: string,
        value: string,
        options: LabelValueOptions = {},
    ): number {
        const labelWidth = options.labelWidth ?? 150;
        const labelColor = options.labelColor ?? PdfFontsConfig.COLOR_BLACK;
        const valueColor = options.valueColor ?? PdfFontsConfig.COLOR_BLACK;
        const fontSize = options.fontSize ?? PdfFontsConfig.FONT_SIZE_BASE;
        const spacing = options.spacing ?? PdfLayoutConfig.SPACING_SM;
        const margin = PdfLayoutConfig.MARGIN_LEFT;
        const usableWidth = PdfLayoutConfig.USABLE_WIDTH;

        // Dibujar label
        PdfFontsConfig.applyTextStyle(doc, {
            size: fontSize,
            color: labelColor,
            bold: options.boldLabel ?? false,
        });
        doc.text(label, margin, y, { width: labelWidth });

        // Dibujar value
        PdfFontsConfig.applyTextStyle(doc, {
            size: fontSize,
            color: valueColor,
        });
        doc.text(value, margin + labelWidth, y, {
            width: usableWidth - labelWidth,
        });

        return y + fontSize + spacing;
    }

    /**
     * Dibuja múltiples filas de label + value
     */
    static drawMultiple(
        doc: PDFDoc,
        startY: number,
        items: Array<{ label: string; value: string }>,
        options: LabelValueOptions = {},
    ): number {
        let currentY = startY;
        const spacing = options.spacing ?? PdfLayoutConfig.SPACING_MD;

        items.forEach((item, index) => {
            // Verificar espacio antes de dibujar
            const requiredHeight = (options.fontSize ?? PdfFontsConfig.FONT_SIZE_BASE) + spacing;
            currentY = PdfLayoutHelper.ensureSpace(doc, requiredHeight, currentY);

            // Dibujar línea separadora opcional
            if (index > 0) {
                PdfDividerComponent.draw(doc, currentY - spacing / 2, {
                    color: PdfFontsConfig.COLOR_GRAY_LIGHT,
                    lineWidth: 0.5,
                });
            }

            currentY = this.draw(doc, currentY, item.label, item.value, options);
        });

        return currentY;
    }
}
