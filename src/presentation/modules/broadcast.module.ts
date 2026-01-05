import { Module } from '@nestjs/common';
import { BroadcastGateway } from '../gateways/broadcast.gateway';
import { BroadcastService } from '../../shared/services/broadcast.service';
import { BroadcastController } from '../controllers/broadcast.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NotificacionesRepository } from '../../infrastructure/repositories/notificaciones.repository';
import { NOTIFICACIONES_REPOSITORY } from '../../domain/repositories/notificaciones.repository.interface';
import { DatabaseFunctionService } from '../../infrastructure/database/database-function.service';

@Module({
  imports: [JwtModule, ConfigModule],
  controllers: [BroadcastController],
  providers: [
    BroadcastGateway,
    BroadcastService,
    DatabaseFunctionService,
    {
      provide: NOTIFICACIONES_REPOSITORY,
      useClass: NotificacionesRepository,
    },
  ],
  exports: [BroadcastService],
})
export class BroadcastModule {}

