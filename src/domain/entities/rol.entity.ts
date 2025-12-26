export class Rol {
    id: number;
    nombre: string;
    descripcion?: string;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    idUsuarioCreacion?: number;
    idUsuarioModificacion?: number;
    permisos?: any[];

    constructor(data: Partial<Rol>) {
        Object.assign(this, data);
    }
}
