export interface ListarMenusParams {
    busqueda?: string;
    limit?: number;
    offset?: number;
}

export interface ListarMenusResponse {
    data: any[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        total_pages: number;
        current_page: number;
    };
}

export interface CrearMenuData {
    nombre: string;
    url?: string;
    icono?: string;
    idPadre?: number;
    orden?: number;
    idUsuarioCreacion: number;
}

export interface EditarMenuData {
    idMenu: number;
    nombre: string;
    url?: string;
    icono?: string;
    idPadre?: number;
    orden?: number;
    idUsuarioModificacion: number;
}

export interface AsignarRolMenuData {
    idMenu: number;
    idRol: number;
    idUsuarioCreacion: number;
}

export interface AsignarRolesMenuData {
    idMenu: number;
    roles: number[];
    idUsuarioCreacion: number;
}

export interface SincronizarRolesMenuData {
    idMenu: number;
    roles: number[];
    idUsuarioModificacion: number;
}

export interface ClonarMenuData {
    idMenu: number;
    nombreNuevo: string;
    idPadreNuevo?: number;
    clonarRoles: boolean;
    idUsuarioCreacion: number;
}

export interface MoverMenuData {
    idMenu: number;
    idPadreNuevo?: number;
    idUsuarioModificacion: number;
}

export interface ReordenarMenuData {
    idMenu: number;
    ordenNuevo: number;
    idUsuarioModificacion: number;
}

export interface IMenuGestionRepository {
    listarMenus(params: ListarMenusParams): Promise<ListarMenusResponse>;
    listarMenusTree(): Promise<any[]>;
    listarMenuPadresDisponibles(idMenuActual?: number): Promise<any[]>;
    obtenerMenuPorId(idMenu: number): Promise<any>;
    obtenerDetalleMenu(idMenu: number): Promise<any>;
    crearMenu(data: CrearMenuData): Promise<any>;
    editarMenu(data: EditarMenuData): Promise<any>;
    eliminarMenu(idMenu: number, idUsuarioModificacion: number): Promise<any>;
    clonarMenu(data: ClonarMenuData): Promise<any>;
    moverMenu(data: MoverMenuData): Promise<any>;
    reordenarMenu(data: ReordenarMenuData): Promise<any>;
    listarRolesMenu(idMenu: number): Promise<any[]>;
    listarRolesDisponibles(idMenu: number): Promise<any[]>;
    asignarRolMenu(data: AsignarRolMenuData): Promise<any>;
    asignarRolesMenu(data: AsignarRolesMenuData): Promise<any>;
    removerRolMenu(idMenu: number, idRol: number, idUsuarioModificacion: number): Promise<any>;
    sincronizarRolesMenu(data: SincronizarRolesMenuData): Promise<any>;
}

export const MENU_GESTION_REPOSITORY = 'MENU_GESTION_REPOSITORY';
