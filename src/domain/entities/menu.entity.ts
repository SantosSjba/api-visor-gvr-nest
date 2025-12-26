export class Menu {
    id: number;
    nombre: string;
    descripcion?: string;
    icono?: string;
    ruta?: string;
    orden?: number;
    idPadre?: number;
    estado: number;
    opciones?: any[];

    constructor(data: Partial<Menu>) {
        Object.assign(this, data);
    }
}
