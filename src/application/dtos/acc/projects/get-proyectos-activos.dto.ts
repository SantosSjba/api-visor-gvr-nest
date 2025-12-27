import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProyectosActivosDto {
    @IsOptional()
    @IsString()
    fields?: string;

    @IsOptional()
    @IsString()
    filter_type?: string;

    @IsOptional()
    @IsString()
    filter_name?: string;

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
