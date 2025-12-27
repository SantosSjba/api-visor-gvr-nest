import { IsString, IsOptional } from 'class-validator';

export class CrearAdjuntoDto {
    @IsString()
    issueId: string;

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
}

