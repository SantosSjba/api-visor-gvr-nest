import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerRecursosUsuarioDto {
    @IsOptional()
    @IsString()
    tipo?: string;

    @IsOptional()
    @IsString()
    @IsIn(['creador', 'asignado', 'modifico'])
    rol?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;
}

