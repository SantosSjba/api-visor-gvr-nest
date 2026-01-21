import { Injectable, Inject } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import archiver = require('archiver');
import axios from 'axios';

type PDFDoc = InstanceType<typeof PDFDocument>;
import { ExportarIncidenciasDto } from '../../application/dtos/acc/issues/exportar-incidencias.dto';
import { ObtenerIncidenciasUseCase } from '../../application/use-cases/acc/issues/obtener-incidencias.use-case';
import { ObtenerIncidenciaPorIdUseCase } from '../../application/use-cases/acc/issues/obtener-incidencia-por-id.use-case';
import { ObtenerComentariosUseCase } from '../../application/use-cases/acc/issues/obtener-comentarios.use-case';
import { ObtenerAdjuntosUseCase } from '../../application/use-cases/acc/issues/obtener-adjuntos.use-case';
import { ObtenerPerfilUsuarioUseCase } from '../../application/use-cases/acc/issues/obtener-perfil-usuario.use-case';
import { AutodeskApiService } from './autodesk-api.service';
import ObtenerTokenValidoHelper from '../../application/use-cases/acc/issues/obtener-token-valido.helper';
import { USUARIOS_REPOSITORY } from '../../domain/repositories/usuarios.repository.interface';
import type { IUsuariosRepository } from '../../domain/repositories/usuarios.repository.interface';

@Injectable()
export class ExportacionIncidenciasService {
    private nombreProyecto: string = 'Nombre de proyecto';
    private usuarioCreador: string = '';
    private emailCreador: string = '';
    private fechaCreacion: Date = new Date();
    private totalPaginas: number = 0;
    private paginaActual: number = 0;
    private indiceIncidencias: Array<{ id: string; titulo: string; pagina: number }> = [];
    private tituloReporte: string = 'Detalle de la incidencia';
    private paginasReservadas: { cubierta: boolean; indice: number } = { cubierta: false, indice: 0 };

    constructor(
        private readonly obtenerIncidenciasUseCase: ObtenerIncidenciasUseCase,
        private readonly obtenerIncidenciaPorIdUseCase: ObtenerIncidenciaPorIdUseCase,
        private readonly obtenerComentariosUseCase: ObtenerComentariosUseCase,
        private readonly obtenerAdjuntosUseCase: ObtenerAdjuntosUseCase,
        private readonly obtenerPerfilUsuarioUseCase: ObtenerPerfilUsuarioUseCase,
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(USUARIOS_REPOSITORY)
        private readonly usuariosRepository: IUsuariosRepository,
    ) {}

    async exportarPDF(
        userId: number,
        projectId: string,
        dto: ExportarIncidenciasDto,
    ): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                // Inicializar variables
                this.fechaCreacion = new Date();
                this.indiceIncidencias = [];
                this.paginaActual = 0;
                this.totalPaginas = 0;
                this.tituloReporte = dto.titulo || 'Detalle de la incidencia';
                this.paginasReservadas = { cubierta: false, indice: 0 };
                
                // Obtener el nombre del proyecto desde Autodesk API usando el projectId de la URL
                try {
                    const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
                    
                    // Obtener todos los hubs y buscar el proyecto
                    const hubsResponse = await this.autodeskApiService.obtenerHubs(accessToken);
                    const hubs = hubsResponse.data || [];
                    
                    let nombreProyectoEncontrado = null;
                    
                    for (const hub of hubs) {
                        try {
                            const projectsResponse = await this.autodeskApiService.obtenerProyectos(accessToken, hub.id);
                            const projects = projectsResponse.data || [];
                            
                            // Buscar el proyecto por ID
                            const proyecto = projects.find((p: any) => {
                                const pId = p.id;
                                const containerId = p.attributes?.extension?.data?.containerId;
                                const cleanId = pId.startsWith('b.') ? pId.substring(2) : pId;
                                const cleanProjectId = projectId.startsWith('b.') ? projectId.substring(2) : projectId;
                                
                                return containerId === projectId || 
                                       cleanId === cleanProjectId || 
                                       pId === projectId;
                            });
                            
                            if (proyecto) {
                                nombreProyectoEncontrado = proyecto.attributes?.name || 
                                                           proyecto.attributes?.displayName || 
                                                           null;
                                break;
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                    
                    // Si no se encontró en la lista, intentar obtener directamente
                    if (!nombreProyectoEncontrado) {
                        for (const hub of hubs) {
                            try {
                                const proyectoData = await this.autodeskApiService.obtenerProyectoPorId(accessToken, hub.id, projectId);
                                if (proyectoData?.data) {
                                    nombreProyectoEncontrado = proyectoData.data.attributes?.name || 
                                                               proyectoData.data.attributes?.displayName || 
                                                               null;
                                    if (nombreProyectoEncontrado) break;
                                }
                            } catch (error) {
                                continue;
                            }
                        }
                    }
                    
                    this.nombreProyecto = nombreProyectoEncontrado || 'Nombre de proyecto';
                } catch (error) {
                    this.nombreProyecto = 'Nombre de proyecto';
                }

                // Obtener información del usuario
                // Priorizar información enviada desde el frontend
                if (dto.usuarioNombre && dto.usuarioEmail) {
                    this.usuarioCreador = dto.usuarioNombre;
                    this.emailCreador = dto.usuarioEmail;
                } else {
                    try {
                        const perfilUsuario = await this.obtenerPerfilUsuarioUseCase.execute(userId, projectId);
                        this.usuarioCreador = perfilUsuario?.name || perfilUsuario?.displayName || 'Usuario de la sesion';
                        this.emailCreador = perfilUsuario?.email || '';
                    } catch (error) {
                        try {
                            const usuarios = await this.usuariosRepository.obtenerUsuariosActivos();
                            const usuario = usuarios.find((u: any) => u.id === userId || u.idusuario === userId);
                            this.usuarioCreador = usuario?.nombre || usuario?.nombreusuario || 'Usuario de la sesion';
                            this.emailCreador = usuario?.email || '';
                        } catch (err) {
                            this.usuarioCreador = 'Usuario de la sesion';
                            this.emailCreador = '';
                        }
                    }
                }

                const doc = new PDFDocument({
                    size: 'A4',
                    margins: { top: 70, bottom: 50, left: 50, right: 50 },
                    bufferPages: true,
                });

                const chunks: Buffer[] = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const agregarHeaderFooter = (pageDoc: PDFDoc) => {
                    const oldX = pageDoc.x;
                    const oldY = pageDoc.y;
                    const oldTopMargin = pageDoc.page.margins.top;
                    const oldBottomMargin = pageDoc.page.margins.bottom;
                    
                    pageDoc.page.margins.top = 0;
                    pageDoc.page.margins.bottom = 0;
                    
                    const pageWidth = pageDoc.page.width;
                    const pageHeight = pageDoc.page.height;
                    const margin = 50;
                    const currentPage = doc.bufferedPageRange().count;

                    pageDoc.fontSize(9)
                        .fillColor('#666666')
                        .text(this.nombreProyecto || 'Nombre de proyecto', margin, 30, { width: pageWidth / 2 - margin });

                    pageDoc.fontSize(9)
                        .fillColor('#666666')
                        .text('Detalle de incidencia', pageWidth / 2, 30, {
                            width: pageWidth / 2 - margin,
                            align: 'right'
                        });

                    pageDoc.moveTo(margin, 50)
                        .lineTo(pageWidth - margin, 50)
                        .strokeColor('#CCCCCC')
                        .lineWidth(2)
                        .stroke();

                    const fechaFormateada = this.formatearFecha(this.fechaCreacion, true);
                    const nombreUsuario = this.usuarioCreador || 'usuario de la sesion';
                    const textoCreador = `Creado por ${nombreUsuario} con GVR PERUVIAN ENGINEERS el ${fechaFormateada}`;
                    const yTexto = pageHeight - 30;

                    pageDoc.moveTo(margin, pageHeight - 40)
                        .lineTo(pageWidth - margin, pageHeight - 40)
                        .strokeColor('#CCCCCC')
                        .lineWidth(2)
                        .stroke();

                    pageDoc.fontSize(7)
                        .fillColor('#666666')
                        .text(textoCreador, margin, yTexto, { width: pageWidth - 2 * margin - 100 });

                    const totalPages = this.totalPaginas || currentPage;
                    pageDoc.fontSize(7)
                        .fillColor('#666666')
                        .text(`Página ${currentPage} de ${totalPages}`, pageWidth - margin - 100, yTexto, {
                            width: 100,
                            align: 'right'
                        });

                    pageDoc.x = oldX;
                    pageDoc.y = oldY;
                    pageDoc.page.margins.top = oldTopMargin;
                    pageDoc.page.margins.bottom = oldBottomMargin;
                };

                agregarHeaderFooter(doc);

                doc.on('pageAdded', () => {
                    agregarHeaderFooter(doc);
                });

                // Obtener datos de incidencias
                let incidencias: any[] = [];

                if (dto.tipoReporte === 'issue_detail' && dto.issueId) {
                    try {
                        const incidencia = await this.obtenerIncidenciaPorIdUseCase.execute(
                            userId,
                            projectId,
                            dto.issueId,
                        );
                        if (incidencia) incidencias = [incidencia];
                    } catch (error) {
                        const resultado = await this.obtenerIncidenciasUseCase.execute(userId, projectId, {});
                        incidencias = this.extraerIncidencias(resultado);
                    }
                } else {
                    const filters: any = {};
                    if (dto.filter_status) filters.filter_status = dto.filter_status;
                    if (dto.filter_linkedDocumentUrn) filters.filter_linkedDocumentUrn = dto.filter_linkedDocumentUrn;

                    const resultado = await this.obtenerIncidenciasUseCase.execute(userId, projectId, filters);
                    incidencias = this.extraerIncidencias(resultado);
                }

                // Ordenar por ID descendente
                incidencias.sort((a, b) => {
                    const idA = parseInt(a.displayId || a.id || '0');
                    const idB = parseInt(b.displayId || b.id || '0');
                    return idB - idA;
                });

                // Obtener información completa de cada incidencia
                const incidenciasCompletas = await Promise.all(
                    incidencias.map(async (incidencia) => {
                        try {
                            const [comentarios, adjuntos] = await Promise.all([
                                this.obtenerComentariosUseCase.execute(userId, projectId, incidencia.id, {}).catch(() => ({ data: [] })),
                                this.obtenerAdjuntosUseCase.execute(userId, projectId, incidencia.id, {}).catch(() => ({ data: [] })),
                            ]);

                            return {
                                ...incidencia,
                                comentarios: comentarios?.data || [],
                                adjuntos: adjuntos?.data || [],
                            };
                        } catch (error) {
                            return { ...incidencia, comentarios: [], adjuntos: [] };
                        }
                    })
                );

                // CUBIERTA (Página 1)
                if (dto.incluirCubierta) {
                    this.paginaActual = 1;
                    this.paginasReservadas.cubierta = true;
                    this.agregarCubierta(doc, dto, incidencias.length);
                }

                // ÍNDICE (Página 2)
                if (dto.incluirIndice) {
                    if (!this.paginasReservadas.cubierta) {
                        this.paginaActual = 1;
                    } else {
                        doc.addPage();
                        this.paginaActual++;
                    }
                    this.paginasReservadas.indice = this.paginaActual;
                    // Reservar espacio para el índice (lo llenaremos después)
                    const numPaginasIndice = Math.ceil(incidenciasCompletas.length / 25); // ~25 items por página
                    for (let i = 0; i < numPaginasIndice - 1; i++) {
                        doc.addPage();
                        this.paginaActual++;
                    }
                }

                // DETALLES DE INCIDENCIAS
                for (let i = 0; i < incidenciasCompletas.length; i++) {
                    if (i === 0 && !this.paginasReservadas.cubierta && !this.paginasReservadas.indice) {
                        this.paginaActual = 1;
                    } else {
                        doc.addPage();
                        this.paginaActual++;
                    }
                    
                    const paginaInicio = this.paginaActual;
                    await this.agregarDetalleIncidencia(doc, incidenciasCompletas[i], dto, userId, projectId);
                    
                    // Registrar en índice
                    this.indiceIncidencias.push({
                        id: incidenciasCompletas[i].displayId || incidenciasCompletas[i].id,
                        titulo: incidenciasCompletas[i].title || 'Sin título',
                        pagina: paginaInicio,
                    });
                }

                this.totalPaginas = this.paginaActual;

                if (dto.incluirIndice && this.paginasReservadas.indice > 0) {
                    const pageRange = doc.bufferedPageRange();
                    if (pageRange && pageRange.count > 0) {
                        const paginaInicioIndice = this.paginasReservadas.indice - 1;
                        if (paginaInicioIndice >= pageRange.start && paginaInicioIndice < pageRange.start + pageRange.count) {
                            doc.switchToPage(paginaInicioIndice);
                            this.agregarIndiceReal(doc);
                        }
                    }
                }

                const finalPageRange = doc.bufferedPageRange();
                if (finalPageRange && finalPageRange.count > 0) {
                    for (let i = finalPageRange.start; i < finalPageRange.start + finalPageRange.count; i++) {
                        doc.switchToPage(i);
                        const oldX = doc.x;
                        const oldY = doc.y;
                        const pageWidth = doc.page.width;
                        const pageHeight = doc.page.height;
                        const margin = 50;
                        const oldBottomMargin = doc.page.margins.bottom;
                        
                        doc.page.margins.bottom = 0;
                        const yTexto = pageHeight - 30;
                        
                        doc.rect(pageWidth - margin - 100, yTexto - 2, 100, 10)
                            .fillColor('#FFFFFF')
                            .fill();
                        
                        doc.fontSize(7)
                            .fillColor('#666666')
                            .text(`Página ${i + 1} de ${this.totalPaginas}`, pageWidth - margin - 100, yTexto, {
                                width: 100,
                                align: 'right'
                            });
                        
                        doc.x = oldX;
                        doc.y = oldY;
                        doc.page.margins.bottom = oldBottomMargin;
                    }
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }


    private agregarCubierta(doc: PDFDoc, dto: ExportarIncidenciasDto, totalIncidencias: number) {
        const pageWidth = doc.page.width;
        const margin = 50;
        let y = 100;

        // Título principal (tamaño pequeño como en ACC)
        doc.fontSize(11)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text(this.tituloReporte, margin, y, {
                width: pageWidth - 2 * margin,
            });

        y += 40;

        // Subtítulo
        doc.fontSize(11)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Detalle de la incidencia', margin, y, {
                width: pageWidth - 2 * margin,
            });

        y += 60;

        // Información de creación
        const fechaFormateada = this.formatearFecha(this.fechaCreacion, true);

        const infoItems = [
            { label: 'Creado el', value: fechaFormateada },
            { label: 'Creado por', value: `${this.usuarioCreador}` },
            { label: 'Elementos totales', value: totalIncidencias.toString() },
            { label: 'Ordenado por', value: 'ID (Descendente)' },
            { label: 'Filtrado por', value: this.obtenerFiltrosTexto(dto) },
        ];

        doc.fontSize(10).fillColor('#000000').font('Helvetica');

        infoItems.forEach((item) => {
            // Línea separadora
            doc.moveTo(margin, y)
                .lineTo(pageWidth - margin, y)
                .strokeColor('#DDDDDD')
                .lineWidth(0.5)
                .stroke();

            y += 12;

            // Label
            doc.text(item.label, margin, y, { width: 150, continued: false });

            // Valor
            doc.text(item.value, margin + 150, y, { width: pageWidth - 2 * margin - 150 });

            y += 25;
        });

        // Línea final
        doc.moveTo(margin, y)
            .lineTo(pageWidth - margin, y)
            .strokeColor('#DDDDDD')
            .lineWidth(0.5)
            .stroke();
    }

    private agregarIndiceReal(doc: PDFDoc) {
        const pageWidth = doc.page.width;
        const margin = 50;
        let y = 80;

        // Título
        doc.fontSize(14)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Contenido', margin, y, { width: pageWidth - 2 * margin });

        y += 40;
        doc.fontSize(10).fillColor('#000000').font('Helvetica');

        const indiceOrdenado = [...this.indiceIncidencias].sort((a, b) => {
            const idA = parseInt(a.id || '0');
            const idB = parseInt(b.id || '0');
            return idB - idA;
        });

        indiceOrdenado.forEach((item) => {
            // Verificar si necesitamos nueva página
            if (y > doc.page.height - 100) {
                doc.addPage();
                y = 80;
            }

            const texto = `#${item.id}: ${item.titulo}`;
            const pagina = item.pagina.toString();

            // Calcular anchos
            const anchoTexto = doc.widthOfString(texto);
            const anchoPagina = doc.widthOfString(pagina);
            const anchoPunto = doc.widthOfString('.');
            const espacioTotal = pageWidth - 2 * margin;
            const espacioEntre = espacioTotal - anchoTexto - anchoPagina - 10; // 10px de margen entre puntos y número
            
            // Calcular número de puntos que caben
            const numPuntos = Math.max(0, Math.floor(espacioEntre / anchoPunto));
            const puntos = '.'.repeat(numPuntos);

            // Dibujar texto a la izquierda
            doc.fillColor('#000000')
                .text(texto, margin, y);

            // Dibujar puntos en el medio
            const xPuntos = margin + anchoTexto + 5;
            doc.fillColor('#000000')
                .text(puntos, xPuntos, y);

            // Dibujar número de página a la derecha
            const xPagina = pageWidth - margin - anchoPagina;
            doc.text(pagina, xPagina, y);

            y += 20;
        });
    }

    private async agregarDetalleIncidencia(
        doc: PDFDoc,
        incidencia: any,
        dto: ExportarIncidenciasDto,
        userId: number,
        projectId: string,
    ) {
        const pageWidth = doc.page.width;
        const margin = 50;
        let y = 80;

        // Título de la sección
        doc.fontSize(14)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Detalle de la incidencia', margin, y, { width: pageWidth - 2 * margin });

        y += 40;

        // ID y título de la incidencia
        const id = incidencia.displayId || incidencia.id;
        const titulo = incidencia.title || 'Sin título';

        doc.fontSize(12)
            .fillColor('#0066CC')
            .font('Helvetica-Bold')
            .text(`#${id}: ${titulo}`, margin, y, { width: pageWidth - 2 * margin });

        y += 40;

        // Sección "Campos estándar"
        doc.fontSize(11)
            .fillColor('#000000')
            .font('Helvetica-Bold')
            .text('Campos estándar', margin, y, { width: pageWidth - 2 * margin });

        y += 30;

        // Campos
        const campos = this.obtenerCamposEstandar(incidencia);
        
        campos.forEach((campo) => {
            // Verificar espacio
            if (y > doc.page.height - 100) {
                doc.addPage();
                this.paginaActual++;
                y = 80;
            }

            // Línea separadora
            doc.moveTo(margin, y)
                .lineTo(pageWidth - margin, y)
                .strokeColor('#EEEEEE')
                .lineWidth(0.5)
                .stroke();

            y += 10;

            // Label
            doc.fontSize(10)
                .fillColor('#000000')
                .font('Helvetica')
                .text(campo.label, margin, y, { width: 150 });

            // Valor con formato especial
            if (campo.tipo === 'estado') {
                // Barra vertical de color
                doc.rect(margin + 150, y - 2, 3, 14)
                    .fillColor('#FF9500')
                    .fill();
                
                doc.fillColor('#000000')
                    .text(campo.value, margin + 160, y, { width: pageWidth - margin - 160 });
            } else if (campo.tipo === 'tipo') {
                // Círculo con letra
                const circuloX = margin + 150;
                const circuloY = y + 5;
                
                doc.circle(circuloX + 8, circuloY, 8)
                    .fillColor('#FF9500')
                    .fill();
                
                doc.fillColor('#FFFFFF')
                    .fontSize(8)
                    .font('Helvetica-Bold')
                    .text(campo.icono || 'D', circuloX + 4, circuloY - 4, { width: 8, align: 'center' });
                
                doc.fillColor('#000000')
                    .fontSize(10)
                    .font('Helvetica')
                    .text(campo.value, margin + 175, y, { width: pageWidth - margin - 175 });
            } else if (campo.tipo === 'posicion') {
                // Texto en azul
                doc.fillColor('#0066CC')
                    .text(campo.value, margin + 150, y, { width: pageWidth - margin - 150 });
            } else {
                // Valor normal
                doc.fillColor('#000000')
                    .text(campo.value, margin + 150, y, { width: pageWidth - margin - 150 });
            }

            y += 25;
        });

        // Referencias y archivos adjuntos
        if (dto.incluirFotos) {
            const adjuntos = incidencia.adjuntos || [];
            const fotos = adjuntos.filter((a: any) => a.type === 'photo' || a.mimeType?.startsWith('image/'));

            if (fotos.length > 0) {
                y += 30;

                if (y > doc.page.height - 200) {
                    doc.addPage();
                    this.paginaActual++;
                    y = 80;
                }

                doc.fontSize(11)
                    .fillColor('#000000')
                    .font('Helvetica-Bold')
                    .text('Referencias y archivos adjuntos', margin, y, { width: pageWidth - 2 * margin });

                y += 30;

                doc.fontSize(10)
                    .font('Helvetica')
                    .text(`Fotos (${fotos.length})`, margin, y, { width: pageWidth - 2 * margin });

                y += 25;

                // Mostrar fotos
                const anchoFoto = 200;
                const altoFoto = 150;

                for (let i = 0; i < fotos.length; i++) {
                    if (y + altoFoto + 100 > doc.page.height - 100) {
                        doc.addPage();
                        this.paginaActual++;
                        y = 80;
                    }

                    try {
                        const imagenBuffer = await this.descargarImagenAdjunto(userId, projectId, incidencia.id, fotos[i]);

                        if (imagenBuffer) {
                            doc.image(imagenBuffer, margin, y, {
                                width: anchoFoto,
                                height: altoFoto,
                                fit: [anchoFoto, altoFoto],
                            });
                        } else {
                            // Placeholder
                            doc.rect(margin, y, anchoFoto, altoFoto)
                                .strokeColor('#CCCCCC')
                                .stroke();
                        }
                    } catch (error) {
                        // Placeholder
                        doc.rect(margin, y, anchoFoto, altoFoto)
                            .strokeColor('#CCCCCC')
                            .stroke();
                    }

                    // Metadatos
                    const yMeta = y + altoFoto + 10;
                    const nombreFoto = fotos[i].name || 'Thumbnail';
                    
                    doc.fontSize(9)
                        .fillColor('#000000')
                        .font('Helvetica')
                        .text(nombreFoto, margin, yMeta);

                    doc.font('Helvetica-Bold')
                        .text('Se ha añadido como Archivo adjunto', margin, yMeta + 12);

                    const fechaAdjunto = fotos[i].createdAt
                        ? this.formatearFecha(new Date(fotos[i].createdAt), true)
                        : '';

                    if (fechaAdjunto) {
                        doc.font('Helvetica')
                            .fillColor('#666666')
                            .fontSize(8)
                            .text(`Añadida el ${fechaAdjunto}`, margin, yMeta + 24);
                    }

                    const creador = fotos[i].createdByReal || fotos[i].createdBy || this.usuarioCreador;
                    doc.text(`Añadida por ${creador}`, margin, yMeta + 36);

                    y += altoFoto + 80;
                }
            }
        }

        // Comentarios
        if (dto.incluirComentarios && incidencia.comentarios && incidencia.comentarios.length > 0) {
            y += 30;

            if (y > doc.page.height - 150) {
                doc.addPage();
                this.paginaActual++;
                y = 80;
            }

            doc.fontSize(11)
                .fillColor('#000000')
                .font('Helvetica-Bold')
                .text('Comentarios', margin, y, { width: pageWidth - 2 * margin });

            y += 30;

            incidencia.comentarios.forEach((comentario: any) => {
                if (y > doc.page.height - 120) {
                    doc.addPage();
                    this.paginaActual++;
                    y = 80;
                }

                const creador = comentario.createdByReal || comentario.createdBy || this.usuarioCreador;
                const fechaComentario = comentario.createdAt
                    ? this.formatearFecha(new Date(comentario.createdAt), true)
                    : '';

                // Nombre y fecha
                doc.fontSize(9)
                    .fillColor('#000000')
                    .font('Helvetica-Bold')
                    .text(creador, margin, y);

                doc.font('Helvetica')
                    .fillColor('#666666')
                    .fontSize(8)
                    .text(fechaComentario, margin, y + 12);

                y += 30;

                // Texto del comentario
                const textoComentario = this.procesarTextoComentario(comentario.comment || comentario.body || '');
                
                doc.fontSize(9)
                    .fillColor('#000000')
                    .font('Helvetica')
                    .text(textoComentario, margin, y, { width: pageWidth - 2 * margin });

                const alturaComentario = doc.heightOfString(textoComentario, { width: pageWidth - 2 * margin });
                y += alturaComentario + 20;

                // Línea separadora
                doc.moveTo(margin, y)
                    .lineTo(pageWidth - margin, y)
                    .strokeColor('#EEEEEE')
                    .lineWidth(0.5)
                    .stroke();

                y += 15;
            });
        }
    }

    private obtenerCamposEstandar(incidencia: any): Array<{ label: string; value: string; tipo?: string; icono?: string }> {
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
        const asignadoA = incidencia.assignedToRealMultiple?.map((u: any) => u.usuario).join(', ') || 
                         incidencia.assignedToReal || '—';
        campos.push({ label: 'Asignado a', value: asignadoA });

        // Creado por
        const creadoPor = `${incidencia.createdByReal || this.usuarioCreador} (${this.emailCreador})`;
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
            const diasTarde = Math.floor((new Date().getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
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
        const posicion = incidencia.linkedDocuments?.[0]?.details?.viewable?.name || 
                        incidencia.linkedDocuments?.[0]?.urn?.split('/').pop() || 
                        'MODELO FEDERADO - HOTEL 2025.nwd';
        campos.push({ label: 'Posición', value: posicion, tipo: 'posicion' });

        // Causa principal
        campos.push({ label: 'Causa principal', value: incidencia.rootCauseId || '—' });

        return campos;
    }

    private getStatusLabel(status: string): string {
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

    private procesarTextoComentario(texto: string): string {
        // Eliminar marcadores de firma GVR
        texto = texto.replace(/---?FIRMA_GVR---?/gi, '');
        texto = texto.replace(/<---?FIRMA_GVR---?>/gi, '');
        texto = texto.replace(/---?FIN_FIRMA_GVR---?/gi, '');
        texto = texto.replace(/<---?FIN_FIRMA_GVR---?>/gi, '');
        // Limpiar espacios múltiples
        texto = texto.replace(/\s+/g, ' ').trim();
        return texto;
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
            
            // Obtener zona horaria
            const timeZoneOffset = -fecha.getTimezoneOffset() / 60;
            const timeZoneSign = timeZoneOffset >= 0 ? '+' : '-';
            const timeZoneHours = Math.abs(timeZoneOffset).toString().padStart(2, '0');
            const timeZone = `UTC${timeZoneSign}${timeZoneHours}:00`;

            fechaFormateada += `, ${hora}:${minutos} ${timeZone}`;
        }

        return fechaFormateada;
    }

    private obtenerFiltrosTexto(dto: ExportarIncidenciasDto): string {
        const filtros: string[] = [];
        if (dto.filter_status) {
            const estados = Array.isArray(dto.filter_status) ? dto.filter_status : [dto.filter_status];
            const estadosTexto = estados.map(e => this.getStatusLabel(e)).join(', ');
            filtros.push(`Estado (${estadosTexto})`);
        }
        if (dto.filter_linkedDocumentUrn) {
            filtros.push('Documento vinculado');
        }
        return filtros.length > 0 ? filtros.join(', ') : 'Ninguno';
    }

    private extraerIncidencias(resultado: any): any[] {
        if (resultado?.data?.results) {
            return resultado.data.results;
        } else if (resultado?.results) {
            return resultado.results;
        } else if (Array.isArray(resultado?.data)) {
            return resultado.data;
        } else if (Array.isArray(resultado)) {
            return resultado;
        }
        return [];
    }

    private async descargarImagenAdjunto(
        userId: number,
        projectId: string,
        issueId: string,
        adjunto: any,
    ): Promise<Buffer | null> {
        try {
            const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
            
            // Si el adjunto tiene una URL directa
            if (adjunto.url) {
                const response = await axios.get(adjunto.url, {
                    responseType: 'arraybuffer',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    timeout: 10000,
                });
                return Buffer.from(response.data);
            }

            // Si tiene un URN, intentar obtener la URL firmada
            if (adjunto.urn || adjunto.snapshotUrn) {
                const urn = adjunto.urn || adjunto.snapshotUrn;
                const resultado = await this.autodeskApiService.obtenerUrlMiniatura(accessToken, urn);
                if (resultado.success && resultado.url) {
                    const response = await axios.get(resultado.url, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                    });
                    return Buffer.from(response.data);
                }
            }

            return null;
        } catch (error) {
            console.error('Error al descargar imagen adjunto:', error);
            return null;
        }
    }

    async exportarBCF(
        userId: number,
        projectId: string,
        dto: ExportarIncidenciasDto,
    ): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            try {
                let incidencias: any[] = [];

                if (dto.tipoReporte === 'issue_detail' && dto.issueId) {
                    const incidencia = await this.obtenerIncidenciaPorIdUseCase.execute(
                        userId,
                        projectId,
                        dto.issueId,
                    );
                    if (incidencia) {
                        incidencias = [incidencia];
                    }
                } else {
                    const filters: any = {};
                    if (dto.filter_status) {
                        filters.filter_status = dto.filter_status;
                    }
                    if (dto.filter_linkedDocumentUrn) {
                        filters.filter_linkedDocumentUrn = dto.filter_linkedDocumentUrn;
                    }

                    const resultado = await this.obtenerIncidenciasUseCase.execute(
                        userId,
                        projectId,
                        filters,
                    );
                    incidencias = this.extraerIncidencias(resultado);
                }

                const archive = archiver('zip', { zlib: { level: 9 } });
                const chunks: Buffer[] = [];

                archive.on('data', (chunk) => chunks.push(chunk));
                archive.on('end', () => resolve(Buffer.concat(chunks)));
                archive.on('error', reject);

                // Archivo de versión BCF
                archive.append('2.1', { name: 'bcf.version' });

                // Generar markup para cada incidencia
                incidencias.forEach((incidencia) => {
                    const topicId = incidencia.id || `topic-${Date.now()}`;
                    const topicDir = `${topicId}/`;

                    const markup = this.generarMarkupBCF(incidencia);
                    archive.append(markup, { name: `${topicDir}markup.bcf` });
                });

                archive.finalize();
            } catch (error) {
                reject(error);
            }
        });
    }

    private generarMarkupBCF(incidencia: any): string {
        const topicId = incidencia.id || `topic-${Date.now()}`;
        const markup = {
            topic: {
                guid: topicId,
                title: incidencia.title || 'Sin título',
                creationDate: incidencia.createdAt || new Date().toISOString(),
                modifiedDate: incidencia.updatedAt || new Date().toISOString(),
                description: incidencia.description || '',
                topicStatus: incidencia.status || 'open',
                topicType: incidencia.issueTypeId || 'Design',
                assignedTo: incidencia.assignedToReal || '',
            },
            comment: (incidencia.comentarios || []).map((c: any) => ({
                guid: c.id || `comment-${Date.now()}`,
                date: c.createdAt || new Date().toISOString(),
                author: c.createdByReal || c.createdBy || '',
                comment: this.procesarTextoComentario(c.comment || c.body || ''),
            })),
        };

        return JSON.stringify(markup, null, 2);
    }
}