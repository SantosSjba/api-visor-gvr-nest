import PDFDocument = require('pdfkit');
import { PdfLayoutConfig } from '../layout/pdf-layout.config';
import { PdfFontsConfig } from '../fonts/pdf-fonts.config';
import { PdfSectionComponent } from '../components/pdf-section.component';
import { PdfLabelValueComponent } from '../components/pdf-label-value.component';
import { PdfLayoutHelper } from '../helpers/pdf-layout.helper';
import { PdfTextHelper } from '../helpers/pdf-text.helper';
import { PdfDividerComponent } from '../components/pdf-divider.component';
import axios from 'axios';

type PDFDoc = InstanceType<typeof PDFDocument>;

export interface IssueDetailData {
    incidencia: any;
    usuarioCreador: string;
    emailCreador: string;
    incluirFotos: boolean;
    tamañoFotos?: 'normal' | 'small' | 'large';
    incluirComentarios: boolean;
    incluirInformacionGeneralPlano?: boolean;
    incluirCamposPersonalizados?: boolean;
    incluirVinculosArchivo?: boolean;
    incluirOtrasReferencias?: boolean;
    downloadImageCallback?: (
        userId: number,
        projectId: string,
        issueId: string,
        adjunto: any,
    ) => Promise<Buffer | null>;
    userId?: number;
    projectId?: string;
}

/**
 * Template para el detalle de una incidencia
 */
export class PdfIssueDetailTemplate {
    /**
     * Dibuja el detalle completo de una incidencia
     */
    static async draw(doc: PDFDoc, data: IssueDetailData): Promise<void> {
        const margin = PdfLayoutConfig.MARGIN_LEFT;
        let y = PdfLayoutConfig.MARGIN_TOP;

        // ID y título de la incidencia (NO incluir "Detalle de la incidencia" como título)
        const id = data.incidencia.displayId || data.incidencia.id;
        const titulo = data.incidencia.title || 'Sin título';

        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_XL,
            color: PdfFontsConfig.COLOR_BLUE,
            bold: true,
        });
        doc.text(`#${id}: ${titulo}`, margin, y, {
            width: PdfLayoutConfig.USABLE_WIDTH,
        });

        y += PdfLayoutConfig.SPACING_XL;

        // Sección "Campos estándar"
        y = PdfSectionComponent.drawTitle(doc, y, 'Campos estándar', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        // Campos estándar
        const campos = this.obtenerCamposEstandar(data.incidencia, data.usuarioCreador, data.emailCreador);
        y = this.dibujarCamposEstandar(doc, y, campos);

        // Información general del plano (si está habilitada)
        if (data.incluirInformacionGeneralPlano) {
            y = this.dibujarInformacionGeneralPlano(doc, y, data.incidencia);
        }

        // Campos personalizados (si está habilitado)
        if (data.incluirCamposPersonalizados && data.incidencia.customAttributes?.length > 0) {
            y = this.dibujarCamposPersonalizados(doc, y, data.incidencia.customAttributes);
        }

        // Vínculos de archivo (si está habilitado)
        if (data.incluirVinculosArchivo && data.incidencia.linkedDocuments?.length > 0) {
            y = this.dibujarVinculosArchivo(doc, y, data.incidencia.linkedDocuments);
        }

        // Referencias y archivos adjuntos (fotos)
        if (data.incluirFotos) {
            y = await this.dibujarAdjuntos(doc, y, data);
        }

        // Otras referencias (si está habilitado)
        if (data.incluirOtrasReferencias) {
            y = this.dibujarOtrasReferencias(doc, y, data.incidencia);
        }

        // Comentarios
        if (data.incluirComentarios && data.incidencia.comentarios?.length > 0) {
            y = this.dibujarComentarios(doc, y, data.incidencia.comentarios, data.usuarioCreador);
        }
    }

    private static dibujarCamposEstandar(
        doc: PDFDoc,
        startY: number,
        campos: Array<{ label: string; value: string; tipo?: string; icono?: string }>,
    ): number {
        const margin = PdfLayoutConfig.MARGIN_LEFT;
        let y = startY;

        campos.forEach((campo) => {
            // Verificar espacio
            const requiredHeight = PdfFontsConfig.FONT_SIZE_BASE + PdfLayoutConfig.SPACING_MD;
            y = PdfLayoutHelper.ensureSpace(doc, requiredHeight, y);

            // Línea separadora
            PdfDividerComponent.draw(doc, y, {
                color: PdfFontsConfig.COLOR_GRAY_LIGHT,
                lineWidth: 0.5,
            });

            y += PdfLayoutConfig.SPACING_SM;

            // Label
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_BASE,
                color: PdfFontsConfig.COLOR_BLACK,
            });
            doc.text(campo.label, margin, y, { width: 150 });

            // Valor con formato especial
            if (campo.tipo === 'estado') {
                // Barra vertical de color
                doc.rect(margin + 150, y - 2, 3, 14)
                    .fillColor(PdfFontsConfig.COLOR_ORANGE)
                    .fill();

                PdfFontsConfig.applyTextStyle(doc, {
                    size: PdfFontsConfig.FONT_SIZE_BASE,
                    color: PdfFontsConfig.COLOR_BLACK,
                });
                doc.text(campo.value, margin + 160, y, {
                    width: PdfLayoutConfig.USABLE_WIDTH - 160,
                });
            } else if (campo.tipo === 'tipo') {
                // Círculo con letra
                const circuloX = margin + 150;
                const circuloY = y + 5;

                doc.circle(circuloX + 8, circuloY, 8)
                    .fillColor(PdfFontsConfig.COLOR_ORANGE)
                    .fill();

                PdfFontsConfig.applyTextStyle(doc, {
                    size: PdfFontsConfig.FONT_SIZE_SM,
                    color: PdfFontsConfig.COLOR_WHITE,
                    bold: true,
                });
                doc.text(campo.icono || 'D', circuloX + 4, circuloY - 4, {
                    width: 8,
                    align: 'center',
                });

                PdfFontsConfig.applyTextStyle(doc, {
                    size: PdfFontsConfig.FONT_SIZE_BASE,
                    color: PdfFontsConfig.COLOR_BLACK,
                });
                doc.text(campo.value, margin + 175, y, {
                    width: PdfLayoutConfig.USABLE_WIDTH - 175,
                });
            } else if (campo.tipo === 'posicion') {
                // Texto en azul
                PdfFontsConfig.applyTextStyle(doc, {
                    size: PdfFontsConfig.FONT_SIZE_BASE,
                    color: PdfFontsConfig.COLOR_BLUE,
                });
                doc.text(campo.value, margin + 150, y, {
                    width: PdfLayoutConfig.USABLE_WIDTH - 150,
                });
            } else {
                // Valor normal
                PdfFontsConfig.applyTextStyle(doc, {
                    size: PdfFontsConfig.FONT_SIZE_BASE,
                    color: PdfFontsConfig.COLOR_BLACK,
                });
                doc.text(campo.value, margin + 150, y, {
                    width: PdfLayoutConfig.USABLE_WIDTH - 150,
                });
            }

            y += PdfLayoutConfig.SPACING_MD;
        });

        return y;
    }

    private static async dibujarAdjuntos(doc: PDFDoc, startY: number, data: IssueDetailData): Promise<number> {
        const adjuntos = data.incidencia.adjuntos || [];
        // Filtrar imágenes: buscar por type, mimeType, o extensiones de archivo comunes
        const fotos = adjuntos.filter((a: any) => {
            // Verificar si es una foto por tipo
            if (a.type === 'photo' || a.attachmentType === 'photo' || a.attachmentType === 'issue-attachment') {
                return true;
            }
            // Verificar por mimeType
            if (a.mimeType?.startsWith('image/')) {
                return true;
            }
            // Verificar por extensión de archivo
            const fileName = a.fileName || a.displayName || a.name || '';
            const extension = fileName.toLowerCase().split('.').pop();
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
            if (extension && imageExtensions.includes(extension)) {
                return true;
            }
            // Si tiene un URN de imagen (snapshotUrn, storageUrn, etc.), asumir que es imagen
            if (a.snapshotUrn || a.storageUrn || a.urn || a.thumbnailUrn) {
                return true;
            }
            return false;
        });

        if (fotos.length === 0) {
            return startY;
        }

        let y = startY + PdfLayoutConfig.SPACING_LG;

        // Verificar espacio
        y = PdfLayoutHelper.ensureSpace(doc, 200, y);

        // Título de sección
        y = PdfSectionComponent.drawTitle(doc, y, 'Referencias y archivos adjuntos', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        PdfFontsConfig.applyTextStyle(doc, {
            size: PdfFontsConfig.FONT_SIZE_BASE,
            color: PdfFontsConfig.COLOR_BLACK,
        });
        doc.text(`Fotos (${fotos.length})`, PdfLayoutConfig.MARGIN_LEFT, y, {
            width: PdfLayoutConfig.USABLE_WIDTH,
        });

        y += PdfLayoutConfig.SPACING_MD;

        // Configurar layout según tamañoFotos
        const tamañoFotos = data.tamañoFotos || 'normal';
        let columnasPorFila: number;
        let anchoFoto: number;
        let altoFoto: number;
        let espacioEntreFotos: number;

        switch (tamañoFotos) {
            case 'small':
                columnasPorFila = 3;
                anchoFoto = 150;
                altoFoto = 112;
                espacioEntreFotos = PdfLayoutConfig.SPACING_MD;
                break;
            case 'large':
                columnasPorFila = 1;
                anchoFoto = 400;
                altoFoto = 300;
                espacioEntreFotos = 0;
                break;
            case 'normal':
            default:
                columnasPorFila = 2;
                anchoFoto = 240;
                altoFoto = 180;
                espacioEntreFotos = PdfLayoutConfig.SPACING_MD;
                break;
        }

        // Calcular ancho total de una fila
        const anchoTotalFila = columnasPorFila * anchoFoto + (columnasPorFila - 1) * espacioEntreFotos;
        const espacioDisponible = PdfLayoutConfig.USABLE_WIDTH;
        const offsetX = (espacioDisponible - anchoTotalFila) / 2; // Centrar si hay espacio extra

        // Altura de metadatos (nombre + 3 líneas de texto)
        const alturaMetadatos = PdfFontsConfig.FONT_SIZE_MD + 12 + 12 + 12 + PdfLayoutConfig.SPACING_SM;
        const alturaTotalPorImagen = altoFoto + alturaMetadatos;

        // Dibujar fotos en filas
        for (let i = 0; i < fotos.length; i++) {
            const columna = i % columnasPorFila;
            const esPrimeraColumna = columna === 0;

            // Si es la primera columna de una nueva fila, verificar espacio y avanzar Y
            if (esPrimeraColumna && i > 0) {
                y = PdfLayoutHelper.ensureSpace(doc, alturaTotalPorImagen + PdfLayoutConfig.SPACING_MD, y);
                y += PdfLayoutConfig.SPACING_MD;
            } else if (!esPrimeraColumna) {
                // Si no es la primera columna, mantener la misma Y
                // (ya se verificó espacio en la primera columna)
            } else {
                // Primera imagen de la primera fila
                y = PdfLayoutHelper.ensureSpace(doc, alturaTotalPorImagen, y);
            }

            // Calcular posición X según la columna
            const x = PdfLayoutConfig.MARGIN_LEFT + offsetX + columna * (anchoFoto + espacioEntreFotos);

            // Descargar y dibujar imagen
            try {
                let imagenBuffer: Buffer | null = null;
                if (data.downloadImageCallback && data.userId && data.projectId) {
                    imagenBuffer = await data.downloadImageCallback(
                        data.userId,
                        data.projectId,
                        data.incidencia.id,
                        fotos[i],
                    );
                }

                if (imagenBuffer) {
                    doc.image(imagenBuffer, x, y, {
                        width: anchoFoto,
                        height: altoFoto,
                        fit: [anchoFoto, altoFoto],
                    });
                } else {
                    // Placeholder
                    doc.rect(x, y, anchoFoto, altoFoto)
                        .strokeColor(PdfFontsConfig.COLOR_GRAY_LIGHT)
                        .stroke();
                }
            } catch (error) {
                // Placeholder
                doc.rect(x, y, anchoFoto, altoFoto)
                    .strokeColor(PdfFontsConfig.COLOR_GRAY_LIGHT)
                    .stroke();
            }

            // Metadatos debajo de la imagen
            const yMeta = y + altoFoto + PdfLayoutConfig.SPACING_SM;
            const nombreFoto = fotos[i].displayName || fotos[i].fileName || fotos[i].name || 'Thumbnail';

            // Nombre del archivo
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_MD,
                color: PdfFontsConfig.COLOR_BLACK,
            });
            doc.text(nombreFoto, x, yMeta, {
                width: anchoFoto,
            });

            // "Se ha añadido como Archivo adjunto"
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_BASE,
                color: PdfFontsConfig.COLOR_BLACK,
                bold: true,
            });
            doc.text('Se ha añadido como Archivo adjunto', x, yMeta + 12, {
                width: anchoFoto,
            });

            // Fecha
            const fechaAdjunto = fotos[i].createdAt
                ? this.formatearFecha(new Date(fotos[i].createdAt), true)
                : '';

            if (fechaAdjunto) {
                PdfFontsConfig.applyTextStyle(doc, {
                    size: PdfFontsConfig.FONT_SIZE_SM,
                    color: PdfFontsConfig.COLOR_GRAY,
                });
                doc.text(`Añadida el ${fechaAdjunto}`, x, yMeta + 24, {
                    width: anchoFoto,
                });
            }

            // Creador
            const creador = fotos[i].createdByReal || fotos[i].createdBy || data.usuarioCreador;
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_SM,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text(`Añadida por ${creador}`, x, yMeta + 36, {
                width: anchoFoto,
            });

            // Si es la última columna de la fila o la última imagen, avanzar Y
            if (columna === columnasPorFila - 1 || i === fotos.length - 1) {
                y += alturaTotalPorImagen;
            }
        }

        return y;
    }

    private static dibujarComentarios(
        doc: PDFDoc,
        startY: number,
        comentarios: any[],
        usuarioCreador: string,
    ): number {
        let y = startY + PdfLayoutConfig.SPACING_LG;

        // Verificar espacio
        y = PdfLayoutHelper.ensureSpace(doc, 150, y);

        // Título de sección
        y = PdfSectionComponent.drawTitle(doc, y, 'Comentarios', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        comentarios.forEach((comentario: any) => {
            const requiredHeight = 120;
            y = PdfLayoutHelper.ensureSpace(doc, requiredHeight, y);

            const creador = comentario.createdByReal || comentario.createdBy || usuarioCreador;
            const fechaComentario = comentario.createdAt
                ? this.formatearFecha(new Date(comentario.createdAt), true)
                : '';

            // Nombre y fecha
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_MD,
                color: PdfFontsConfig.COLOR_BLACK,
                bold: true,
            });
            doc.text(creador, PdfLayoutConfig.MARGIN_LEFT, y);

            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_SM,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text(fechaComentario, PdfLayoutConfig.MARGIN_LEFT, y + 12);

            y += PdfLayoutConfig.SPACING_LG;

            // Texto del comentario
            const textoComentario = PdfTextHelper.procesarTextoComentario(
                comentario.comment || comentario.body || '',
            );

            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_MD,
                color: PdfFontsConfig.COLOR_BLACK,
            });
            doc.text(textoComentario, PdfLayoutConfig.MARGIN_LEFT, y, {
                width: PdfLayoutConfig.USABLE_WIDTH,
            });

            const alturaComentario = doc.heightOfString(textoComentario, {
                width: PdfLayoutConfig.USABLE_WIDTH,
            });
            y += alturaComentario + PdfLayoutConfig.SPACING_MD;

            // Línea separadora
            PdfDividerComponent.draw(doc, y, {
                color: PdfFontsConfig.COLOR_GRAY_LIGHT,
                lineWidth: 0.5,
            });

            y += PdfLayoutConfig.SPACING_SM;
        });

        return y;
    }

    private static obtenerCamposEstandar(
        incidencia: any,
        usuarioCreador: string,
        emailCreador: string,
    ): Array<{ label: string; value: string; tipo?: string; icono?: string }> {
        const campos: Array<{ label: string; value: string; tipo?: string; icono?: string }> = [];

        // Estado
        const estadoLabel = this.getStatusLabel(incidencia.status);
        campos.push({ label: 'Estado', value: estadoLabel, tipo: 'estado' });

        // Tipo
        let tipoTexto = incidencia.issueSubtypeName || incidencia.issueTypeName || 'Design > Design';
        let tipoLetra = tipoTexto.charAt(0).toUpperCase();

        if (incidencia.issueTypeName && incidencia.issueSubtypeName) {
            tipoTexto = `${incidencia.issueTypeName} > ${incidencia.issueSubtypeName}`;
        }

        campos.push({ label: 'Tipo', value: tipoTexto, tipo: 'tipo', icono: tipoLetra });

        // Descripción
        campos.push({ label: 'Descripción', value: incidencia.description || '—' });

        // Asignado a
        const asignadoA =
            incidencia.assignedToRealMultiple?.map((u: any) => u.usuario).join(', ') ||
            incidencia.assignedToReal ||
            '—';
        campos.push({ label: 'Asignado a', value: asignadoA });

        // Creado por
        const creadoPor = `${incidencia.createdByReal || usuarioCreador} (${emailCreador})`;
        campos.push({ label: 'Creado por', value: creadoPor });

        // Creado el
        const creadoEl = incidencia.createdAt
            ? this.formatearFecha(new Date(incidencia.createdAt), false)
            : '—';
        campos.push({ label: 'Creado el', value: creadoEl });

        // Ubicación
        campos.push({ label: 'Ubicación', value: incidencia.locationId || '—' });

        // Detalles de la ubicación
        campos.push({ label: 'Detalles de la ubicación', value: incidencia.locationDetails || '—' });

        // Vencimiento
        if (incidencia.dueDate) {
            const fechaVencimiento = new Date(incidencia.dueDate);
            const diasTarde = Math.floor(
                (new Date().getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24),
            );
            const fechaTexto = this.formatearFecha(fechaVencimiento, false);
            const vencimientoTexto = diasTarde > 0 ? `${fechaTexto} (${diasTarde} días tarde)` : fechaTexto;
            campos.push({ label: 'Vencimiento', value: vencimientoTexto });
        } else {
            campos.push({ label: 'Vencimiento', value: '—' });
        }

        // Fecha de inicio
        const fechaInicio = incidencia.startDate
            ? this.formatearFecha(new Date(incidencia.startDate), false)
            : '—';
        campos.push({ label: 'Fecha de inicio', value: fechaInicio });

        // Posición
        const posicion =
            incidencia.linkedDocuments?.[0]?.details?.viewable?.name ||
            incidencia.linkedDocuments?.[0]?.urn?.split('/').pop() ||
            'MODELO FEDERADO - HOTEL 2025.nwd';
        campos.push({ label: 'Posición', value: posicion, tipo: 'posicion' });

        // Causa principal
        campos.push({ label: 'Causa principal', value: incidencia.rootCauseId || '—' });

        return campos;
    }

    private static getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            draft: 'Borrador',
            open: 'Abierto',
            pending: 'Pendiente',
            'in-progress': 'En Progreso',
            in_review: 'En revisión',
            closed: 'Cerrado',
        };
        return labels[status] || status;
    }

    private static formatearFecha(fecha: Date, incluirHora: boolean = false): string {
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

    private static dibujarInformacionGeneralPlano(doc: PDFDoc, startY: number, incidencia: any): number {
        let y = startY + PdfLayoutConfig.SPACING_LG;
        y = PdfLayoutHelper.ensureSpace(doc, 100, y);

        y = PdfSectionComponent.drawTitle(doc, y, 'Información general del plano', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        const campos: Array<{ label: string; value: string }> = [];

        // Información del documento vinculado
        if (incidencia.linkedDocuments?.[0]) {
            const linkedDoc = incidencia.linkedDocuments[0];
            if (linkedDoc.details?.viewable?.name) {
                campos.push({ label: 'Nombre del documento', value: linkedDoc.details.viewable.name });
            }
            if (linkedDoc.urn) {
                campos.push({ label: 'URN', value: linkedDoc.urn });
            }
            if (linkedDoc.createdAt) {
                campos.push({
                    label: 'Fecha de creación',
                    value: this.formatearFecha(new Date(linkedDoc.createdAt), true),
                });
            }
            if (linkedDoc.createdBy) {
                campos.push({ label: 'Creado por', value: linkedDoc.createdBy });
            }
        }

        if (campos.length > 0) {
            y = PdfLabelValueComponent.drawMultiple(doc, y, campos, {
                labelWidth: 150,
                spacing: PdfLayoutConfig.SPACING_MD,
            });
        } else {
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_BASE,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text('No hay información disponible del plano', PdfLayoutConfig.MARGIN_LEFT, y, {
                width: PdfLayoutConfig.USABLE_WIDTH,
            });
            y += PdfLayoutConfig.SPACING_MD;
        }

        return y;
    }

    private static dibujarCamposPersonalizados(
        doc: PDFDoc,
        startY: number,
        customAttributes: any[],
    ): number {
        let y = startY + PdfLayoutConfig.SPACING_LG;
        y = PdfLayoutHelper.ensureSpace(doc, 100, y);

        y = PdfSectionComponent.drawTitle(doc, y, 'Campos personalizados', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        const campos: Array<{ label: string; value: string }> = [];

        customAttributes.forEach((attr: any) => {
            const label = attr.name || attr.label || attr.id || 'Campo personalizado';
            let value = '—';

            if (attr.value !== undefined && attr.value !== null) {
                if (typeof attr.value === 'object') {
                    value = JSON.stringify(attr.value);
                } else {
                    value = String(attr.value);
                }
            }

            campos.push({ label, value });
        });

        if (campos.length > 0) {
            y = PdfLabelValueComponent.drawMultiple(doc, y, campos, {
                labelWidth: 150,
                spacing: PdfLayoutConfig.SPACING_MD,
            });
        } else {
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_BASE,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text('No hay campos personalizados', PdfLayoutConfig.MARGIN_LEFT, y, {
                width: PdfLayoutConfig.USABLE_WIDTH,
            });
            y += PdfLayoutConfig.SPACING_MD;
        }

        return y;
    }

    private static dibujarVinculosArchivo(doc: PDFDoc, startY: number, linkedDocuments: any[]): number {
        let y = startY + PdfLayoutConfig.SPACING_LG;
        y = PdfLayoutHelper.ensureSpace(doc, 150, y);

        y = PdfSectionComponent.drawTitle(doc, y, 'Vínculos de archivo', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        linkedDocuments.forEach((linkedDoc: any, index: number) => {
            const requiredHeight = 80;
            y = PdfLayoutHelper.ensureSpace(doc, requiredHeight, y);

            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_MD,
                color: PdfFontsConfig.COLOR_BLACK,
                bold: true,
            });
            doc.text(`Documento ${index + 1}`, PdfLayoutConfig.MARGIN_LEFT, y, {
                width: PdfLayoutConfig.USABLE_WIDTH,
            });

            y += PdfLayoutConfig.SPACING_SM;

            const campos: Array<{ label: string; value: string }> = [];
            if (linkedDoc.type) campos.push({ label: 'Tipo', value: linkedDoc.type });
            if (linkedDoc.urn) campos.push({ label: 'URN', value: linkedDoc.urn });
            if (linkedDoc.createdAt) {
                campos.push({
                    label: 'Fecha de creación',
                    value: this.formatearFecha(new Date(linkedDoc.createdAt), true),
                });
            }
            if (linkedDoc.createdBy) campos.push({ label: 'Creado por', value: linkedDoc.createdBy });
            if (linkedDoc.createdAtVersion) campos.push({ label: 'Versión', value: String(linkedDoc.createdAtVersion) });

            if (campos.length > 0) {
                y = PdfLabelValueComponent.drawMultiple(doc, y, campos, {
                    labelWidth: 120,
                    spacing: PdfLayoutConfig.SPACING_SM,
                });
            }

            if (index < linkedDocuments.length - 1) {
                y += PdfLayoutConfig.SPACING_SM;
                PdfDividerComponent.draw(doc, y, {
                    color: PdfFontsConfig.COLOR_GRAY_LIGHT,
                    lineWidth: 0.5,
                });
                y += PdfLayoutConfig.SPACING_SM;
            }
        });

        return y;
    }

    private static dibujarOtrasReferencias(doc: PDFDoc, startY: number, incidencia: any): number {
        let y = startY + PdfLayoutConfig.SPACING_LG;
        y = PdfLayoutHelper.ensureSpace(doc, 100, y);

        y = PdfSectionComponent.drawTitle(doc, y, 'Otras referencias', {
            titleSize: PdfFontsConfig.FONT_SIZE_LG,
        });

        const campos: Array<{ label: string; value: string }> = [];

        // Referencias adicionales que no están en otras secciones
        if (incidencia.issueTypeId) {
            campos.push({ label: 'Issue Type ID', value: incidencia.issueTypeId });
        }
        if (incidencia.issueSubtypeId) {
            campos.push({ label: 'Issue Subtype ID', value: incidencia.issueSubtypeId });
        }
        if (incidencia.containerId) {
            campos.push({ label: 'Container ID', value: incidencia.containerId });
        }
        if (incidencia.issueTemplateId) {
            campos.push({ label: 'Template ID', value: incidencia.issueTemplateId });
        }
        if (incidencia.gpsCoordinates) {
            campos.push({ label: 'Coordenadas GPS', value: incidencia.gpsCoordinates });
        }
        if (incidencia.watchers?.length > 0) {
            campos.push({
                label: 'Observadores',
                value: incidencia.watchers.map((w: any) => w.name || w.id).join(', '),
            });
        }

        if (campos.length > 0) {
            y = PdfLabelValueComponent.drawMultiple(doc, y, campos, {
                labelWidth: 150,
                spacing: PdfLayoutConfig.SPACING_MD,
            });
        } else {
            PdfFontsConfig.applyTextStyle(doc, {
                size: PdfFontsConfig.FONT_SIZE_BASE,
                color: PdfFontsConfig.COLOR_GRAY,
            });
            doc.text('No hay otras referencias disponibles', PdfLayoutConfig.MARGIN_LEFT, y, {
                width: PdfLayoutConfig.USABLE_WIDTH,
            });
            y += PdfLayoutConfig.SPACING_MD;
        }

        return y;
    }
}
