import { Module } from '@nestjs/common';
import { BroadcastGateway } from '../gateways/broadcast.gateway';
import { BroadcastService } from '../../shared/services/broadcast.service';
import { BroadcastController } from '../controllers/broadcast.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [JwtModule, ConfigModule],
  controllers: [BroadcastController],
  providers: [BroadcastGateway, BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}

