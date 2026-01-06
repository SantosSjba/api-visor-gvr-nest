import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { ROL_REPOSITORY } from '../../../domain/repositories/rol.repository.interface';
import { GestionarRolesUsuarioDto } from '../../dtos/rol/gestionar-roles-usuario.dto';
import { BroadcastService } from '../../../shared/services/broadcast.service';

@Injectable()
export class GestionarRolesUsuarioUseCase {
    constructor(
        @Inject(ROL_REPOSITORY)
        private readonly rolRepository: IRolRepository,
        private readonly broadcastService: BroadcastService,
    ) { }

    async execute(idUsuario: number, gestionarDto: GestionarRolesUsuarioDto, idUsuarioModificacion: number) {
        try {
            const resultado = await this.rolRepository.gestionarRolesUsuario(
                idUsuario,
                gestionarDto.rolesIds,
                idUsuarioModificacion
            );

            if (!resultado) {
                throw new BadRequestException('No se pudo gestionar los roles del usuario');
            }

            // Emitir evento de actualización de roles al usuario afectado
            try {
                const channel = `App.Models.User.${idUsuario}`;
                this.broadcastService.emit(channel, 'roles.updated', {
                    userId: idUsuario,
                    rolesIds: gestionarDto.rolesIds,
                    rolesAsignados: resultado.rolesasignados || 0,
                    rolesEliminados: resultado.roleseliminados || 0,
                });
            } catch (error) {
                // No fallar la operación si el broadcast falla
                console.warn('Error al emitir evento de actualización de roles:', error);
            }

            return {
                message: resultado.mensaje || 'Roles gestionados exitosamente',
                rolesAsignados: resultado.rolesasignados || 0,
                rolesEliminados: resultado.roleseliminados || 0,
            };
        } catch (error: any) {
            // Si es una excepción de PostgreSQL, extraer el mensaje
            if (error?.message) {
                throw new BadRequestException(error.message);
            }
            throw new BadRequestException('Error al gestionar los roles del usuario');
        }
    }
}
