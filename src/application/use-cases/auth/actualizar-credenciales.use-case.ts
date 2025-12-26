import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import type { IAuthRepository } from '../../../domain/repositories/auth.repository.interface';
import { AUTH_REPOSITORY } from '../../../domain/repositories/auth.repository.interface';
import { UpdateCredentialsDto } from '../../dtos/auth/update-credentials.dto';

@Injectable()
export class ActualizarCredencialesUseCase {
    constructor(
        @Inject(AUTH_REPOSITORY)
        private readonly authRepository: IAuthRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(
        idUsuario: number,
        updateDto: UpdateCredentialsDto,
        idUsuarioModificacion: number,
    ): Promise<any> {
        // Validate that at least one field is provided
        if (!updateDto.nuevoCorreo && !updateDto.nuevaContrasena) {
            throw new BadRequestException(
                'Debe proporcionar al menos el nuevo correo o la nueva contraseña'
            );
        }

        // Hash password if provided
        let contrasenaHasheada: string | null = null;
        if (updateDto.nuevaContrasena) {
            contrasenaHasheada = await bcrypt.hash(updateDto.nuevaContrasena, 10);
        }

        // Call repository to update credentials
        const resultado = await this.authRepository.actualizarCredenciales(
            idUsuario,
            updateDto.nuevoCorreo || null,
            contrasenaHasheada,
            idUsuarioModificacion,
        );

        if (!resultado) {
            throw new BadRequestException('No se pudieron actualizar las credenciales');
        }

        return resultado;
    }
}
