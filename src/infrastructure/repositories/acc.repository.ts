import { Injectable } from '@nestjs/common';
import { IAccRepository } from '../../domain/repositories/acc.repository.interface';
import { AccToken } from '../../domain/entities/acc-token.entity';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class AccRepository implements IAccRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async guardarToken3Legged(
        idUsuario: number,
        tokenAcceso: string,
        tokenRefresco: string | null,
        expiraEn: Date,
        tipoToken: string,
    ): Promise<AccToken> {
        // Call accGuardarToken3Legged function
        // SELECT * FROM accGuardarToken3Legged(p_id_usuario, p_token_acceso, p_token_refresco, p_expira_en, p_tipo_token)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accGuardarToken3Legged',
            [
                idUsuario,
                tokenAcceso,
                tokenRefresco,
                expiraEn,
                tipoToken,
            ],
        );

        if (!result) {
            throw new Error('Error al guardar token 3-legged');
        }

        return new AccToken({
            id: result.v_id,
            idUsuario: result.v_id_usuario,
            tokenAcceso: result.v_token_acceso,
            tokenRefresco: result.v_token_refresco,
            expiraEn: new Date(result.v_expira_en),
            tipoToken: result.v_tipo_token,
            fechaCreacion: result.v_fecha_creacion,
            fechaModificacion: result.v_fecha_modificacion,
        });
    }

    async obtenerToken3LeggedPorUsuario(idUsuario: number): Promise<AccToken | null> {
        // Call accObtenerToken3LeggedPorUsuario function
        // SELECT * FROM accObtenerToken3LeggedPorUsuario(p_id_usuario)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accObtenerToken3LeggedPorUsuario',
            [idUsuario],
        );

        if (!result) {
            return null;
        }

        return new AccToken({
            id: result.v_id,
            idUsuario: result.v_id_usuario,
            tokenAcceso: result.v_token_acceso,
            tokenRefresco: result.v_token_refresco,
            expiraEn: new Date(result.v_expira_en),
            tipoToken: result.v_tipo_token,
            fechaCreacion: result.v_fecha_creacion,
            fechaModificacion: result.v_fecha_modificacion,
        });
    }

    async actualizarToken3Legged(
        id: number,
        tokenAcceso: string,
        tokenRefresco: string,
        expiraEn: Date,
    ): Promise<AccToken> {
        // Call accActualizarToken3Legged function
        // SELECT * FROM accActualizarToken3Legged(p_id, p_token_acceso, p_token_refresco, p_expira_en)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'accActualizarToken3Legged',
            [id, tokenAcceso, tokenRefresco, expiraEn],
        );

        if (!result) {
            throw new Error('Error al actualizar token 3-legged');
        }

        return new AccToken({
            id: result.v_id,
            idUsuario: result.v_id_usuario,
            tokenAcceso: result.v_token_acceso,
            tokenRefresco: result.v_token_refresco,
            expiraEn: new Date(result.v_expira_en),
            tipoToken: result.v_tipo_token,
            fechaCreacion: result.v_fecha_creacion,
            fechaModificacion: result.v_fecha_modificacion,
        });
    }

    async revocarToken3Legged(id: number): Promise<void> {
        // Call accRevocarToken3Legged function
        // SELECT * FROM accRevocarToken3Legged(p_id)
        await this.databaseFunctionService.callFunctionSingle<any>(
            'accRevocarToken3Legged',
            [id],
        );
    }
}
