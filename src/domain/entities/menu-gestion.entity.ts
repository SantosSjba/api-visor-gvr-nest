export class MenuGestion {
    id: number;
    nombre: string;
    url?: string;
    icono?: string;
    idPadre?: number;
    orden?: number;
    estado: number;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    idUsuarioCreacion?: number;
    idUsuarioModificacion?: number;
    roles?: any[];
    hijos?: MenuGestion[];

    constructor(data: Partial<MenuGestion>) {
        Object.assign(this, data);
    }
}
