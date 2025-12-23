import { AccToken } from '../entities/acc-token.entity';

export const ACC_REPOSITORY = 'ACC_REPOSITORY';

export interface IAccRepository {
    // 3-Legged Token Operations
    guardarToken3Legged(
        idUsuario: number,
        tokenAcceso: string,
        tokenRefresco: string | null,
        expiraEn: Date,
        tipoToken: string,
    ): Promise<AccToken>;

    obtenerToken3LeggedPorUsuario(idUsuario: number): Promise<AccToken | null>;

    actualizarToken3Legged(
        id: number,
        tokenAcceso: string,
        tokenRefresco: string,
        expiraEn: Date,
    ): Promise<AccToken>;

    revocarToken3Legged(id: number): Promise<void>;
}
