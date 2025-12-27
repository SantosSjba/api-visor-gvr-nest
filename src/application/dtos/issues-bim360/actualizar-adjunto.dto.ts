import { IsOptional, IsString, IsObject } from 'class-validator';

export class ActualizarAdjuntoDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsObject()
    data?: Record<string, any>;
}

