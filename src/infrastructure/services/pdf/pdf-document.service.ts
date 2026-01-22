import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from './layout/pdf-layout.config';
import { PdfFontsConfig } from './fonts/pdf-fonts.config';
import { PdfHeaderComponent } from './components/pdf-header.component';
import { PdfFooterComponent } from './components/pdf-footer.component';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface PdfDocumentOptions {
    nombreProyecto?: string;
    tituloReporte?: string;
    usuarioCreador?: string;
    emailCreador?: string;
    fechaCreacion?: Date;
}

/**
 * Servicio principal para crear y gestionar documentos PDF
 */
export class PdfDocumentService {
    private doc: PDFDoc;
    private totalPaginas: number = 0;
    private options: PdfDocumentOptions;

    constructor(options: PdfDocumentOptions = {}) {
        this.options = {
            nombreProyecto: options.nombreProyecto || 'Nombre de proyecto',
            tituloReporte: options.tituloReporte || 'Detalle de la incidencia',
            usuarioCreador: options.usuarioCreador || 'Usuario de la sesion',
            emailCreador: options.emailCreador || '',
            fechaCreacion: options.fechaCreacion || new Date(),
        };

        this.doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: PdfLayoutConfig.MARGIN_TOP,
                bottom: PdfLayoutConfig.MARGIN_BOTTOM,
                left: PdfLayoutConfig.MARGIN_LEFT,
                right: PdfLayoutConfig.MARGIN_RIGHT,
            },
            bufferPages: true,
        });

        // Configurar fuentes
        PdfFontsConfig.setupFonts(this.doc);

        // Configurar header y footer en todas las páginas
        this.setupHeaderFooter();
    }

    /**
     * Obtiene el documento PDF
     */
    getDocument(): PDFDoc {
        return this.doc;
    }

    /**
     * Configura header y footer para todas las páginas
     */
    private setupHeaderFooter(): void {
        // Agregar header y footer a la primera página
        const pageRange = this.doc.bufferedPageRange();
        if (pageRange && pageRange.count > 0) {
            const currentPage = 1;
            const totalPages = this.totalPaginas || pageRange.count;

            // Header
            PdfHeaderComponent.draw(this.doc, {
                leftText: this.options.nombreProyecto,
                rightText: this.options.tituloReporte,
                showDivider: true,
            });

            // Footer
            const fechaFormateada = this.formatearFecha(this.options.fechaCreacion!, true);
            const nombreUsuario = this.options.usuarioCreador || 'usuario de la sesion';
            const textoCreador = `Creado por ${nombreUsuario} con GVR PERUVIAN ENGINEERS el ${fechaFormateada}`;

            PdfFooterComponent.draw(this.doc, currentPage, totalPages, {
                leftText: textoCreador,
                showDivider: true,
            });
        }

        // Agregar header y footer a todas las páginas nuevas
        // Nota: El footer se actualizará al final con el total correcto en updateTotalPages()
        this.doc.on('pageAdded', () => {
            const pageRange = this.doc.bufferedPageRange();
            if (pageRange && pageRange.count > 0) {
                // El número de página actual es el count (ya que pageAdded se llama después de agregar)
                const currentPage = pageRange.count;
                const totalPages = this.totalPaginas || currentPage;

                // Header
                PdfHeaderComponent.draw(this.doc, {
                    leftText: this.options.nombreProyecto,
                    rightText: this.options.tituloReporte,
                    showDivider: true,
                });

                // Footer (se actualizará al final con el total correcto)
                const fechaFormateada = this.formatearFecha(this.options.fechaCreacion!, true);
                const nombreUsuario = this.options.usuarioCreador || 'usuario de la sesion';
                const textoCreador = `Creado por ${nombreUsuario} con GVR PERUVIAN ENGINEERS el ${fechaFormateada}`;

                PdfFooterComponent.draw(this.doc, currentPage, totalPages, {
                    leftText: textoCreador,
                    showDivider: true,
                });
            }
        });
    }

    /**
     * Actualiza el total de páginas (debe llamarse al final)
     */
    updateTotalPages(): void {
        const pageRange = this.doc.bufferedPageRange();
        if (pageRange && pageRange.count > 0) {
            this.totalPaginas = pageRange.count;

            // Actualizar footer en todas las páginas
            // El índice del buffer comienza en pageRange.start, pero el número de página es 1-based
            for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
                this.doc.switchToPage(i);
                // Calcular el número de página correcto (1-based)
                const currentPage = i - pageRange.start + 1;
                const fechaFormateada = this.formatearFecha(this.options.fechaCreacion!, true);
                const nombreUsuario = this.options.usuarioCreador || 'usuario de la sesion';
                const textoCreador = `Creado por ${nombreUsuario} con GVR PERUVIAN ENGINEERS el ${fechaFormateada}`;

                PdfFooterComponent.draw(this.doc, currentPage, this.totalPaginas, {
                    leftText: textoCreador,
                    showDivider: true,
                });
            }
        }
    }

    /**
     * Genera el buffer del PDF
     */
    async generateBuffer(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            this.doc.on('data', (chunk) => chunks.push(chunk));
            this.doc.on('end', () => resolve(Buffer.concat(chunks)));
            this.doc.on('error', reject);

            this.updateTotalPages();
            this.doc.end();
        });
    }

    private formatearFecha(fecha: Date, incluirHora: boolean = false): string {
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
