import { IsOptional, IsString, IsInt, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerIncidenciasDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number;

    @IsOptional()
    @IsObject()
    filter?: Record<string, any>;
}

