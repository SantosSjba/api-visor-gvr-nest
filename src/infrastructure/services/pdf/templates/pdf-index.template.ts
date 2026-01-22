import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfSectionComponent } from '../components/pdf-section.component';
import { PdfLayoutHelper } from '../helpers/pdf-layout.helper';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface IndexItem {
    id: string;
    titulo: string;
    pagina: number;
}

/**
 * Template para el índice de contenido
 */
export class PdfIndexTemplate {
    /**
     * Dibuja el índice completo
     */
    static draw(doc: PDFDoc, items: IndexItem[]): void {
        const margin = PdfLayoutConfig.MARGIN_LEFT;
        const pageWidth = PdfLayoutConfig.PAGE_WIDTH;
        
        // Resetear posición Y al inicio del área útil (importante para evitar superposiciones)
        // Esto asegura que el índice siempre se dibuje desde el principio de la página
        doc.y = PdfLayoutConfig.MARGIN_TOP;
        let y = PdfLayoutConfig.MARGIN_TOP;

        // Verificar que hay espacio suficiente para el título antes de dibujarlo
        const titleHeight = PdfFontsConfig.FONT_SIZE_2XL + PdfLayoutConfig.SPACING_LG;
        y = PdfLayoutHelper.ensureSpace(doc, titleHeight, y);

        // Título
        y = PdfSectionComponent.drawTitle(doc, y, 'Contenido', {
            titleSize: PdfFontsConfig.FONT_SIZE_2XL,
        });

        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_BASE,
            color: PdfFontsConfig.COLOR_BLACK,
        });

        // Ordenar items por ID descendente
        const itemsOrdenados = [...items].sort((a, b) => {
            const idA = parseInt(a.id || '0');
            const idB = parseInt(b.id || '0');
            return idB - idA;
        });

        itemsOrdenados.forEach((item) => {
            // Verificar espacio
            const requiredHeight = PdfFontsConfig.FONT_SIZE_BASE + PdfLayoutConfig.SPACING_MD;
            y = PdfLayoutHelper.ensureSpace(doc, requiredHeight, y);

            const texto = `#${item.id}: ${item.titulo}`;
            const pagina = item.pagina.toString();

            // Calcular anchos
            const anchoTexto = doc.widthOfString(texto);
            const anchoPagina = doc.widthOfString(pagina);
            const anchoPunto = doc.widthOfString('.');
            const espacioTotal = pageWidth - 2 * margin;
            const espacioEntre = espacioTotal - anchoTexto - anchoPagina - 10;

            // Calcular número de puntos
            const numPuntos = Math.max(0, Math.floor(espacioEntre / anchoPunto));
            const puntos = '.'.repeat(numPuntos);

            // Dibujar texto a la izquierda (en azul según las capturas)
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_BASE,
                color: PdfFontsConfig.COLOR_BLUE,
            });
            doc.text(texto, margin, y);

            // Dibujar puntos
            const xPuntos = margin + anchoTexto + 5;
            doc.text(puntos, xPuntos, y);

            // Dibujar número de página
            const xPagina = pageWidth - margin - anchoPagina;
            doc.text(pagina, xPagina, y);

            y += PdfLayoutConfig.SPACING_MD;
        });
    }
}
