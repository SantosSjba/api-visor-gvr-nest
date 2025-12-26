import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case';
import { ObtenerPerfilUseCase } from '../../application/use-cases/auth/obtener-perfil.use-case';
import { ValidarSesionUseCase } from '../../application/use-cases/auth/validar-sesion.use-case';
import { CerrarTodasSesionesUseCase } from '../../application/use-cases/auth/cerrar-todas-sesiones.use-case';
import { RegisterDto } from '../../application/dtos/register.dto';
import { LoginDto } from '../../application/dtos/login.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly obtenerPerfilUseCase: ObtenerPerfilUseCase,
        private readonly validarSesionUseCase: ValidarSesionUseCase,
        private readonly cerrarTodasSesionesUseCase: CerrarTodasSesionesUseCase,
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
    async login(@Body() loginDto: LoginDto, @Req() request: Request) {
        const ip = this.getIpAddress(request);
        const userAgent = request.headers['user-agent'];

        const result = await this.loginUseCase.execute(loginDto, ip, userAgent);

        return ApiResponseDto.success(
            result,
            'Inicio de sesión exitoso',
        );
    }

    /**
     * Refrescar token JWT
     * POST /auth/refresh-token
     */
    @Post('refresh-token')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const ip = this.getIpAddress(request);
        const userAgent = request.headers['user-agent'];

        const resultado = await this.refreshTokenUseCase.execute(token, ip, userAgent);

        return ApiResponseDto.success(
            resultado,
            'Token refrescado exitosamente',
        );
    }

    /**
     * Cerrar sesión actual
     * POST /auth/logout
     */
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        await this.logoutUseCase.execute(token);

        return ApiResponseDto.success(
            null,
            'Logout exitoso',
        );
    }

    /**
     * Obtener perfil del usuario autenticado
     * GET /auth/perfil
     */
    @Get('perfil')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerPerfil(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const perfil = await this.obtenerPerfilUseCase.execute(token);

        return ApiResponseDto.success(
            perfil,
            'Perfil obtenido exitosamente',
        );
    }

    /**
     * Validar si la sesión está activa
     * GET /validar-sesion
     */
    @Get('/validar-sesion')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async validarSesion(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const resultado = await this.validarSesionUseCase.execute(token);

        if (!resultado.valida) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }

        return ApiResponseDto.success(
            resultado,
            'Sesión activa',
        );
    }

    /**
     * Cerrar todas las sesiones del usuario
     * POST /cerrar-todas-sesiones
     */
    @Post('/cerrar-todas-sesiones')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async cerrarTodasSesiones(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        await this.cerrarTodasSesionesUseCase.execute(token);

        return ApiResponseDto.success(
            null,
            'Todas las sesiones han sido cerradas',
        );
    }

    // Helper methods
    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }

    private getIpAddress(request: Request): string | undefined {
        const forwarded = request.headers['x-forwarded-for'];
        if (forwarded) {
            return typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
        }
        return request.ip;
    }
}
