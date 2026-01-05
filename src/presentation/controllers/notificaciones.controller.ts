import { Controller, Get, Post, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ObtenerNotificacionesPendientesUseCase } from '../../application/use-cases/notificaciones/obtener-notificaciones-pendientes.use-case';
import { MarcarNotificacionesEntregadasUseCase } from '../../application/use-cases/notificaciones/marcar-notificaciones-entregadas.use-case';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
    constructor(
        private readonly obtenerNotificacionesPendientesUseCase: ObtenerNotificacionesPendientesUseCase,
        private readonly marcarNotificacionesEntregadasUseCase: MarcarNotificacionesEntregadasUseCase,
    ) {}

    @Get('pendientes')
    async obtenerPendientes(@Request() req: any, @Query('tipo') tipo?: string) {
        const userId = req.user.sub || req.user.id || req.user.idusuario;
        const notificaciones = await this.obtenerNotificacionesPendientesUseCase.execute(userId, tipo);
        
        return {
            status: 200,
            message: 'Notificaciones pendientes obtenidas exitosamente',
            data: notificaciones,
        };
    }

    @Post('marcar-entregadas')
    async marcarEntregadas(@Request() req: any) {
        const userId = req.user.sub || req.user.id || req.user.idusuario;
        await this.marcarNotificacionesEntregadasUseCase.execute(userId);
        
        return {
            status: 200,
            message: 'Notificaciones marcadas como entregadas exitosamente',
        };
    }
}

