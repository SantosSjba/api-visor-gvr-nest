import { Injectable } from '@nestjs/common';
import { BroadcastGateway } from '../../presentation/gateways/broadcast.gateway';

/**
 * Servicio para emitir eventos de broadcasting
 * Usa el gateway de WebSocket para enviar eventos a los clientes conectados
 */
@Injectable()
export class BroadcastService {
  constructor(private readonly broadcastGateway: BroadcastGateway) {}

  /**
   * Emite un evento de menú creado
   */
  emitMenuCreated(menu: any) {
    // Emitir sin el punto inicial (Socket.IO no necesita el punto)
    // El frontend removerá el punto al escuchar
    this.broadcastGateway.emitToChannel('menus', 'menu.created', { menu });
  }

  /**
   * Emite un evento de menú actualizado
   */
  emitMenuUpdated(menu: any) {
    // Emitir sin el punto inicial (Socket.IO no necesita el punto)
    this.broadcastGateway.emitToChannel('menus', 'menu.updated', { menu });
  }

  /**
   * Emite un evento de menú eliminado
   */
  emitMenuDeleted(menuId: number) {
    // Emitir sin el punto inicial (Socket.IO no necesita el punto)
    this.broadcastGateway.emitToChannel('menus', 'menu.deleted', { menu_id: menuId });
  }

  /**
   * Emite un evento personalizado a un canal específico
   */
  emit(channel: string, event: string, data: any) {
    this.broadcastGateway.emitToChannel(channel, event, data);
  }

  /**
   * Emite un evento a todos los clientes conectados
   */
  emitToAll(event: string, data: any) {
    this.broadcastGateway.emitToAll(event, data);
  }
}

