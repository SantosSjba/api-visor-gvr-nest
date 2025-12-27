import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { AutodeskApiService } from '../../../infrastructure/services/autodesk-api.service';
import { ACC_REPOSITORY, type IAccRepository } from '../../../domain/repositories/acc.repository.interface';

@Injectable()
export class ObtenerProyectoPorIdUseCase {
    constructor(
        private readonly autodeskApiService: AutodeskApiService,
        @Inject(ACC_REPOSITORY)
        private readonly accRepository: IAccRepository,
    ) { }

    async execute(userId: number, hubId: string, projectId: string): Promise<any> {
        if (!hubId) {
            throw new Error('El ID del hub es requerido');
        }

        if (!projectId) {
            throw new Error('El ID del proyecto es requerido');
        }

        // Obtener token del usuario
        const token = await this.accRepository.obtenerToken3LeggedPorUsuario(userId);

        if (!token) {
            throw new UnauthorizedException('No se encontró token de acceso. Por favor, autoriza la aplicación primero.');
        }

        // Validar que el token no esté expirado
        if (this.autodeskApiService.esTokenExpirado(token.expiraEn)) {
            throw new UnauthorizedException('El token ha expirado. Por favor, refresca tu token.');
        }

        // Obtener proyecto
        return await this.autodeskApiService.obtenerProyectoPorId(token.tokenAcceso, hubId, projectId);
    }
}
