import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import archiver = require('archiver');
import axios from 'axios';
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
import { PdfDocumentService } from './pdf/pdf-document.service';
import { PdfCoverTemplate } from './pdf/templates/pdf-cover.template';
import { PdfIndexTemplate } from './pdf/templates/pdf-index.template';
import { PdfIssueDetailTemplate } from './pdf/templates/pdf-issue-detail.template';
import { PdfTextHelper } from './pdf/helpers/pdf-text.helper';
import { PdfLayoutConfig } from './pdf/layout/pdf-layout.config';

@Injectable()
export class ExportacionIncidenciasService {
    private nombreProyecto: string = 'Nombre de proyecto';
    private usuarioCreador: string = '';
    private emailCreador: string = '';
    private fechaCreacion: Date = new Date();
    private indiceIncidencias: Array<{ id: string; titulo: string; pagina: number }> = [];
    private tituloReporte: string = 'Detalle de la incidencia';

    constructor(
        private readonly obtenerIncidenciasUseCase: ObtenerIncidenciasUseCase,
        private readonly obtenerIncidenciaPorIdUseCase: ObtenerIncidenciaPorIdUseCase,
        private readonly obtenerComentariosUseCase: ObtenerComentariosUseCase,
        private readonly obtenerAdjuntosUseCase: ObtenerAdjuntosUseCase,
        private readonly obtenerPerfilUsuarioUseCase: ObtenerPerfilUsuarioUseCase,
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        private readonly configService: ConfigService,
        @Inject(USUARIOS_REPOSITORY)
        private readonly usuariosRepository: IUsuariosRepository,
    ) {}

    async exportarPDF(
        userId: number,
        projectId: string,
        dto: ExportarIncidenciasDto,
    ): Promise<Buffer> {
        try {
            // Inicializar variables
            this.fechaCreacion = new Date();
            this.indiceIncidencias = [];
            this.tituloReporte = dto.titulo || 'Detalle de la incidencia';

            // Obtener el nombre del proyecto desde Autodesk API
            await this.obtenerNombreProyecto(userId, projectId);

            // Obtener información del usuario
            await this.obtenerInformacionUsuario(userId, projectId, dto);

            // Crear servicio de documento PDF
            const pdfService = new PdfDocumentService({
                nombreProyecto: this.nombreProyecto,
                tituloReporte: this.tituloReporte,
                usuarioCreador: this.usuarioCreador,
                emailCreador: this.emailCreador,
                fechaCreacion: this.fechaCreacion,
            });

            const doc = pdfService.getDocument();

            // Obtener datos de incidencias
            const incidenciasCompletas = await this.obtenerIncidenciasCompletas(
                userId,
                projectId,
                dto,
            );

            // CUBIERTA
            if (dto.incluirCubierta) {
                PdfCoverTemplate.draw(doc, {
                    tituloReporte: this.tituloReporte,
                    fechaCreacion: this.fechaCreacion,
                    usuarioCreador: this.usuarioCreador,
                    totalIncidencias: incidenciasCompletas.length,
                    filtrosTexto: this.obtenerFiltrosTexto(dto),
                });
            }

            // ÍNDICE (reservar espacio, se llenará después)
            let paginaInicioIndice = 0;
            if (dto.incluirIndice) {
                // Si hay cubierta, agregar página nueva para el índice
                if (dto.incluirCubierta) {
                    doc.addPage();
                }
                paginaInicioIndice = doc.bufferedPageRange().count;
                // Reservar páginas para el índice
                const numPaginasIndice = Math.ceil(incidenciasCompletas.length / 25);
                for (let i = 0; i < numPaginasIndice - 1; i++) {
                    doc.addPage();
                }
            }

            // DETALLES DE INCIDENCIAS
            for (let i = 0; i < incidenciasCompletas.length; i++) {
                // Lógica para agregar página nueva:
                // - Si hay índice: SIEMPRE agregar página nueva antes de la primera incidencia
                //   (porque el índice ya está ocupando sus páginas reservadas)
                // - Si NO hay índice:
                //   * Si hay cubierta: agregar página nueva (después de cubierta)
                //   * Si NO hay cubierta: agregar página nueva
                // - Si NO es la primera incidencia (i > 0): siempre agregar página nueva
                const debeAgregarPagina =
                    i > 0 || // No es la primera incidencia
                    (i === 0 && dto.incluirIndice) || // Primera incidencia: hay índice (siempre nueva página después del índice)
                    (i === 0 && dto.incluirCubierta && !dto.incluirIndice) || // Primera incidencia: hay cubierta pero NO índice
                    (i === 0 && !dto.incluirCubierta && !dto.incluirIndice); // Primera incidencia: NO hay cubierta NI índice

                if (debeAgregarPagina) {
                    doc.addPage();
                }

                // Calcular el número de página actual (1-based)
                const pageRange = doc.bufferedPageRange();
                const paginaInicio = pageRange ? pageRange.count : 1;

                await PdfIssueDetailTemplate.draw(doc, {
                    incidencia: incidenciasCompletas[i],
                    usuarioCreador: this.usuarioCreador,
                    emailCreador: this.emailCreador,
                    incluirFotos: dto.incluirFotos ?? true,
                    tamañoFotos: (dto.tamañoFotos as 'normal' | 'small' | 'large') || 'normal',
                    incluirComentarios: dto.incluirComentarios ?? true,
                    incluirInformacionGeneralPlano: dto.incluirInformacionGeneralPlano ?? false,
                    incluirCamposPersonalizados: dto.incluirCamposPersonalizados ?? true,
                    incluirVinculosArchivo: dto.incluirVinculosArchivo ?? true,
                    incluirOtrasReferencias: dto.incluirOtrasReferencias ?? true,
                    downloadImageCallback: (uid, pid, issueId, adjunto) =>
                        this.descargarImagenAdjunto(uid, pid, issueId, adjunto),
                    userId,
                    projectId,
                });

                // Registrar en índice
                this.indiceIncidencias.push({
                    id: incidenciasCompletas[i].displayId || incidenciasCompletas[i].id,
                    titulo: incidenciasCompletas[i].title || 'Sin título',
                    pagina: paginaInicio,
                });
            }

            // Llenar índice si se solicitó
            if (dto.incluirIndice && paginaInicioIndice > 0) {
                const pageRange = doc.bufferedPageRange();
                if (pageRange && pageRange.count > 0) {
                    const paginaIndice = paginaInicioIndice - 1;
                    if (
                        paginaIndice >= pageRange.start &&
                        paginaIndice < pageRange.start + pageRange.count
                    ) {
                        doc.switchToPage(paginaIndice);
                        // Resetear posición Y para evitar superposiciones
                        doc.y = PdfLayoutConfig.MARGIN_TOP;
                        PdfIndexTemplate.draw(doc, this.indiceIncidencias);
                    }
                }
            }

            // Generar buffer final
            return await pdfService.generateBuffer();
        } catch (error) {
            throw error;
        }
    }

    private async obtenerNombreProyecto(userId: number, projectId: string): Promise<void> {
        try {
            const accessToken = await this.obtenerTokenValidoHelper.execute(userId);
            const hubsResponse = await this.autodeskApiService.obtenerHubs(accessToken);
            const hubs = hubsResponse.data || [];

            let nombreProyectoEncontrado = null;

            for (const hub of hubs) {
                try {
                    const projectsResponse = await this.autodeskApiService.obtenerProyectos(
                        accessToken,
                        hub.id,
                    );
                    const projects = projectsResponse.data || [];

                    const proyecto = projects.find((p: any) => {
                        const pId = p.id;
                        const containerId = p.attributes?.extension?.data?.containerId;
                        const cleanId = pId.startsWith('b.') ? pId.substring(2) : pId;
                        const cleanProjectId = projectId.startsWith('b.') ? projectId.substring(2) : projectId;

                        return (
                            containerId === projectId ||
                            cleanId === cleanProjectId ||
                            pId === projectId
                        );
                    });

                    if (proyecto) {
                        nombreProyectoEncontrado =
                            proyecto.attributes?.name || proyecto.attributes?.displayName || null;
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }

            if (!nombreProyectoEncontrado) {
                for (const hub of hubs) {
                    try {
                        const proyectoData = await this.autodeskApiService.obtenerProyectoPorId(
                            accessToken,
                            hub.id,
                            projectId,
                        );
                        if (proyectoData?.data) {
                            nombreProyectoEncontrado =
                                proyectoData.data.attributes?.name ||
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
    }

    private async obtenerInformacionUsuario(
        userId: number,
        projectId: string,
        dto: ExportarIncidenciasDto,
    ): Promise<void> {
        if (dto.usuarioNombre && dto.usuarioEmail) {
            this.usuarioCreador = dto.usuarioNombre;
            this.emailCreador = dto.usuarioEmail;
        } else {
            try {
                const perfilUsuario = await this.obtenerPerfilUsuarioUseCase.execute(userId, projectId);
                this.usuarioCreador =
                    perfilUsuario?.name || perfilUsuario?.displayName || 'Usuario de la sesion';
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
    }

    private async obtenerIncidenciasCompletas(
        userId: number,
        projectId: string,
        dto: ExportarIncidenciasDto,
    ): Promise<any[]> {
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
        return await Promise.all(
            incidencias.map(async (incidencia) => {
                try {
                    const [comentarios, adjuntos] = await Promise.all([
                        this.obtenerComentariosUseCase
                            .execute(userId, projectId, incidencia.id, {})
                            .catch(() => ({ data: [] })),
                        this.obtenerAdjuntosUseCase
                            .execute(userId, projectId, incidencia.id, {})
                            .catch(() => ({ data: [] })),
                    ]);

                    return {
                        ...incidencia,
                        comentarios: comentarios?.data || [],
                        adjuntos: adjuntos?.data || [],
                    };
                } catch (error) {
                    return { ...incidencia, comentarios: [], adjuntos: [] };
                }
            }),
        );
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
            if (adjunto.url || adjunto.downloadUrl || adjunto.download_url) {
                const url = adjunto.url || adjunto.downloadUrl || adjunto.download_url;
                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    timeout: 10000,
                });
                return Buffer.from(response.data);
            }

            // Si tiene un URN (storageUrn, snapshotUrn, urn, thumbnailUrn), intentar obtener la URL firmada
            const urn = adjunto.storageUrn || adjunto.snapshotUrn || adjunto.urn || adjunto.thumbnailUrn;
            if (urn) {
                const resultado = await this.autodeskApiService.obtenerUrlMiniatura(accessToken, urn);
                if (resultado.success && resultado.url) {
                    const response = await axios.get(resultado.url, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                    });
                    return Buffer.from(response.data);
                }
            }

            // Si tiene attachmentId, intentar obtener la URL de descarga desde el endpoint de attachments
            if (adjunto.attachmentId) {
                try {
                    const baseUrl = this.configService.get<string>('AUTODESK_API_BASE_URL') || 'https://developer.api.autodesk.com';
                    const normalizedProjectId = this.normalizarProjectId(projectId);
                    const downloadUrl = `${baseUrl}/construction/issues/v1/projects/${encodeURIComponent(normalizedProjectId)}/attachments/${encodeURIComponent(issueId)}/items/${encodeURIComponent(adjunto.attachmentId)}/download`;
                    
                    const response = await axios.get(downloadUrl, {
                        responseType: 'arraybuffer',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                        timeout: 10000,
                    });
                    return Buffer.from(response.data);
                } catch (error) {
                    // Si falla, continuar con otros métodos
                    console.warn('Error al descargar adjunto por attachmentId:', error);
                }
            }

            return null;
        } catch (error) {
            console.error('Error al descargar imagen adjunto:', error);
            return null;
        }
    }

    private normalizarProjectId(projectId: string): string {
        return projectId.startsWith('b.') ? projectId.substring(2) : projectId;
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
                comment: PdfTextHelper.procesarTextoComentario(c.comment || c.body || ''),
            })),
        };

        return JSON.stringify(markup, null, 2);
    }
}