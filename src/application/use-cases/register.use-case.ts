import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IAuthRepository } from '../../domain/repositories/auth.repository.interface';
import { AUTH_REPOSITORY } from '../../domain/repositories/auth.repository.interface';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { RegisterDto } from '../dtos/register.dto';

@Injectable()
export class RegisterUseCase {
    constructor(
        @Inject(AUTH_REPOSITORY)
        private readonly authRepository: IAuthRepository,
    ) { }

    async execute(registerDto: RegisterDto): Promise<AuthUser> {
        // Hash the password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(registerDto.contrasena, saltRounds);

        // Call the database function with hashed password
        try {
            const user = await this.authRepository.register({
                nombre: registerDto.nombre,
                correo: registerDto.correo,
                contrasena: hashedPassword,
                estado: registerDto.estado ?? 1, // Default to active
                id: registerDto.id ?? null,
            });

            return user;
        } catch (error) {
            // Handle duplicate email error
            if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
                throw new ConflictException('El correo ya está registrado');
            }
            throw error;
        }
    }
}
