export class Permiso {
    id: number;
    nombre: string;
    descripcion?: string;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    idUsuarioCreacion?: number;
    idUsuarioModificacion?: number;

    constructor(data: Partial<Permiso>) {
        Object.assign(this, data);
    }
}
