import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    Query,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ObtenerToken2LeggedUseCase } from '../../application/use-cases/acc/obtener-token-2legged.use-case';
import { GenerarUrlAutorizacionUseCase } from '../../application/use-cases/acc/generar-url-autorizacion.use-case';
import { ObtenerMiTokenUseCase } from '../../application/use-cases/acc/obtener-mi-token.use-case';
import { RefrescarToken3LeggedUseCase } from '../../application/use-cases/acc/refrescar-token-3legged.use-case';
import { RevocarTokenUseCase } from '../../application/use-cases/acc/revocar-token.use-case';
import { CallbackAutorizacionUseCase } from '../../application/use-cases/acc/callback-autorizacion.use-case';
import { ValidarExpiracionUseCase } from '../../application/use-cases/acc/validar-expiracion.use-case';
import { ObtenerToken2LeggedDto } from '../../application/dtos/acc/obtener-token-2legged.dto';
import { GenerarUrlAutorizacionDto } from '../../application/dtos/acc/generar-url-autorizacion.dto';
import { CallbackAutorizacionDto } from '../../application/dtos/acc/callback-autorizacion.dto';
import { ValidarExpiracionDto } from '../../application/dtos/acc/validar-expiracion.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';

@Controller('acc')
export class AccController {
    constructor(
        private readonly obtenerToken2LeggedUseCase: ObtenerToken2LeggedUseCase,
        private readonly generarUrlAutorizacionUseCase: GenerarUrlAutorizacionUseCase,
        private readonly obtenerMiTokenUseCase: ObtenerMiTokenUseCase,
        private readonly refrescarToken3LeggedUseCase: RefrescarToken3LeggedUseCase,
        private readonly revocarTokenUseCase: RevocarTokenUseCase,
        private readonly callbackAutorizacionUseCase: CallbackAutorizacionUseCase,
        private readonly validarExpiracionUseCase: ValidarExpiracionUseCase,
    ) { }

    // ==================== 2-LEGGED TOKEN (App-Only) ====================

    /**
     * Obtener token 2-legged (no requiere usuario final)
     * POST /acc/token
     */
    @Post('token')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerToken(@Body() dto: ObtenerToken2LeggedDto) {
        const resultado = await this.obtenerToken2LeggedUseCase.execute(dto);

        return ApiResponseDto.success(
            resultado,
            'Token 2-legged obtenido exitosamente',
        );
    }

    // ==================== 3-LEGGED TOKEN (User Context) ====================

    /**
     * Generar URL de autorización
     * POST /acc/oauth/authorize
     */
    @Post('oauth/authorize')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async generarUrlAutorizacion(@Body() dto: GenerarUrlAutorizacionDto) {
        const resultado = await this.generarUrlAutorizacionUseCase.execute(dto);

        return ApiResponseDto.success(
            resultado,
            'URL de autorización generada exitosamente',
        );
    }

    /**
     * Obtener mi token activo
     * GET /acc/oauth/mi-token
     */
    @Get('oauth/mi-token')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async obtenerMiToken(@Req() request: Request) {
        // User is automatically attached by JwtAuthGuard
        const user = (request as any).user;

        const resultado = await this.obtenerMiTokenUseCase.execute(user.sub);

        return ApiResponseDto.success(
            resultado,
            'Token obtenido exitosamente',
        );
    }

    /**
     * Refrescar mi token
     * POST /acc/oauth/refresh
     */
    @Post('oauth/refresh')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async refrescarToken(@Req() request: Request) {
        // User is automatically attached by JwtAuthGuard
        const user = (request as any).user;

        const resultado = await this.refrescarToken3LeggedUseCase.execute(user.sub);

        return ApiResponseDto.success(
            resultado,
            'Token refrescado exitosamente',
        );
    }

    /**
     * Revocar mi token
     * DELETE /acc/oauth/revoke
     */
    @Delete('oauth/revoke')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async revocarMiToken(@Req() request: Request) {
        // User is automatically attached by JwtAuthGuard
        const user = (request as any).user;

        await this.revocarTokenUseCase.execute(user.sub);

        return ApiResponseDto.success(
            null,
            'Token revocado exitosamente',
        );
    }

    // ==================== VALIDACIONES ====================

    /**
     * Validar expiración de token
     * POST /acc/validar-expiracion
     */
    @Post('validar-expiracion')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async validarExpiracion(@Body() dto: ValidarExpiracionDto) {
        const resultado = await this.validarExpiracionUseCase.execute(dto);

        const message = resultado.expirado
            ? 'Token expirado o próximo a expirar'
            : 'Token aún válido';

        return ApiResponseDto.success(resultado, message);
    }
    /**
     * Callback de OAuth - Intercambia el código por token
     * GET /acc/oauth/callback
     */
    @Get('oauth/callback')
    @HttpCode(HttpStatus.OK)
    async callbackAutorizacion(
        @Query() dto: CallbackAutorizacionDto,
        @Req() request: Request,
    ) {
        // En un entorno real, obtenemos el usuario de la sesión o token.
        // Simularemos el usuario ID 1 como en el código original PHP si no hay auth
        const user = (request as any).user;
        const userId = user?.sub || 1; // Default to 1 if no user context

        const resultado = await this.callbackAutorizacionUseCase.execute(dto, userId);

        return ApiResponseDto.success(
            resultado,
            'Token 3-legged obtenido y guardado exitosamente',
        );
    }
}
