export class Proyecto {
    id: number;
    nombreProyecto: string;
    nroProyecto: string;
    idTipoProyecto: number;
    idPais: number;
    direccion1?: string;
    direccion2?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    idZonaHoraria?: number;
    fechaInicio?: Date;
    fechaFinalizacion?: Date;
    valorProyecto?: number;
    idTipoMoneda?: number;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    idUsuarioCreacion?: number;
    idUsuarioModificacion?: number;

    constructor(data: Partial<Proyecto>) {
        Object.assign(this, data);
    }
}
