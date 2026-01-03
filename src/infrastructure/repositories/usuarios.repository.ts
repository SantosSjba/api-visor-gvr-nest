import { Injectable } from '@nestjs/common';
import { IUsuariosRepository } from '../../domain/repositories/usuarios.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class UsuariosRepository implements IUsuariosRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async obtenerUsuariosActivos(
        busqueda: string = '',
        limit: number = 100,
        offset: number = 0,
    ): Promise<any[]> {
        const result = await this.databaseFunctionService.callFunction<any>(
            'obtenerUsuariosActivos',
            [busqueda, limit, offset],
        );

        return result || [];
    }
}

