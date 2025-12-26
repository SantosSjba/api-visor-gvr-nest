export class Trabajador {
    id: number;
    nombres: string;
    apellidos: string;
    idTipoDocumento: number;
    nroDocumento: string;
    correo: string;
    idEmpresa: number;
    idResponsable?: number;
    idUsuario?: number;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    idUsuarioCreacion?: number;
    idUsuarioModificacion?: number;
    roles?: any[];

    constructor(data: Partial<Trabajador>) {
        Object.assign(this, data);
    }
}
