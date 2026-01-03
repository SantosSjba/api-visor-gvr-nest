export const ACC_RECURSOS_REPOSITORY = 'ACC_RECURSOS_REPOSITORY';

export interface IAccRecursosRepository {
    /**
     * Guarda o actualiza un recurso ACC con información de usuario
     */
    guardarRecurso(
        recursoTipo: string,
        recursoId: string,
        recursoUrn: string | null,
        projectId: string | null,
        parentId: string | null,
        idUsuarioCreador: number | null,
        idUsuarioAsignado: number | null,
        nombre: string | null,
        descripcion: string | null,
        estadoRecurso: string | null,
        metadatos: any,
        idUsuarioCreacion: number,
    ): Promise<any>;

    /**
     * Obtiene un recurso ACC por tipo e ID
     */
    obtenerRecurso(recursoTipo: string, recursoId: string): Promise<any | null>;

    /**
     * Actualiza un recurso ACC (especialmente para asignaciones)
     */
    actualizarRecurso(
        recursoTipo: string,
        recursoId: string,
        idUsuarioAsignado: number | null,
        idUsuarioModifico: number | null,
        estadoRecurso: string | null,
        metadatos: any | null,
        idUsuarioModificacion: number,
    ): Promise<any>;

    /**
     * Obtiene recursos por proyecto
     */
    obtenerRecursosPorProyecto(
        projectId: string,
        recursoTipo: string | null,
        limit: number,
        offset: number,
    ): Promise<any>;

    /**
     * Obtiene recursos hijos de un recurso padre
     */
    obtenerRecursosHijos(
        parentId: string,
        recursoTipo: string | null,
    ): Promise<any>;

    /**
     * Obtiene recursos de un usuario (creador, asignado o modificó)
     */
    obtenerRecursosUsuario(
        idUsuario: number,
        recursoTipo: string | null,
        rol: string,
        limit: number,
        offset: number,
    ): Promise<any>;
}
