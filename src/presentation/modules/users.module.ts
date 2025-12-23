import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '../controllers/users.controller';
import { User } from '../../domain/entities/user.entity';
import { TypeOrmUserRepository } from '../../infrastructure/repositories/typeorm-user.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        DatabaseModule, // Importar para tener acceso a DatabaseFunctionService
    ],
    controllers: [UsersController],
    providers: [
        // Repositorio
        {
            provide: USER_REPOSITORY,
            useClass: TypeOrmUserRepository,
        },
        // Casos de uso
        CreateUserUseCase,
    ],
    exports: [USER_REPOSITORY],
})
export class UsersModule { }
