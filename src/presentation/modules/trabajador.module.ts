import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TrabajadorController } from '../controllers/trabajador.controller';
import { ListarTrabajadoresUseCase } from '../../application/use-cases/trabajador/listar-trabajadores.use-case';
import { ListarAdministrativosUseCase } from '../../application/use-cases/trabajador/listar-administrativos.use-case';
import { ObtenerTrabajadorUseCase } from '../../application/use-cases/trabajador/obtener-trabajador.use-case';
import { CrearTrabajadorUseCase } from '../../application/use-cases/trabajador/crear-trabajador.use-case';
import { EditarTrabajadorUseCase } from '../../application/use-cases/trabajador/editar-trabajador.use-case';
import { EliminarTrabajadorUseCase } from '../../application/use-cases/trabajador/eliminar-trabajador.use-case';
import { ResetearContrasenaUseCase } from '../../application/use-cases/trabajador/resetear-contrasena.use-case';
import { TrabajadorRepository } from '../../infrastructure/repositories/trabajador.repository';
import { TRABAJADOR_REPOSITORY } from '../../domain/repositories/trabajador.repository.interface';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { JwtStrategy } from '../../infrastructure/auth/jwt.strategy';

@Module({
    imports: [
        DatabaseModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'default-secret-key-change-in-production',
                signOptions: {
                    expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '1d') as any,
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [TrabajadorController],
    providers: [
        // Repositories
        {
            provide: TRABAJADOR_REPOSITORY,
            useClass: TrabajadorRepository,
        },
        // Use cases
        ListarTrabajadoresUseCase,
        ListarAdministrativosUseCase,
        ObtenerTrabajadorUseCase,
        CrearTrabajadorUseCase,
        EditarTrabajadorUseCase,
        EliminarTrabajadorUseCase,
        ResetearContrasenaUseCase,
        // JWT Strategy
        JwtStrategy,
    ],
    exports: [TRABAJADOR_REPOSITORY],
})
export class TrabajadorModule { }
