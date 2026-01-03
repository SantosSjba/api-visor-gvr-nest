export const USUARIOS_REPOSITORY = 'USUARIOS_REPOSITORY';

export interface IUsuariosRepository {
    /**
     * Obtiene lista de usuarios activos
     */
    obtenerUsuariosActivos(
        busqueda?: string,
        limit?: number,
        offset?: number,
    ): Promise<any[]>;
}

