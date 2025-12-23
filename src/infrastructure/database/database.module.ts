import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from '../../config/database.config';
import { DatabaseFunctionService } from './database-function.service';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: getDatabaseConfig,
            inject: [ConfigService],
        }),
    ],
    providers: [DatabaseFunctionService],
    exports: [DatabaseFunctionService],
})
export class DatabaseModule { }
