import { IsOptional, IsInt, IsString, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListarAuditoriasDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    idusuario?: number;

    @IsOptional()
    @IsString()
    accion?: string;

    @IsOptional()
    @IsString()
    entidad?: string;

    @IsOptional()
    @IsDateString()
    fecha_desde?: string;

    @IsOptional()
    @IsDateString()
    fecha_hasta?: string;

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

