import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerIncidenciasDto {
    @IsOptional()
    @IsString()
    filter_status?: string;

    @IsOptional()
    @IsString()
    filter_assignedTo?: string;

    @IsOptional()
    @IsString()
    filter_issueTypeId?: string;

    @IsOptional()
    @IsString()
    filter_rootCauseId?: string;

    @IsOptional()
    @IsString()
    filter_locationId?: string;

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
    sort?: string;
}

