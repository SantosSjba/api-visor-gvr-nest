import { IsOptional, IsInt, IsString, IsIn, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerUsuariosProyectoDto {
    @IsOptional()
    @IsArray()
    filter?: Record<string, any>;

    @IsOptional()
    @IsArray()
    sort?: string[];

    @IsOptional()
    @IsArray()
    fields?: string[];

    @IsOptional()
    @IsArray()
    orFilters?: string[];

    @IsOptional()
    @IsString()
    @IsIn(['contains', 'startsWith', 'endsWith', 'equals'])
    filterTextMatch?: string;

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
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;

    @IsOptional()
    @IsString()
    user_id?: string;
}

