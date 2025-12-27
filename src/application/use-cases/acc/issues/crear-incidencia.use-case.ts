import { Injectable } from '@nestjs/common';
import { AutodeskApiService } from '../../../../infrastructure/services/autodesk-api.service';
import { CrearIncidenciaDto } from '../../../dtos/acc/issues/crear-incidencia.dto';
import ObtenerTokenValidoHelper from './obtener-token-valido.helper';

@Injectable()
export class CrearIncidenciaUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        private readonly obtenerTokenValidoHelper: ObtenerTokenValidoHelper,
    ) { }

    async execute(userId: number, projectId: string, dto: CrearIncidenciaDto): Promise<any> {
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

                if (dto.pushpinPosition && dto.pushpinPosition.x !== 0 && dto.pushpinPosition.y !== 0 && dto.pushpinPosition.z !== 0) {
                    details.position = {
                        x: parseFloat(dto.pushpinPosition.x.toString()),
                        y: parseFloat(dto.pushpinPosition.y.toString()),
                        z: parseFloat(dto.pushpinPosition.z.toString()),
                    };
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

        return await this.autodeskApiService.crearIncidencia(accessToken, projectId, accPayload);
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


