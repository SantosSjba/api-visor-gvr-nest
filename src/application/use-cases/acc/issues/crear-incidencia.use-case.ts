import { Injectable, Inject } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearIncidenciaDto } from '../../../dtos/acc/issues/crear-incidencia.dto';
import { AUDITORIA_REPOSITORY, type IAuditoriaRepository } from '../../../../domain/repositories/auditoria.repository.interface';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class CrearIncidenciaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
        @Inject(AUDITORIA_REPOSITORY)
        private readonly auditoriaRepository: IAuditoriaRepository,
    ) { }

    async execute(
        userId: number,
        projectId: string,
        dto: CrearIncidenciaDto,
        ipAddress?: string,
        userAgent?: string,
        userRole?: string,
    ): Promise<any> {
        const accessToken = await this.obtenerTokenValidoHelper.execute(userId);

        // Transformar payload para ACC (similar a Laravel)
        const accPayload: Record<string, any> = {
            title: dto.title.substring(0, 100),
            description: dto.description.substring(0, 1000),
            status: dto.status || 'open',
            issueSubtypeId: dto.issueSubtypeId,
        };

        if (dto.dueDate) accPayload.dueDate = dto.dueDate;
        if (dto.assignedTo) accPayload.assignedTo = dto.assignedTo;
        if (dto.assignedToType) accPayload.assignedToType = dto.assignedToType;
        if (dto.rootCauseId) accPayload.rootCauseId = dto.rootCauseId;
        if (dto.startDate) accPayload.startDate = dto.startDate;
        if (dto.locationId) accPayload.locationId = dto.locationId;
        if (dto.locationDetails) accPayload.locationDetails = dto.locationDetails.substring(0, 250);

        // Construir linkedDocuments si hay documentUrn o itemId
        if (dto.documentUrn || dto.itemId) {
            let lineageUrn: string | null = null;

            if (dto.itemId) {
                let lineageId = dto.itemId;
                const match = lineageId.match(/urn:adsk\.wip[a-z0-9-]+:dm\.lineage:(.+)$/);
                if (match) {
                    lineageId = match[1];
                }
                lineageUrn = `urn:adsk.wipprod:dm.lineage:${lineageId}`;
            } else if (dto.documentUrn) {
                lineageUrn = this.convertirDerivativeUrnALineageUrn(dto.documentUrn);
            }

            if (lineageUrn) {
                const linkedDocument: any = {
                    type: 'TwoDVectorPushpin',
                    urn: lineageUrn,
                    createdAtVersion: 1,
                };

                const details: any = {};

                if (dto.pushpinPosition) {
                    const x = parseFloat(dto.pushpinPosition.x.toString());
                    const y = parseFloat(dto.pushpinPosition.y.toString());
                    const z = parseFloat(dto.pushpinPosition.z.toString());

                    if (!(x === 0 && y === 0 && z === 0)) {
                        details.position = { x, y, z };
                    }
                }

                if (dto.objectId !== null && dto.objectId !== undefined) {
                    details.objectId = parseInt(dto.objectId.toString());
                }

                if (dto.externalId) {
                    details.externalId = dto.externalId;
                }

                if (dto.viewableGuid) {
                    details.viewable = {
                        id: dto.viewableGuid,
                        viewableId: dto.viewableGuid,
                        guid: dto.viewableGuid,
                        name: dto.viewableName || '{3D}',
                        is3D: dto.is3D ?? true,
                    };
                }

                if (dto.viewerState) {
                    const simplifiedViewerState: any = {};
                    if (dto.documentUrn) {
                        simplifiedViewerState.seedURN = dto.documentUrn;
                    }
                    simplifiedViewerState.version = '2.0';
                    if (dto.viewerState.viewport) {
                        simplifiedViewerState.viewport = dto.viewerState.viewport;
                    }
                    if (dto.viewerState.objectSet) {
                        simplifiedViewerState.objectSet = dto.viewerState.objectSet;
                    }
                    if (dto.viewerState.renderOptions) {
                        simplifiedViewerState.renderOptions = dto.viewerState.renderOptions;
                    }

                    const viewerStateJson = JSON.stringify(simplifiedViewerState);
                    if (viewerStateJson.length < 30000) {
                        details.viewerState = simplifiedViewerState;
                    }
                }

                if (Object.keys(details).length > 0) {
                    if (details.position || details.objectId) {
                        linkedDocument.details = details;
                        accPayload.linkedDocuments = [linkedDocument];
                    }
                } else {
                    accPayload.linkedDocuments = [linkedDocument];
                }
            }
        }

        // 1. Manejo de Miniatura (Thumbnail) - Subir a OSS antes de crear la incidencia
        let thumbnailUrn: string | null = null;
        let thumbnailFilename = 'issue_thumbnail.png';

        if (dto.thumbnail && dto.thumbnail.startsWith('data:')) {
            try {
                // Extract content type and base64 data
                const matches = dto.thumbnail.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

                if (matches && matches.length === 3) {
                    const contentType = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');

                    // Determine extension
                    let extension = 'png';
                    if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
                    else if (contentType.includes('gif')) extension = 'gif';
                    else if (contentType.includes('webp')) extension = 'webp';

                    thumbnailFilename = `issue_thumbnail.${extension}`;

                    // Subir a S3 usando el helper en AutodeskApiService
                    const uploadResult = await this.autodeskApiService.subirMiniaturaIssue(
                        accessToken,
                        projectId,
                        buffer,
                        thumbnailFilename,
                        contentType
                    );

                    if (uploadResult.success && uploadResult.urn) {
                        thumbnailUrn = uploadResult.urn;
                    } else {
                        console.warn('Error subiendo miniatura:', uploadResult.error);
                    }
                }
            } catch (e) {
                // Log error but continue creating the issue
                console.error('Excepción al procesar miniatura:', e);
            }
        }

        // 2. Crear Incidencia
        const issue = await this.autodeskApiService.crearIncidencia(accessToken, projectId, accPayload);

        // 3. Adjuntar Miniatura si existe
        if (issue && issue.id && thumbnailUrn) {
            try {
                await this.autodeskApiService.crearAdjunto(accessToken, projectId, issue.id, {
                    urn: thumbnailUrn,
                    fileName: thumbnailFilename,
                    name: 'Thumbnail',
                    displayName: 'Thumbnail'
                });
            } catch (e) {
                console.error('Error adjuntando miniatura a la incidencia:', e);
            }
        }

        // 4. Registrar auditoría si la incidencia se creó exitosamente
        const issueId = issue?.id;
        if (issue && issueId && ipAddress && userAgent) {
            try {
                await this.auditoriaRepository.registrarAccion(
                    userId,
                    'ISSUE_CREATE',
                    'issue',
                    null, // No usar el ID de ACC como identidad porque es string
                    `Incidencia creada: ${dto.title.substring(0, 100)}`,
                    null,
                    {
                        issueId,
                        projectId,
                        title: dto.title.substring(0, 100),
                        status: dto.status || 'open',
                    },
                    ipAddress,
                    userAgent,
                    {
                        projectId,
                        accIssueId: issueId, // ID de la incidencia de ACC (string/UUID)
                        rol: userRole || null, // Rol del usuario al momento de crear la incidencia
                        // Guardar información del archivo vinculado si existe
                        itemId: dto.itemId || null,
                        documentUrn: dto.documentUrn || null,
                    },
                );
            } catch (error) {
                // No fallar la operación si la auditoría falla
            }
        }

        return issue;
    }

    private convertirDerivativeUrnALineageUrn(derivativeUrn: string): string | null {
        if (/^urn:adsk\.wip[a-z0-9-]+:dm\.lineage:/.test(derivativeUrn)) {
            return derivativeUrn;
        }

        let urn = derivativeUrn;
        let urnWithoutPrefix = urn;
        if (urn.startsWith('urn:')) {
            urnWithoutPrefix = urn.substring(4);
        }

        let decoded: string | null = null;
        try {
            decoded = Buffer.from(urnWithoutPrefix, 'base64').toString('utf-8');
            if (!decoded.startsWith('urn:')) {
                const base64Standard = urnWithoutPrefix.replace(/-/g, '+').replace(/_/g, '/');
                decoded = Buffer.from(base64Standard, 'base64').toString('utf-8');
            }
        } catch (e) {
            // Ignore
        }

        if (decoded && decoded.startsWith('urn:')) {
            urn = decoded;
        }

        const match = urn.match(/fs\.file:vf\.([^?&]+)/);
        if (match) {
            const lineageId = match[1];
            return `urn:adsk.wipprod:dm.lineage:${lineageId}`;
        }

        return null;
    }
}


