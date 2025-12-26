export class Sesion {
    id?: number;
    idUsuario: number;
    token: string;
    ip?: string;
    userAgent?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    duracion?: string;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;

    constructor(data: Partial<Sesion>) {
        this.id = data.id;
        this.idUsuario = data.idUsuario!;
        this.token = data.token!;
        this.ip = data.ip;
        this.userAgent = data.userAgent;
        this.fechaInicio = data.fechaInicio;
        this.fechaFin = data.fechaFin;
        this.duracion = data.duracion;
        this.estado = data.estado ?? 1;
        this.fechaCreacion = data.fechaCreacion;
        this.fechaModificacion = data.fechaModificacion;
    }
}
