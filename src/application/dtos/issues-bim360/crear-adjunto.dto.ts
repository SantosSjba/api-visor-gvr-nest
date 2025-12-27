import { IsString, IsOptional, IsObject } from 'class-validator';

export class CrearAdjuntoDto {
    @IsOptional()
    @IsString()
    urn?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    fileName?: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsObject()
    data?: Record<string, any>;
}

