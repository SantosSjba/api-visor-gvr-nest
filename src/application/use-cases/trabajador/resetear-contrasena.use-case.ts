import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { ITrabajadorRepository } from '../../../domain/repositories/trabajador.repository.interface';
import { TRABAJADOR_REPOSITORY } from '../../../domain/repositories/trabajador.repository.interface';

@Injectable()
export class ResetearContrasenaUseCase {
    constructor(
        @Inject(TRABAJADOR_REPOSITORY)
        private readonly trabajadorRepository: ITrabajadorRepository,
    ) { }

    async execute(idTrabajador: number, idUsuarioModificacion: number) {
        const resultado = await this.trabajadorRepository.resetearContrasena(idTrabajador, idUsuarioModificacion);

        if (!resultado || !resultado.success) {
            throw new BadRequestException(resultado?.message || 'Error al resetear la contraseña');
        }

        return {
            message: resultado.message,
            nueva_contrasena: resultado.nueva_contrasena,
        };
    }
}
