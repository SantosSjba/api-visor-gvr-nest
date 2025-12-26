import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProyectoController } from '../controllers/proyecto.controller';
import { ListarProyectosUseCase } from '../../application/use-cases/proyecto/listar-proyectos.use-case';
import { ObtenerProyectoUseCase } from '../../application/use-cases/proyecto/obtener-proyecto.use-case';
import { CrearProyectoUseCase } from '../../application/use-cases/proyecto/crear-proyecto.use-case';
import { EditarProyectoUseCase } from '../../application/use-cases/proyecto/editar-proyecto.use-case';
import { EliminarProyectoUseCase } from '../../application/use-cases/proyecto/eliminar-proyecto.use-case';
import { ProyectoRepository } from '../../infrastructure/repositories/proyecto.repository';
import { PROYECTO_REPOSITORY } from '../../domain/repositories/proyecto.repository.interface';
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
    controllers: [ProyectoController],
    providers: [
        {
            provide: PROYECTO_REPOSITORY,
            useClass: ProyectoRepository,
        },
        ListarProyectosUseCase,
        ObtenerProyectoUseCase,
        CrearProyectoUseCase,
        EditarProyectoUseCase,
        EliminarProyectoUseCase,
        JwtStrategy,
    ],
    exports: [PROYECTO_REPOSITORY],
})
export class ProyectoModule { }
