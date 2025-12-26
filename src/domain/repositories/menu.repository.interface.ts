export interface IMenuRepository {
    listarMenuOpciones(): Promise<any[]>;
    obtenerMenuOpcionPorId(id: number): Promise<any>;
    obtenerOpcionesPorLista(idLista: number): Promise<any[]>;
    listarMenuRecursivo(idUsuario: number): Promise<any>;
}

export const MENU_REPOSITORY = 'MENU_REPOSITORY';
