import {
    Controller,
    Put,
    Get,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    UnauthorizedException,
    ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { ActualizarCredencialesUseCase } from '../../application/use-cases/auth/actualizar-credenciales.use-case';
import { ObtenerPerfilUsuarioUseCase } from '../../application/use-cases/auth/obtener-perfil-usuario.use-case';
import { UpdateCredentialsDto } from '../../application/dtos/auth/update-credentials.dto';
import { ApiResponseDto } from '../../shared/dtos/api-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UserController {
    constructor(
        private readonly actualizarCredencialesUseCase: ActualizarCredencialesUseCase,
        private readonly obtenerPerfilUsuarioUseCase: ObtenerPerfilUsuarioUseCase,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Actualizar credenciales (correo y/o contraseña)
     * PUT /usuarios/{idUsuario}/credenciales
     * Body: { "nuevoCorreo": "correo@ejemplo.com", "nuevaContrasena": "password123" }
     */
    @Put(':idUsuario/credenciales')
    @HttpCode(HttpStatus.OK)
    async actualizarCredenciales(
        @Param('idUsuario', ParseIntPipe) idUsuario: number,
        @Body() updateDto: UpdateCredentialsDto,
        @Req() request: Request,
    ) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        // Get user ID from token for modification tracking
        const payload = await this.jwtService.verifyAsync(token);
        const idUsuarioModificacion = payload.sub;

        const resultado = await this.actualizarCredencialesUseCase.execute(
            idUsuario,
            updateDto,
            idUsuarioModificacion,
        );

        // Parse the result to create a detailed response
        const correoActualizado = resultado.correoacualizado || resultado.correoActualizado || false;
        const contrasenaActualizada = resultado.contrasenaactualizada || resultado.contrasenaActualizada || false;

        const cambios: string[] = [];
        if (correoActualizado) {
            cambios.push('correo electrónico');
        }
        if (contrasenaActualizada) {
            cambios.push('contraseña');
        }

        const mensajeDetallado = cambios.length === 0
            ? 'No se realizaron cambios'
            : 'Se actualizó correctamente: ' + cambios.join(' y ');

        return ApiResponseDto.success(
            {
                usuarioId: resultado.usuarioid || resultado.usuarioId || idUsuario,
                correoActualizado,
                contrasenaActualizada,
                mensaje: mensajeDetallado,
            },
            resultado.mensaje || 'Credenciales actualizadas exitosamente',
        );
    }

    /**
     * Obtener perfil de usuario autenticado
     * GET /usuarios/perfil
     */
    @Get('perfil')
    @HttpCode(HttpStatus.OK)
    async obtenerPerfil(@Req() request: Request) {
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token no proporcionado');
        }

        const perfil = await this.obtenerPerfilUsuarioUseCase.execute(token);

        return ApiResponseDto.success(
            perfil,
            'Perfil obtenido exitosamente',
        );
    }

    // Helper method
    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            return undefined;
        }

        const [type, token] = authHeader.split(' ');
        return type === 'Bearer' ? token : undefined;
    }
}
