export class Empresa {
    id: number;
    razonSocial: string;
    nombreComercial?: string;
    idTipoDocumento: number;
    nroDocumento: string;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    idUsuarioCreacion?: number;
    idUsuarioModificacion?: number;

    constructor(data: Partial<Empresa>) {
        Object.assign(this, data);
    }
}
