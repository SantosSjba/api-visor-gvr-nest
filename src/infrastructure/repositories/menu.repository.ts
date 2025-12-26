import { Injectable } from '@nestjs/common';
import { IMenuRepository } from '../../domain/repositories/menu.repository.interface';
import { DatabaseFunctionService } from '../database/database-function.service';

@Injectable()
export class MenuRepository implements IMenuRepository {
    constructor(
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    async listarMenuOpciones(): Promise<any[]> {
        // Call genListarMenuOpciones function
        // SELECT * FROM genListarMenuOpciones()
        const result = await this.databaseFunctionService.callFunction<any>(
            'genListarMenuOpciones',
            [],
        );

        return result || [];
    }

    async obtenerMenuOpcionPorId(id: number): Promise<any> {
        // Call genObtenerMenuOpcionPorId function
        // SELECT * FROM genObtenerMenuOpcionPorId(p_id)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'genObtenerMenuOpcionPorId',
            [id],
        );

        return result;
    }

    async obtenerOpcionesPorLista(idLista: number): Promise<any[]> {
        // Call genObtenerOpcionesPorLista function
        // SELECT * FROM genObtenerOpcionesPorLista(p_idLista)
        const result = await this.databaseFunctionService.callFunction<any>(
            'genObtenerOpcionesPorLista',
            [idLista],
        );

        return result || [];
    }

    async listarMenuRecursivo(idUsuario: number): Promise<any> {
        // Call genListarMenuRecursivoPorUsuarioV2 function
        // SELECT * FROM genListarMenuRecursivoPorUsuarioV2(p_idUsuario)
        const result = await this.databaseFunctionService.callFunctionSingle<any>(
            'genListarMenuRecursivoPorUsuarioV2',
            [idUsuario],
        );

        if (!result) {
            return [];
        }

        // The function returns a JSON string in the first property
        // Parse it to get the actual menu structure
        const menuData = result.genlistarmenurecursivoporusuariov2 || result.genListarMenuRecursivoPorUsuarioV2;

        if (typeof menuData === 'string') {
            try {
                return JSON.parse(menuData);
            } catch (e) {
                return [];
            }
        }

        return menuData || [];
    }
}
