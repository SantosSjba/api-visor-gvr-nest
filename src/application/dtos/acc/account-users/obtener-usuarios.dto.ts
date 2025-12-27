import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ObtenerUsuariosDto {
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

    @IsOptional()
    @IsString()
    @IsIn(['name', 'email', 'created_at', 'updated_at'])
    sort?: string;

    @IsOptional()
    @IsString()
    @IsIn(['name', 'email', 'company_name', 'role', 'status'])
    field?: string;

    @IsOptional()
    @IsString()
    @IsIn(['US', 'EMEA'])
    region?: string;
}


