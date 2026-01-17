import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../../domain/repositories/acc.repository.interface';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';

@Injectable()
export class ObtenerActividadesArchivoUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(userId: number, projectId: string, itemId: string): Promise<any> {
        try {
            // Validar parámetros
            if (!projectId) {
                throw new Error('El ID del proyecto es requerido');
            }
            if (!itemId) {
                throw new Error('El ID del item es requerido');
            }

            // Obtener token de acceso
            const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

            if (!token) {
                throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
            }

            if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
                throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
            }

            // Remover el prefijo "b." si existe, ya que obtenerVersionesItem lo agrega automáticamente
            const cleanProjectId = projectId.startsWith('b.') ? projectId.substring(2) : projectId;

            // Obtener información del item para tener más contexto (opcional)
            let itemInfo = null;
            try {
                const itemResponse = await this.autodeskApiService.obtenerItemPorId(
                    token.tokenAcceso,
                    cleanProjectId,
                    itemId,
                );
                itemInfo = itemResponse?.data || null;
            } catch (error) {
                // Si falla obtener el item, continuamos solo con versiones
                // Esto es opcional, no es crítico para obtener las actividades
            }

            // Obtener las versiones del archivo desde Autodesk API
            // Este endpoint SÍ existe: GET /data/v1/projects/{project_id}/items/{item_id}/versions
            // Devuelve el historial de versiones del archivo con información de creación y modificación
            const versionesResponse = await this.autodeskApiService.obtenerVersionesItem(
                token.tokenAcceso,
                cleanProjectId,
                itemId,
            );

            if (!versionesResponse) {
                throw new Error('No se recibió respuesta de Autodesk API');
            }

            const versiones = versionesResponse.data || [];

            if (versiones.length === 0) {
                // Si no hay versiones, retornar estructura vacía
                return {
                    actividades: {
                        ultimos7Dias: { actividades: [], total: 0 },
                        ultimos30Dias: { actividades: [], total: 0 },
                        anteriores: { actividades: [], total: 0 },
                    },
                    total: 0,
                };
            }

            // Obtener auditorías del archivo desde la base de datos
            let auditorias: any[] = [];
            try {
                auditorias = await this.auditoriaRepository.obtenerAuditoriasPorItemId(itemId);
            } catch (error) {
                // Si falla obtener auditorías, continuamos solo con versiones
                console.warn('No se pudieron obtener auditorías del archivo:', error);
            }

            // Transformar las versiones en actividades
            const actividadesVersiones = this.transformarVersionesEnActividades(versiones, itemInfo);

            // Transformar las auditorías en actividades
            const actividadesAuditoria = this.transformarAuditoriasEnActividades(auditorias, itemId);

            // Combinar y ordenar todas las actividades por fecha
            const todasLasActividades = [...actividadesVersiones, ...actividadesAuditoria].sort(
                (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
            );

            // Agrupar actividades por período de tiempo
            const actividadesAgrupadas = this.agruparActividadesPorPeriodo(todasLasActividades);

            return {
                actividades: actividadesAgrupadas,
                total: todasLasActividades.length,
            };
        } catch (error: any) {
            // Si es un error de autorización, relanzarlo
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            // Para otros errores, lanzar una excepción más descriptiva
            throw new Error(
                `Error al obtener actividades del archivo: ${error.message || 'Error desconocido'}`,
            );
        }
    }

    /**
     * Transforma las versiones del archivo en actividades
     */
    private transformarVersionesEnActividades(versiones: any[], itemInfo: any = null): any[] {
        const actividades: any[] = [];

        versiones.forEach((version) => {
            const attributes = version.attributes || {};
            const createTime = attributes.createTime;
            const lastModifiedTime = attributes.lastModifiedTime;
            const createUserName = attributes.createUserName || 'Usuario desconocido';
            const lastModifiedUserName = attributes.lastModifiedUserName || createUserName;
            const versionNumber = attributes.versionNumber || 1;
            const displayName = attributes.name || attributes.displayName || 'Archivo';

            // Actividad: Creación de versión
            if (createTime) {
                actividades.push({
                    id: `${version.id}-created`,
                    tipo: 'version_created',
                    accion: 'Creó una nueva versión',
                    descripcion: `${createUserName} ha creado la versión ${versionNumber} de este archivo en la carpeta actual.`,
                    usuario: createUserName,
                    fecha: createTime,
                    versionNumber: versionNumber,
                    versionId: version.id,
                });
            }

            // Actividad: Modificación de versión (solo si es diferente de la creación)
            if (lastModifiedTime && lastModifiedTime !== createTime && lastModifiedUserName) {
                actividades.push({
                    id: `${version.id}-modified`,
                    tipo: 'version_modified',
                    accion: 'Modificó la versión',
                    descripcion: `${lastModifiedUserName} ha modificado la versión ${versionNumber} de este archivo en la carpeta actual.`,
                    usuario: lastModifiedUserName,
                    fecha: lastModifiedTime,
                    versionNumber: versionNumber,
                    versionId: version.id,
                });
            }
        });

        // Ordenar por fecha descendente (más reciente primero)
        return actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    /**
     * Transforma las auditorías en actividades
     */
    private transformarAuditoriasEnActividades(auditorias: any[], itemId?: string): any[] {
        const actividades: any[] = [];

        auditorias.forEach((auditoria) => {
            const usuario = auditoria.usuario || 'Usuario desconocido';
            const fecha = auditoria.fechacreacion;
            const accion = auditoria.accion;
            const descripcion = auditoria.descripcion || '';
            const metadatos = auditoria.metadatos || {};
            const fileName = metadatos.fileName || metadatos.accItemId || 'archivo';

            let tipoActividad = '';
            let descripcionActividad = '';

            switch (accion) {
                case 'FILE_DOWNLOAD':
                    tipoActividad = 'file_download';
                    descripcionActividad = `${usuario} ha descargado este archivo.`;
                    break;
                case 'FILE_UPLOAD':
                    tipoActividad = 'file_upload';
                    descripcionActividad = `${usuario} ha subido este archivo.`;
                    break;
                case 'FILE_UPDATE':
                    tipoActividad = 'file_update';
                    descripcionActividad = `${usuario} ha actualizado este archivo.`;
                    break;
                case 'FILE_DELETE':
                    tipoActividad = 'file_delete';
                    descripcionActividad = `${usuario} ha eliminado este archivo.`;
                    break;
                case 'FILE_VIEW':
                    tipoActividad = 'file_view';
                    descripcionActividad = `${usuario} ha visto este archivo.`;
                    break;
                case 'FILE_MOVE':
                    tipoActividad = 'file_move';
                    // Usar la descripción de la auditoría que ya contiene los detalles del movimiento
                    descripcionActividad = descripcion || `${usuario} ha movido este archivo.`;
                    break;
                case 'ISSUE_CREATE':
                    // Verificar si la incidencia está vinculada a este archivo
                    const issueMetadatos = metadatos || {};
                    const datosNuevos = auditoria.datos_nuevos || {};
                    const itemIdEnMetadatos = issueMetadatos.itemId || datosNuevos.itemId;
                    const linkedDocUrn = issueMetadatos.linkedDocumentUrn || issueMetadatos.documentUrn || datosNuevos.documentUrn;
                    
                    // Si la incidencia está relacionada con este archivo
                    if (itemIdEnMetadatos === itemId || (linkedDocUrn && linkedDocUrn.includes(itemId))) {
                        tipoActividad = 'issue_created';
                        const issueTitle = issueMetadatos.title || datosNuevos.title || 'una incidencia';
                        descripcionActividad = `${usuario} ha añadido una incidencia a este archivo en la carpeta actual.`;
                    } else {
                        // Si no está relacionada con este archivo, no incluirla
                        return null;
                    }
                    break;
                default:
                    tipoActividad = 'file_action';
                    descripcionActividad = descripcion || `${usuario} ha realizado una acción en este archivo.`;
                    break;
            }

            // Solo agregar si la actividad es válida (no null)
            if (tipoActividad) {
                actividades.push({
                    id: `audit-${auditoria.id}`,
                    tipo: tipoActividad,
                    accion: accion,
                    descripcion: descripcionActividad,
                    usuario: usuario,
                    fecha: fecha,
                    auditoriaId: auditoria.id,
                    metadatos: metadatos,
                });
            }
        });

        // Filtrar nulls
        return actividades.filter(a => a !== null);
    }

    /**
     * Agrupa las actividades por período de tiempo (Últimos 7 días, Últimos 30 días, etc.)
     */
    private agruparActividadesPorPeriodo(actividades: any[]): any {
        const ahora = new Date();
        const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

        const ultimos7Dias: any[] = [];
        const ultimos30Dias: any[] = [];
        const anteriores: any[] = [];

        actividades.forEach((actividad) => {
            const fechaActividad = new Date(actividad.fecha);

            if (fechaActividad >= hace7Dias) {
                ultimos7Dias.push(actividad);
            } else if (fechaActividad >= hace30Dias) {
                ultimos30Dias.push(actividad);
            } else {
                anteriores.push(actividad);
            }
        });

        return {
            ultimos7Dias: {
                actividades: ultimos7Dias,
                total: ultimos7Dias.length,
            },
            ultimos30Dias: {
                actividades: ultimos30Dias,
                total: ultimos30Dias.length,
            },
            anteriores: {
                actividades: anteriores,
                total: anteriores.length,
            },
        };
    }
}
