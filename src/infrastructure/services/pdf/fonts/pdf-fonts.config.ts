import PDFDocument = require('pdfkit');
import { join } from 'path';

type PDFDoc = InstanceType<typeof PDFDocument>;

/**
 * Configuración y gestión de fuentes para PDFs
 */
export class PdfFontsConfig {
    // Tamaños de fuente estándar
    static readonly FONT_SIZE_XS = 7;
    static readonly FONT_SIZE_SM = 8;
    static readonly FONT_SIZE_MD = 9;
    static readonly FONT_SIZE_BASE = 10;
    static readonly FONT_SIZE_LG = 11;
    static readonly FONT_SIZE_XL = 12;
    static readonly FONT_SIZE_2XL = 14;

    // Fuentes del sistema (fallback)
    static readonly FONT_REGULAR = 'Helvetica';
    static readonly FONT_BOLD = 'Helvetica-Bold';
    static readonly FONT_ITALIC = 'Helvetica-Oblique';
    static readonly FONT_BOLD_ITALIC = 'Helvetica-BoldOblique';

    // Colores estándar
    static readonly COLOR_BLACK = '#000000';
    static readonly COLOR_GRAY_DARK = '#333333';
    static readonly COLOR_GRAY = '#666666';
    static readonly COLOR_GRAY_LIGHT = '#CCCCCC';
    static readonly COLOR_BLUE = '#0066CC';
    static readonly COLOR_ORANGE = '#FF9500';
    static readonly COLOR_WHITE = '#FFFFFF';

    /**
     * Configura las fuentes del documento
     * Por ahora usa fuentes del sistema, pero permite extensión para fuentes personalizadas
     */
    static setupFonts(doc: PDFDoc): void {
        // Por defecto, PDFKit ya tiene Helvetica disponible
        // Si en el futuro se necesitan fuentes personalizadas, se registrarían aquí
        // doc.registerFont('Regular', join(__dirname, '../fonts/Regular.ttf'));
        // doc.registerFont('Bold', join(__dirname, '../fonts/Bold.ttf'));
    }

    /**
     * Aplica estilo de texto estándar
     */
    static applyTextStyle(
        doc: PDFDoc,
        options: {
            size?: number;
            color?: string;
            bold?: boolean;
            italic?: boolean;
        } = {},
    ): void {
        const size = options.size ?? this.FONT_SIZE_BASE;
        const color = options.color ?? this.COLOR_BLACK;
        let font = this.FONT_REGULAR;

        if (options.bold && options.italic) {
            font = this.FONT_BOLD_ITALIC;
        } else if (options.bold) {
            font = this.FONT_BOLD;
        } else if (options.italic) {
            font = this.FONT_ITALIC;
        }

        doc.fontSize(size).fillColor(color).font(font);
    }
}
