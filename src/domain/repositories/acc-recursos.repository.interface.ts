export interface IAccRecursosRepository {
    guardarRecurso(
        recursoTipo: string,
        recursoId: string,
        recursoUrn: string | null,
        projectId: string | null,
        parentId: string | null,
        idUsuarioCreador: number,
        idUsuarioAsignado: number | null,
        nombre: string | null,
        descripcion: string | null,
        estado: string | null,
        metadatos: any,
        idUsuarioCreacion: number,
    ): Promise<any>;

    obtenerRecurso(recursoTipo: string, recursoId: string): Promise<any | null>;

    actualizarRecurso(
        recursoTipo: string,
        recursoId: string,
        idUsuarioAsignado: number | null,
        idUsuarioModifico: number | null,
        estado: string | null,
        metadatos: any | null,
        idUsuarioModificacion: number,
    ): Promise<any>;

    obtenerRecursosUsuario(
        idUsuario: number,
        recursoTipo: string | null,
        rol: string,
        limit: number,
        offset: number,
    ): Promise<any[]>;

    obtenerRecursosPorProyecto(
        projectId: string,
        recursoTipo: string | null,
        limit: number,
        offset: number,
    ): Promise<any[]>;

    obtenerRecursosHijos(parentId: string, recursoTipo: string | null): Promise<any[]>;
}

export const ACC_RECURSOS_REPOSITORY = Symbol('ACC_RECURSOS_REPOSITORY');

