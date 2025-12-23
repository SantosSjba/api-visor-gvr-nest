import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterDto } from '../../application/dtos/register.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
    ) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.registerUseCase.execute(registerDto);

        // Remove password from response
        const { contrasena, ...userWithoutPassword } = user;

        return ApiResponseDto.created(
            userWithoutPassword,
            'Usuario registrado exitosamente',
        );
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        const result = await this.loginUseCase.execute(loginDto);

        return ApiResponseDto.success(
            result,
            'Inicio de sesión exitoso',
        );
    }
}
