import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { User } from '../../domain/entities/user.entity';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly databaseFunctionService: DatabaseFunctionService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return await this.createUserUseCase.execute(createUserDto);
    }

    /**
     * Ejemplo de endpoint que usa una función de base de datos
     * Ajusta el nombre de la función y parámetros según tus necesidades
     */
    @Get('custom-function/:param')
    async callCustomFunction(@Param('param') param: string): Promise<any> {
        // Ejemplo: SELECT * FROM mi_funcion_personalizada($1)
        const result = await this.databaseFunctionService.callFunction(
            'mi_funcion_personalizada',
            [param],
        );
        return result;
    }
}
