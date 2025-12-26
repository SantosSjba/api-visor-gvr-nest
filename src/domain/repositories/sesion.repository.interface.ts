import { Sesion } from '../entities/sesion.entity';

export const SESION_REPOSITORY = 'SESION_REPOSITORY';

export interface ISesionRepository {
    /**
     * Obtiene una sesión por su token
     */
    obtenerSesionPorToken(token: string): Promise<Sesion | null>;

    /**
     * Actualiza una sesión existente con nuevo token
     */
    actualizarSesion(
        id: number,
        token: string,
        ip?: string,
        userAgent?: string,
        idUsuarioModificacion?: number,
    ): Promise<Sesion>;

    /**
     * Cierra una sesión específica
     */
    cerrarSesion(id: number, idUsuarioModificacion: number): Promise<void>;

    /**
     * Cierra todas las sesiones de un usuario
     */
    cerrarTodasLasSesiones(idUsuario: number, idUsuarioModificacion: number): Promise<void>;
}
