import { IsOptional, IsString, IsInt, Min, Max, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetProyectosDto {
    @IsOptional()
    @IsString()
    fields?: string;

    @IsOptional()
    @IsString()
    filter_classification?: string;

    @IsOptional()
    @IsString()
    filter_platform?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(v => v.trim());
        }
        return value;
    })
    @IsArray()
    @IsString({ each: true })
    filter_products?: string[];

    @IsOptional()
    @IsString()
    filter_name?: string;

    @IsOptional()
    @IsString()
    filter_type?: string;

    @IsOptional()
    @IsString()
    filter_status?: string;

    @IsOptional()
    @IsString()
    filter_businessUnitId?: string;

    @IsOptional()
    @IsString()
    filter_jobNumber?: string;

    @IsOptional()
    @IsString()
    filter_updatedAt?: string;

    @IsOptional()
    @IsString()
    filterTextMatch?: string;

    @IsOptional()
    @IsString()
    sort?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;

    @IsOptional()
    @IsString()
    token?: string;
}
