import { Controller, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface ChannelAuthRequest {
  socket_id: string;
  channel_name: string;
}

/**
 * Controlador para autenticación de canales WebSocket
 * Compatible con Laravel Echo / Pusher
 */
@Controller('broadcasting')
export class BroadcastController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('auth')
  @UseGuards(JwtAuthGuard)
  async authenticateChannel(@Body() body: ChannelAuthRequest, @Req() request: Request) {
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      throw new UnauthorizedException('socket_id y channel_name son requeridos');
    }

    // Obtener el usuario del request (inyectado por JwtAuthGuard)
    const user = (request as any).user;
    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Verificar permisos para el canal
    if (!this.canAccessChannel(user, channel_name)) {
      throw new UnauthorizedException('No autorizado para este canal');
    }

    // Para canales públicos, simplemente retornar éxito
    // Para canales privados, podrías generar una firma si fuera necesario
    // Por ahora, retornamos una respuesta compatible con Laravel Echo
    return {
      auth: `${process.env.APP_KEY || 'default-key'}:${socket_id}`,
      channel_data: JSON.stringify({
        user_id: user.id,
        user_info: {
          id: user.id,
          correo: user.correo,
          nombre: user.nombre,
        },
      }),
    };
  }

  /**
   * Verifica si un usuario puede acceder a un canal
   */
  private canAccessChannel(user: any, channelName: string): boolean {
    // Canal público 'menus' - cualquier usuario autenticado puede acceder
    if (channelName === 'menus') {
      return true;
    }

    // Canal privado por usuario: 'App.Models.User.{id}'
    const userChannelMatch = channelName.match(/^App\.Models\.User\.(\d+)$/);
    if (userChannelMatch) {
      const userId = parseInt(userChannelMatch[1], 10);
      return user.id === userId;
    }

    // Por defecto, denegar
    return false;
  }
}

